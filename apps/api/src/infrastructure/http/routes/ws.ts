import { and, eq, gt } from 'drizzle-orm'
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { db } from '../../persistence/drizzle/client'
import { userSessions } from '../../persistence/drizzle/schema'
import { useCases } from '../../container'
import { pendingAttempts } from './pending-attempts'
import { SessionId } from '../../../domain/shared/types'
import type { EvaluationResult } from '../../../domain/practice/values'
import type { UpgradeWebSocket } from '../ws-adapter'

// ── Concurrent connection limit ───────────────────────────────────────────────
// Maps userId → active WebSocket. One stream per user at a time.
const activeConnections = new Map<string, WSInstance>()

// ── Reconnect cache ───────────────────────────────────────────────────────────
// Maps attemptId → cached stream state. Cleared 60s after stream completes.
interface StreamCache {
  tokens: string[]
  result: EvaluationResult | null
  complete: boolean
  isFinal: boolean
}
const streamCache = new Map<string, StreamCache>()

// ── Minimal WebSocket interface used by handlers ──────────────────────────────
interface WSInstance {
  send: (data: string) => void
  close: (code?: number, reason?: string) => void
}

// ── Message types ─────────────────────────────────────────────────────────────
type ClientMessage = { type: 'submit'; attemptId: string } | { type: 'reconnect'; attemptId: string }

type ServerMessage =
  | { type: 'ready' }
  | { type: 'token'; content: string }
  | { type: 'evaluation'; result: EvaluationResult }
  | { type: 'complete'; isFinal: boolean }
  | { type: 'error'; code: string }

// ── Factory — called from index.ts after initWebSocket ────────────────────────
export function createWsRoutes(upgradeWebSocket: UpgradeWebSocket): Hono {
  const wsRoutes = new Hono()

  wsRoutes.get(
    '/ws/sessions/:id',
    upgradeWebSocket(async (c) => {
      // ── Auth on upgrade (runs before handshake completes) ─────────────────
      const sessionCookie = getCookie(c, 'session')
      if (!sessionCookie) {
        return { onOpen: (_evt: unknown, ws: WSInstance) => ws.close(4001, 'Unauthorized') }
      }

      const userSession = await db.query.userSessions.findFirst({
        where: and(eq(userSessions.id, sessionCookie), gt(userSessions.expiresAt, new Date())),
        with: { user: true },
      })

      if (!userSession) {
        return { onOpen: (_evt: unknown, ws: WSInstance) => ws.close(4001, 'Unauthorized') }
      }

      const user = userSession.user
      const sessionId = c.req.param('id')!

      // Verify session ownership
      const session = await useCases.getSession.execute(SessionId(sessionId))
      if (!session) {
        return { onOpen: (_evt: unknown, ws: WSInstance) => ws.close(4004, 'Session not found') }
      }
      if (session.userId !== user.id) {
        return { onOpen: (_evt: unknown, ws: WSInstance) => ws.close(4003, 'Forbidden') }
      }

      // ── Handlers ──────────────────────────────────────────────────────────
      return {
        onOpen(_evt: unknown, ws: WSInstance) {
          const existing = activeConnections.get(user.id)
          if (existing) existing.close(4008, 'Policy Violation: another connection is active')
          activeConnections.set(user.id, ws)
          send(ws, { type: 'ready' })
        },

        async onMessage(event: { data: unknown }, ws: WSInstance) {
          let msg: ClientMessage
          try {
            msg = JSON.parse(String(event.data)) as ClientMessage
          } catch {
            send(ws, { type: 'error', code: 'INVALID_MESSAGE' })
            return
          }

          if (msg.type === 'reconnect') {
            handleReconnect(ws, msg.attemptId)
            return
          }

          if (msg.type === 'submit') {
            await handleSubmit(ws, msg.attemptId, session.id, user.id)
          }
        },

        onClose() {
          activeConnections.delete(user.id)
        },

        onError(_evt: unknown, ws: WSInstance) {
          activeConnections.delete(user.id)
          ws.close(1011, 'Internal error')
        },
      }
    }),
  )

  return wsRoutes
}

// ── Handle submit ─────────────────────────────────────────────────────────────
async function handleSubmit(ws: WSInstance, attemptId: string, sessionId: string, userId: string) {
  const pending = pendingAttempts.get(attemptId)
  if (!pending) {
    send(ws, { type: 'error', code: 'ATTEMPT_NOT_FOUND' })
    return
  }

  // Refresh session to get current attempt count
  const currentSession = await useCases.getSession.execute(SessionId(sessionId))
  if (!currentSession) {
    send(ws, { type: 'error', code: 'SESSION_NOT_FOUND' })
    return
  }
  if (currentSession.attempts.length >= 2) {
    send(ws, { type: 'error', code: 'ATTEMPT_LIMIT_REACHED' })
    return
  }

  // Get ownerRole/ownerContext from the exercise variation
  const exercise = await useCases.getExerciseById.execute(currentSession.exerciseId)
  const variation = exercise?.variations.find((v) => v.id === currentSession.variationId)

  // Initialize stream cache for reconnect support (ADR-009)
  const cache: StreamCache = { tokens: [], result: null, complete: false, isFinal: false }
  streamCache.set(attemptId, cache)

  pendingAttempts.delete(attemptId)

  try {
    for await (const token of useCases.submitAttempt.execute({
      sessionId: SessionId(pending.sessionId),
      userResponse: pending.userResponse,
      ownerRole: variation?.ownerRole ?? '',
      ownerContext: variation?.ownerContext ?? '',
    })) {
      if (token.chunk) {
        send(ws, { type: 'token', content: token.chunk })
        cache.tokens.push(token.chunk)
      }

      if (token.isFinal && token.result) {
        cache.result = token.result
        cache.complete = true
        cache.isFinal = token.result.isFinalEvaluation

        send(ws, { type: 'evaluation', result: token.result })
        send(ws, { type: 'complete', isFinal: cache.isFinal })

        if (cache.isFinal) ws.close(1000, 'Evaluation complete')
      }
    }
  } catch {
    send(ws, { type: 'error', code: 'LLM_STREAM_ERROR' })
    cache.complete = true
  } finally {
    setTimeout(() => streamCache.delete(attemptId), 60_000)
  }
}

// ── Handle reconnect ──────────────────────────────────────────────────────────
function handleReconnect(ws: WSInstance, attemptId: string) {
  const cache = streamCache.get(attemptId)
  if (!cache) {
    send(ws, { type: 'error', code: 'ATTEMPT_NOT_FOUND' })
    return
  }

  for (const token of cache.tokens) {
    send(ws, { type: 'token', content: token })
  }

  if (cache.complete && cache.result) {
    send(ws, { type: 'evaluation', result: cache.result })
    send(ws, { type: 'complete', isFinal: cache.isFinal })
    if (cache.isFinal) ws.close(1000, 'Evaluation complete')
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function send(ws: WSInstance, msg: ServerMessage): void {
  ws.send(JSON.stringify(msg))
}
