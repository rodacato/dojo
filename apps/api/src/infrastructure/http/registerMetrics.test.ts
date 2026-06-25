import { Hono } from 'hono'
import { afterEach, describe, expect, it } from 'vitest'
import { registerMetrics, type RegisterMetricsOptions } from './registerMetrics'
import { getMetrics, recordSenseiEvaluation, resetMetrics } from '../observability/prometheus'
import type { AppEnv } from './app-env'

afterEach(() => resetMetrics())

function buildApp(opts: RegisterMetricsOptions): Hono<AppEnv> {
  const app = new Hono<AppEnv>()
  registerMetrics(app, opts)
  app.get('/sessions/:id', (c) => c.text('ok'))
  return app
}

const enabledDev: RegisterMetricsOptions = { enabled: true, token: 'secret', isProduction: false }

describe('registerMetrics', () => {
  it('mounts nothing when disabled', async () => {
    const app = buildApp({ enabled: false, token: 'secret', isProduction: true })
    const res = await app.request('/metrics', { headers: { authorization: 'Bearer secret' } })
    expect(res.status).toBe(404)
  })

  it('serves metrics with a valid token using the prometheus content type', async () => {
    const app = buildApp(enabledDev)
    const res = await app.request('/metrics', { headers: { authorization: 'Bearer secret' } })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe(getMetrics()?.registry.contentType)

    const body = await res.text()
    expect(body).toContain('process_cpu_seconds_total') // default metrics
    expect(body).toContain('http_request_duration_seconds') // HTTP metric
    expect(body).toContain('dojo_sensei_evaluations_total') // business metric
  })

  it('returns 401 with a wrong token', async () => {
    const app = buildApp(enabledDev)
    const res = await app.request('/metrics', { headers: { authorization: 'Bearer wrong' } })
    expect(res.status).toBe(401)
  })

  it('returns 401 with no token header when a token is required', async () => {
    const app = buildApp(enabledDev)
    const res = await app.request('/metrics')
    expect(res.status).toBe(401)
  })

  it('returns 404 in production when enabled but no token is set', async () => {
    const app = buildApp({ enabled: true, token: '', isProduction: true })
    const res = await app.request('/metrics')
    expect(res.status).toBe(404)
  })

  it('is open in dev when no token is set', async () => {
    const app = buildApp({ enabled: true, token: '', isProduction: false })
    const res = await app.request('/metrics')
    expect(res.status).toBe(200)
  })

  it('labels the histogram with the matched route pattern, not the raw url', async () => {
    const app = buildApp(enabledDev)
    await app.request('/sessions/123')
    const body = await (
      await app.request('/metrics', { headers: { authorization: 'Bearer secret' } })
    ).text()
    expect(body).toContain('route="/sessions/:id"')
    expect(body).not.toContain('route="/sessions/123"')
  })

  it('collapses unmatched requests to a single "unmatched" label', async () => {
    const app = buildApp(enabledDev)
    await app.request('/does-not-exist')
    const body = await (
      await app.request('/metrics', { headers: { authorization: 'Bearer secret' } })
    ).text()
    expect(body).toContain('route="unmatched"')
  })

  it('records sensei evaluations by verdict', async () => {
    const app = buildApp(enabledDev)
    recordSenseiEvaluation('passed')
    recordSenseiEvaluation('needs_work')
    const body = await (
      await app.request('/metrics', { headers: { authorization: 'Bearer secret' } })
    ).text()
    expect(body).toContain('dojo_sensei_evaluations_total{verdict="passed"} 1')
    expect(body).toContain('dojo_sensei_evaluations_total{verdict="needs_work"} 1')
  })
})
