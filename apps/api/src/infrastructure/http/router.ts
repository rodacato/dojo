import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { config } from '../../config'
import { healthRoutes } from './routes/health'
// other routes imported here as they are created

export function createRouter() {
  const app = new Hono()

  app.use('*', logger())
  app.use('*', cors({ origin: config.WEB_URL, credentials: true }))

  app.route('/', healthRoutes)
  // app.route('/', sessionRoutes)   ← added in later phases
  // app.route('/', authRoutes)      ← added in Phase 6

  return app
}
