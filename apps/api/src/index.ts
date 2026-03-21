import './config' // validates env at startup — must be first
import { serve } from '@hono/node-server'
import { config } from './config'
import { createRouter } from './infrastructure/http/router'

const app = createRouter()

serve({ fetch: app.fetch, port: config.API_PORT }, (info) => {
  console.log(`dojo_ api running on port ${info.port}`)
})
