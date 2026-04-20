import { createNodeWebSocket } from '@hono/node-ws'
import type { Hono } from 'hono'
import type { ServerType } from '@hono/node-server'

type NodeWebSocket = ReturnType<typeof createNodeWebSocket>

export type UpgradeWebSocket = NodeWebSocket['upgradeWebSocket']

let _inject: NodeWebSocket['injectWebSocket'] | undefined

// Accept any Hono app regardless of its Env generics — `createNodeWebSocket`
// only needs the underlying `fetch`/`router` shape, which is the same.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initWebSocket(app: Hono<any, any, any>): UpgradeWebSocket {
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })
  _inject = injectWebSocket
  return upgradeWebSocket
}

export function injectWebSocket(server: ServerType): void {
  if (!_inject) throw new Error('initWebSocket must be called before injectWebSocket')
  _inject(server)
}
