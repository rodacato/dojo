import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppEnv } from '../app-env'

// Boundaries mocked: config (the ceiling) and the drizzle COUNT(*) query. The
// cache logic, day-key/TTL staleness, the optimistic increment and the 503
// decision are the real code under test. The clock is controlled with fake
// timers to exercise the TTL window and UTC day rollover without sleeping.
const { mockConfig, selectWhere } = vi.hoisted(() => ({
  mockConfig: { PLAYGROUND_DAILY_QUOTA_GLOBAL: 5000 },
  selectWhere: vi.fn(),
}))

vi.mock('../../../config', () => ({ config: mockConfig }))

vi.mock('../../persistence/drizzle/client', () => ({
  db: { select: vi.fn(() => ({ from: vi.fn(() => ({ where: selectWhere })) })) },
}))

vi.mock('../../persistence/drizzle/schema', () => ({
  playgroundRuns: { createdAt: 'pr.createdAt' },
}))

import {
  checkGlobalPlaygroundQuota,
  recordPlaygroundRunInCache,
  _resetPlaygroundQuotaCache,
  playgroundGlobalQuotaMiddleware,
} from './playground-quota'

function dbCount(n: number) {
  selectWhere.mockResolvedValue([{ count: n }])
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-21T12:00:00.000Z'))
  mockConfig.PLAYGROUND_DAILY_QUOTA_GLOBAL = 5000
  _resetPlaygroundQuotaCache()
  selectWhere.mockReset()
  dbCount(0)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('checkGlobalPlaygroundQuota', () => {
  it('allows when the DB count is below the ceiling', async () => {
    mockConfig.PLAYGROUND_DAILY_QUOTA_GLOBAL = 100
    dbCount(99)
    const r = await checkGlobalPlaygroundQuota()
    expect(r.allowed).toBe(true)
    expect(r.count).toBe(99)
    expect(r.ceiling).toBe(100)
  })

  it('blocks when the count has reached the ceiling (>= is the boundary)', async () => {
    mockConfig.PLAYGROUND_DAILY_QUOTA_GLOBAL = 100
    dbCount(100)
    const r = await checkGlobalPlaygroundQuota()
    expect(r.allowed).toBe(false)
  })

  it('resetAt is the next UTC midnight', async () => {
    const r = await checkGlobalPlaygroundQuota()
    expect(r.resetAt.toISOString()).toBe('2026-06-22T00:00:00.000Z')
  })

  it('caches the DB count within the 30s TTL — second call does NOT re-query', async () => {
    dbCount(10)
    await checkGlobalPlaygroundQuota()
    dbCount(999) // would change the answer if a re-query happened
    vi.advanceTimersByTime(29_000)
    const r = await checkGlobalPlaygroundQuota()
    expect(r.count).toBe(10)
    expect(selectWhere).toHaveBeenCalledTimes(1)
  })

  it('re-queries the DB once the TTL has elapsed', async () => {
    dbCount(10)
    await checkGlobalPlaygroundQuota()
    dbCount(42)
    vi.advanceTimersByTime(31_000)
    const r = await checkGlobalPlaygroundQuota()
    expect(r.count).toBe(42)
    expect(selectWhere).toHaveBeenCalledTimes(2)
  })

  it('re-queries when the UTC day rolls over even inside the TTL window', async () => {
    vi.setSystemTime(new Date('2026-06-21T23:59:50.000Z'))
    dbCount(10)
    await checkGlobalPlaygroundQuota()
    dbCount(0) // fresh day, counter reset in DB
    vi.advanceTimersByTime(20_000) // crosses midnight, still < 30s TTL
    const r = await checkGlobalPlaygroundQuota()
    expect(r.count).toBe(0)
    expect(selectWhere).toHaveBeenCalledTimes(2)
  })

  it('treats a null/empty count row as zero', async () => {
    selectWhere.mockResolvedValue([{ count: null }])
    const r = await checkGlobalPlaygroundQuota()
    expect(r.count).toBe(0)
    expect(r.allowed).toBe(true)
  })
})

describe('recordPlaygroundRunInCache', () => {
  it('increments the cached count so the next check sees it without a re-query', async () => {
    mockConfig.PLAYGROUND_DAILY_QUOTA_GLOBAL = 11
    dbCount(10)
    expect((await checkGlobalPlaygroundQuota()).allowed).toBe(true) // 10 < 11
    recordPlaygroundRunInCache() // optimistic +1 -> 11
    dbCount(999) // prove the next allow/deny comes from cache, not the DB
    const r = await checkGlobalPlaygroundQuota()
    expect(r.count).toBe(11)
    expect(r.allowed).toBe(false) // 11 is no longer < 11
    expect(selectWhere).toHaveBeenCalledTimes(1)
  })

  it('is a no-op when there is no warm cache', () => {
    _resetPlaygroundQuotaCache()
    expect(() => recordPlaygroundRunInCache()).not.toThrow()
  })

  it('does not bump a cache left over from a previous UTC day', async () => {
    vi.setSystemTime(new Date('2026-06-21T23:59:55.000Z'))
    dbCount(5)
    await checkGlobalPlaygroundQuota() // warms cache for the 21st
    vi.advanceTimersByTime(10_000) // now the 22nd
    recordPlaygroundRunInCache() // stale-day guard => no bump
    dbCount(0)
    const r = await checkGlobalPlaygroundQuota()
    expect(r.count).toBe(0)
  })
})

describe('playgroundGlobalQuotaMiddleware', () => {
  function makeApp(handlerStatus = 200) {
    const app = new Hono<AppEnv>()
    app.use('/run', playgroundGlobalQuotaMiddleware)
    app.post('/run', (c) => c.json({ ok: true }, handlerStatus as 200))
    return app
  }
  const hit = (status = 200) => makeApp(status).request('/run', { method: 'POST' })

  it('passes through to the handler when under the ceiling', async () => {
    mockConfig.PLAYGROUND_DAILY_QUOTA_GLOBAL = 100
    dbCount(0)
    const res = await hit()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('returns 503 quota_exceeded with a Retry-After header when over the ceiling', async () => {
    mockConfig.PLAYGROUND_DAILY_QUOTA_GLOBAL = 1
    dbCount(1)
    const res = await hit()
    expect(res.status).toBe(503)
    const body = (await res.json()) as { error: string; ceiling: number; retryAfter: string }
    expect(body.error).toBe('quota_exceeded')
    expect(body.ceiling).toBe(1)
    expect(body.retryAfter).toBe('2026-06-22T00:00:00.000Z')
    // 12:00:00 -> next midnight is 12h = 43200s.
    expect(res.headers.get('Retry-After')).toBe('43200')
  })

  it('bumps the cache on a 2xx so the next request sees the increment', async () => {
    mockConfig.PLAYGROUND_DAILY_QUOTA_GLOBAL = 2
    dbCount(0)
    await hit(200) // count 0 -> bump to 1
    await hit(200) // count 1 -> bump to 2
    dbCount(999) // prove the block below is cache-driven
    const res = await hit(200) // count now 2, ceiling 2 -> blocked before handler
    expect(res.status).toBe(503)
    expect(selectWhere).toHaveBeenCalledTimes(1)
  })

  it('does NOT bump the cache on a non-2xx response', async () => {
    mockConfig.PLAYGROUND_DAILY_QUOTA_GLOBAL = 100
    dbCount(10)
    const res = await hit(400) // handler errors; should not count toward quota
    expect(res.status).toBe(400)
    const r = await checkGlobalPlaygroundQuota()
    expect(r.count).toBe(10) // unchanged
  })
})
