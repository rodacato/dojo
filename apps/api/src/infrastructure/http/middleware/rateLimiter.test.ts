import { Hono } from 'hono'
import { afterEach, describe, expect, it, vi } from 'vitest'

async function authRequests(count: number, max?: string, spoofedIp: (i: number) => string = () => '203.0.113.7'): Promise<number[]> {
  vi.resetModules()
  if (max) vi.stubEnv('AUTH_RATE_LIMIT_MAX', max)
  const { authLimiter } = await import('./rateLimiter')
  const app = new Hono()
  app.use('/auth/*', authLimiter)
  app.get('/auth/me', (c) => c.json({ ok: true }))

  const socket = { incoming: { socket: { remoteAddress: '198.51.100.20' } } }
  const statuses: number[] = []
  for (let i = 0; i < count; i++) {
    const res = await app.request('/auth/me', { headers: { 'cf-connecting-ip': spoofedIp(i), 'x-forwarded-for': spoofedIp(i) } }, socket)
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

  it('cannot be escaped by rotating a client-ip header the operator did not configure', async () => {
    expect(await authRequests(3, '2', (i) => `203.0.113.${i}`)).toEqual([200, 200, 429])
  })
})
