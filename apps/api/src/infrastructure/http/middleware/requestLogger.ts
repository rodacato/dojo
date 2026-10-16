import type { MiddlewareHandler } from 'hono'
import { log, runWithLogContext } from '../../observability/logger'
import type { AppEnv } from '../app-env'

const QUIET_PATHS = new Set(['/health', '/metrics'])

function levelFor(status: number): 'info' | 'warn' | 'error' {
  if (status >= 500) return 'error'
  return status >= 400 ? 'warn' : 'info'
}

// Must run after requestIdMiddleware: seeds the log context and emits one
// access event per request, with the user resolved by auth further down.
export const requestLoggerMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const startedAt = performance.now()

  await runWithLogContext({ requestId: c.get('requestId') }, async () => {
    await next()

    const status = c.res.status
    if (QUIET_PATHS.has(c.req.path) && status < 400) return

    log[levelFor(status)]('http.request', {
      method: c.req.method,
      route: c.req.routePath,
      path: c.req.path,
      status,
      durationMs: Math.round(performance.now() - startedAt),
      userId: c.get('user')?.id,
    })
  })
}
