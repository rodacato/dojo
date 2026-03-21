import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: `http://localhost:${process.env.WEB_PORT || 5173}`,
  }),
)

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const port = Number(process.env.API_PORT) || 3001

console.log(`dojo_ api running on port ${port}`)
serve({ fetch: app.fetch, port })
