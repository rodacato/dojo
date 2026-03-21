import { createNodeWebSocket } from '@hono/node-ws'
import type { Hono } from 'hono'
import type { ServerType } from '@hono/node-server'

type NodeWebSocket = ReturnType<typeof createNodeWebSocket>

export type UpgradeWebSocket = NodeWebSocket['upgradeWebSocket']

let _inject: NodeWebSocket['injectWebSocket'] | undefined

export function initWebSocket(app: Hono): UpgradeWebSocket {
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })
  _inject = injectWebSocket
  return upgradeWebSocket
}

export function injectWebSocket(server: ServerType): void {
  if (!_inject) throw new Error('initWebSocket must be called before injectWebSocket')
  _inject(server)
}
