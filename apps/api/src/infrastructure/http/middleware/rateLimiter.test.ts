import { Hono } from 'hono'
import { afterEach, describe, expect, it, vi } from 'vitest'

async function authRequests(count: number, max?: string): Promise<number[]> {
  vi.resetModules()
  if (max) vi.stubEnv('AUTH_RATE_LIMIT_MAX', max)
  const { authLimiter } = await import('./rateLimiter')
  const app = new Hono()
  app.use('/auth/*', authLimiter)
  app.get('/auth/me', (c) => c.json({ ok: true }))

  const statuses: number[] = []
  for (let i = 0; i < count; i++) {
    const res = await app.request('/auth/me', { headers: { 'cf-connecting-ip': '203.0.113.7' } })
    statuses.push(res.status)
  }
  return statuses
}

describe('authLimiter', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('survives a burst of page loads by default', async () => {
    const statuses = await authRequests(30)
    expect(statuses.every((status) => status === 200)).toBe(true)
  })

  it('rejects past AUTH_RATE_LIMIT_MAX', async () => {
    expect(await authRequests(3, '2')).toEqual([200, 200, 429])
  })
})
