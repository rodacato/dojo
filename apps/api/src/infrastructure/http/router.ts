import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { config } from '../../config'
import { healthRoutes } from './routes/health'
import { authRoutes } from './routes/auth'
import { practiceRoutes } from './routes/practice'
import { dashboardRoutes } from './routes/dashboard'
import { profileRoutes } from './routes/profile'
import { adminRoutes } from './routes/admin-exercises'
import { shareRoutes } from './routes/share'
import { ogRoutes } from './routes/og'
import { authLimiter, globalLimiter } from './middleware/rateLimiter'

export function createRouter() {
  const app = new Hono()

  app.use('*', logger())
  app.use('*', cors({ origin: config.WEB_URL }))
  app.use('*', globalLimiter)
  app.use('/auth/*', authLimiter)

  app.route('/', healthRoutes)
  app.route('/', authRoutes)
  app.route('/', practiceRoutes)
  app.route('/', dashboardRoutes)
  app.route('/', profileRoutes)
  app.route('/', shareRoutes)
  app.route('/', ogRoutes)
  app.route('/admin', adminRoutes)

  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()

    if (err.name === 'DomainError') {
      const code = (err as { code?: string }).code
      return c.json({ error: err.message, code }, domainErrorToStatus(code))
    }

    console.error('Unhandled error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  })

  return app
}

function domainErrorToStatus(code?: string): ContentfulStatusCode {
  switch (code) {
    case 'SESSION_NOT_FOUND':
    case 'EXERCISE_NOT_FOUND':
      return 404
    case 'SESSION_ALREADY_COMPLETED':
      return 409
    case 'SESSION_EXPIRED':
      return 408
    case 'NO_ELIGIBLE_EXERCISES':
      return 422
    default:
      return 500
  }
}
