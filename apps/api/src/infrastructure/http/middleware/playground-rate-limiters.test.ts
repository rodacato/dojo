import { Hono } from 'hono'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppEnv } from '../app-env'

async function appWithLimits(perMin: string, perDay: string) {
  vi.resetModules()
  vi.stubEnv('PLAYGROUND_RATE_LIMIT_AUTHED_PER_MIN', perMin)
  vi.stubEnv('PLAYGROUND_RATE_LIMIT_AUTHED_PER_DAY', perDay)
  const { playgroundAuthedUserMinuteLimiter, playgroundAuthedUserDayLimiter } = await import('./playground-rate-limiters')

  const app = new Hono<AppEnv>()
  app.use('/engawa/run', async (c, next) => {
    c.set('user', { id: c.req.header('x-user') } as AppEnv['Variables']['user'])
    await next()
  })
  app.use('/engawa/run', playgroundAuthedUserMinuteLimiter)
  app.use('/engawa/run', playgroundAuthedUserDayLimiter)
  app.post('/engawa/run', (c) => c.json({ ok: true }))

  return async (userId: string, times = 1): Promise<number[]> => {
    const statuses: number[] = []
    for (let i = 0; i < times; i++) {
      const res = await app.request('/engawa/run', {
        method: 'POST',
        headers: { 'x-user': userId, 'cf-connecting-ip': '203.0.113.7' },
      })
      statuses.push(res.status)
    }
    return statuses
  }
}

describe('playground rate limiters', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('rejects a user past PLAYGROUND_RATE_LIMIT_AUTHED_PER_MIN', async () => {
    const run = await appWithLimits('2', '100')
    expect(await run('user-1', 3)).toEqual([200, 200, 429])
  })

  it('rejects a user past PLAYGROUND_RATE_LIMIT_AUTHED_PER_DAY even under the minute limit', async () => {
    const run = await appWithLimits('100', '2')
    expect(await run('user-1', 3)).toEqual([200, 200, 429])
  })

  it('counts each user apart, even from the same IP', async () => {
    const run = await appWithLimits('1', '100')
    expect(await run('user-1', 2)).toEqual([200, 429])
    expect(await run('user-2')).toEqual([200])
  })
})
