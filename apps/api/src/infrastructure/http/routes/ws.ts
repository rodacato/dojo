import { and, eq, gt } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../../persistence/drizzle/client'
import { userSessions } from '../../persistence/drizzle/schema'
import { useCases } from '../../container'
import { SessionId } from '../../../domain/shared/types'
import type { UpgradeWebSocket } from '../ws-adapter'
import {
  activeConnections,
  handleSubmit,
  handleReconnect,
  send,
  type WSInstance,
  type ClientMessage,
} from './ws-handlers'

// ── Factory — called from index.ts after initWebSocket ────────────────────────
export function createWsRoutes(upgradeWebSocket: UpgradeWebSocket): Hono {
  const wsRoutes = new Hono()

  wsRoutes.get(
    '/ws/sessions/:id',
    upgradeWebSocket(async (c) => {
      // ── Auth on upgrade (runs before handshake completes) ─────────────────
      const url = new URL(c.req.url)
      const token = url.searchParams.get('token')
      if (!token) {
        return { onOpen: (_evt: unknown, ws: WSInstance) => ws.close(4001, 'Unauthorized') }
      }

      const userSession = await db.query.userSessions.findFirst({
        where: and(eq(userSessions.id, token), gt(userSessions.expiresAt, new Date())),
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

        onError(evt: unknown, ws: WSInstance) {
          console.error('WebSocket error for user', user.id, 'session', session.id, evt)
          activeConnections.delete(user.id)
          ws.close(1011, 'Internal error')
        },
      }
    }),
  )

  return wsRoutes
}
