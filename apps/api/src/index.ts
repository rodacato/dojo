import { config } from './config' // validates env at startup — must be first
import { serve, upgradeWebSocket } from '@hono/node-server'
import { WebSocketServer } from 'ws'
import { createRouter } from './infrastructure/http/router'
import { createWsRoutes } from './infrastructure/http/routes/ws'
import { runMigrations } from './infrastructure/persistence/migrate'
import { log } from './infrastructure/observability/logger'

async function start() {
  await runMigrations()

  const app = createRouter()

  app.route('/', createWsRoutes(upgradeWebSocket))

  serve(
    {
      fetch: app.fetch,
      port: config.API_PORT,
      websocket: { server: new WebSocketServer({ noServer: true }) },
    },
    (info) => {
      log.info('server.started', { port: info.port, env: config.NODE_ENV })
    },
  )
}

start().catch((err) => {
  log.error('server.startup_failed', { err })
  process.exit(1)
})
