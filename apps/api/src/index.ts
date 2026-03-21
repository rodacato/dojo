import './config' // validates env at startup — must be first
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { config } from './config'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: config.WEB_URL, credentials: true }))

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

console.log(`dojo_ api running on port ${config.API_PORT}`)
serve({ fetch: app.fetch, port: config.API_PORT })
