import { createHash, timingSafeEqual } from 'node:crypto'
import type { Hono } from 'hono'
import type { AppEnv } from './app-env'
import { initMetrics } from '../observability/prometheus'

export interface RegisterMetricsOptions {
  enabled: boolean
  token: string
  isProduction: boolean
}

// Mounts the request-timing middleware and the /metrics endpoint. Call this
// BEFORE the rate limiters in createRouter so scraping is never throttled and
// even 429 responses are measured. When disabled it mounts nothing — no
// endpoint, no default metrics, no middleware — so a self-hoster who doesn't
// want metrics pays zero overhead.
export function registerMetrics(app: Hono<AppEnv>, opts: RegisterMetricsOptions): void {
  if (!opts.enabled) return

  const metrics = initMetrics()

  app.use('*', async (c, next) => {
    const start = process.hrtime.bigint()
    await next()
    const seconds = Number(process.hrtime.bigint() - start) / 1e9
    // routePath is the matched pattern (e.g. /sessions/:id); '/*' means no
    // product route matched — collapse it so random 404 probes can't blow up
    // label cardinality.
    const route = c.req.routePath === '/*' ? 'unmatched' : c.req.routePath
    metrics.httpRequestDuration.observe(
      { method: c.req.method, route, status_code: String(c.res.status) },
      seconds,
    )
  })

  app.get('/metrics', async (c) => {
    if (!isAuthorized(c.req.header('authorization'), opts)) {
      // No token in production → hide the endpoint entirely rather than ever
      // serve metrics unauthenticated.
      if (!opts.token && opts.isProduction) return c.notFound()
      return c.text('Unauthorized', 401)
    }
    return c.body(await metrics.registry.metrics(), 200, {
      'Content-Type': metrics.registry.contentType,
    })
  })
}

function isAuthorized(authHeader: string | undefined, opts: RegisterMetricsOptions): boolean {
  // No token configured: open in dev for convenience, refused in prod (the
  // caller turns the 404 into the response).
  if (!opts.token) return !opts.isProduction

  const provided = bearerToken(authHeader)
  return provided !== null && constantTimeEqual(provided, opts.token)
}

function bearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null
  const [scheme, value] = authHeader.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !value) return null
  return value
}

// Hash both sides to a fixed length before comparing so timingSafeEqual never
// throws on unequal input lengths; the raw-length check guards the (negligible)
// hash-collision case.
function constantTimeEqual(a: string, b: string): boolean {
  const ah = createHash('sha256').update(a).digest()
  const bh = createHash('sha256').update(b).digest()
  return a.length === b.length && timingSafeEqual(ah, bh)
}
