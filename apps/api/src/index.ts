import { config } from './config' // validates env at startup — must be first
import { serve, upgradeWebSocket } from '@hono/node-server'
import { WebSocketServer } from 'ws'
import { createRouter } from './infrastructure/http/router'
import { createWsRoutes } from './infrastructure/http/routes/ws'
import { runMigrations } from './infrastructure/persistence/migrate'

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
      console.log(`dojo_ api running on port ${info.port}`)
    },
  )
}

start().catch((err) => {
  console.error('Startup failed:', err)
  process.exit(1)
})
