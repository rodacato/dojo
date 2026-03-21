import './config' // validates env at startup — must be first
import { serve } from '@hono/node-server'
import { config } from './config'
import { createRouter } from './infrastructure/http/router'
import { initWebSocket, injectWebSocket } from './infrastructure/http/ws-adapter'
import { createWsRoutes } from './infrastructure/http/routes/ws'

const app = createRouter()

// initWebSocket must run before createWsRoutes so upgradeWebSocket is available
const upgradeWebSocket = initWebSocket(app)
app.route('/', createWsRoutes(upgradeWebSocket))

const server = serve({ fetch: app.fetch, port: config.API_PORT }, (info) => {
  console.log(`dojo_ api running on port ${info.port}`)
})

injectWebSocket(server)
