import { Hono } from 'hono'
import { findActiveSession } from '../middleware/auth'
import { useCases } from '../../container'
import { SessionId } from '../../../domain/shared/types'
import type { upgradeWebSocket as nodeUpgradeWebSocket } from '@hono/node-server'
import { log } from '../../observability/logger'
import {
  activeConnections,
  handleSubmit,
  handleReconnect,
  send,
  type WSInstance,
  type ClientMessage,
} from './ws-handlers'

// An evicted socket closes after its replacement registered; it must not
// unregister the replacement.
function releaseConnection(userId: string, ws: WSInstance): void {
  if (activeConnections.get(userId) === ws) activeConnections.delete(userId)
}

export type UpgradeWebSocket = typeof nodeUpgradeWebSocket

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

      const userSession = await findActiveSession(token)

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

          // JSON.parse also yields null, numbers and strings; an unguarded
          // property read would reject the async handler with nobody awaiting it.
          if (typeof msg !== 'object' || msg === null) {
            send(ws, { type: 'error', code: 'INVALID_MESSAGE' })
            return
          }

          try {
            if (msg.type === 'reconnect') {
              handleReconnect(ws, msg.attemptId)
              return
            }

            if (msg.type === 'submit') {
              await handleSubmit(ws, msg.attemptId, session.id, user.id)
            }
          } catch (err) {
            log.error('ws.handler_failed', { userId: user.id, sessionId: session.id, err })
            send(ws, { type: 'error', code: 'INTERNAL_ERROR' })
          }
        },

        onClose(_evt: unknown, ws: WSInstance) {
          releaseConnection(user.id, ws)
        },

        onError(evt: unknown, ws: WSInstance) {
          const err = (evt as { error?: unknown } | null)?.error ?? evt
          log.error('ws.socket_error', { userId: user.id, sessionId: session.id, err })
          releaseConnection(user.id, ws)
          ws.close(1011, 'Internal error')
        },
      }
    }),
  )

  return wsRoutes
}
