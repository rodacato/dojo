import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { config } from '../../config'
import { healthRoutes } from './routes/health'
import { authRoutes } from './routes/auth'
import { practiceRoutes } from './routes/practice'
import { feedbackRoutes } from './routes/feedback'
import { preferencesRoutes } from './routes/preferences'
import { dashboardRoutes } from './routes/dashboard'
import { profileRoutes } from './routes/profile'
import { adminRoutes } from './routes/admin-exercises'
import { adminCoursesRoutes } from './routes/admin-courses'
import { adminErrorsRoutes } from './routes/admin-errors'
import { shareRoutes } from './routes/share'
import { learnRoutes } from './routes/learn'
import { ogRoutes } from './routes/og'
import { errorRoutes } from './routes/errors'
import { authLimiter, globalLimiter } from './middleware/rateLimiter'
import { requestIdMiddleware } from './middleware/requestId'
import { errorReporter } from '../container'
import type { AppEnv } from './app-env'

export function createRouter() {
  const app = new Hono<AppEnv>()

  app.use('*', requestIdMiddleware)
  app.use('*', logger())
  app.use('*', cors({ origin: config.WEB_URL }))
  app.use('*', globalLimiter)
  app.use('/auth/*', authLimiter)

  app.route('/', healthRoutes)
  app.route('/', authRoutes)
  app.route('/', practiceRoutes)
  app.route('/', feedbackRoutes)
  app.route('/', preferencesRoutes)
  app.route('/', dashboardRoutes)
  app.route('/', profileRoutes)
  app.route('/', shareRoutes)
  app.route('/', learnRoutes)
  app.route('/', ogRoutes)
  app.route('/', errorRoutes)
  app.route('/admin', adminRoutes)
  app.route('/admin/courses', adminCoursesRoutes)
  app.route('/admin/errors', adminErrorsRoutes)

  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()

    if (err.name === 'DomainError') {
      const code = (err as { code?: string }).code
      return c.json({ error: err.message, code }, domainErrorToStatus(code))
    }

    // Fire-and-forget: never block the error response on a reporter issue.
    // CompositeErrorReporter already swallows per-adapter failures.
    void errorReporter.report({
      message: err.message,
      stack: err.stack,
      status: 500,
      source: 'api',
      route: c.req.path,
      method: c.req.method,
      userId: c.get('user')?.id,
      requestId: c.get('requestId'),
    })

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
