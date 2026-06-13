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
import { adminKatasRoutes } from './routes/admin-katas'
import { adminScrollsRoutes } from './routes/admin-scrolls'
import { adminErrorsRoutes } from './routes/admin-errors'
import { adminPistonRoutes } from './routes/admin-piston'
import { shareRoutes } from './routes/share'
import { scrollRoutes } from './routes/scrolls'
import { beltsRoutes } from './routes/belts'
import { playgroundRoutes } from './routes/playground'
import { ogRoutes } from './routes/og'
import { errorRoutes } from './routes/errors'
import { landingRoutes } from './routes/landing'
import { authLimiter, globalLimiter } from './middleware/rateLimiter'
import { requestIdMiddleware } from './middleware/requestId'
import { errorReporter } from '../container'
import type { AppEnv } from './app-env'

export function createRouter() {
  const app = new Hono<AppEnv>()

  app.use('*', requestIdMiddleware)
  app.use('*', logger())
  // credentials:true — required so the playground's dojo_playground_session
  // cookie flows on cross-origin XHR in prod (web on dojo.*, API on dojo-api.*).
  // All other auth uses Bearer tokens from localStorage, so allowing cookies
  // here doesn't widen the auth surface; oauth_state and the playground cookie
  // are both HttpOnly.
  app.use('*', cors({ origin: config.WEB_URL, credentials: true }))
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
  app.route('/', scrollRoutes)
  app.route('/', beltsRoutes)
  app.route('/', playgroundRoutes)
  app.route('/', ogRoutes)
  app.route('/', errorRoutes)
  app.route('/', landingRoutes)
  app.route('/admin', adminKatasRoutes)
  app.route('/admin/scrolls', adminScrollsRoutes)
  app.route('/admin/errors', adminErrorsRoutes)
  app.route('/admin/piston', adminPistonRoutes)

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
    case 'KATA_NOT_FOUND':
      return 404
    case 'SESSION_ALREADY_COMPLETED':
      return 409
    case 'SESSION_EXPIRED':
      return 408
    case 'NO_ELIGIBLE_KATAS':
      return 422
    default:
      return 500
  }
}
