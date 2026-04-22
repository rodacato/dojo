import { count, gte } from 'drizzle-orm'
import type { MiddlewareHandler } from 'hono'
import { config } from '../../../config'
import { db } from '../../persistence/drizzle/client'
import { playgroundRuns } from '../../persistence/drizzle/schema'
import type { AppEnv } from '../app-env'

// Layer 4 of spec 027 §4.5 — global daily quota across all traffic.
// Separate from kata/courses: once the playground ceiling is hit,
// /playground/run returns 503 but every other endpoint keeps working.
//
// Implementation is a cached DB COUNT(*) with a short TTL. At the
// 5000/day default and a 30s cache, the real ceiling can overshoot
// by at most (RPS × 30s), which is comfortably under the ceiling
// at any realistic traffic level. If we ever need exact enforcement,
// the next step is a process-local counter reconciled against the DB
// on boot — same contract, tighter seams.

const CACHE_TTL_MS = 30_000

interface QuotaCache {
  count: number
  fetchedAt: number
  dayKey: string
}

let cache: QuotaCache | null = null

function todayKeyUtc(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

function dayStartUtc(d = new Date()): Date {
  const r = new Date(d)
  r.setUTCHours(0, 0, 0, 0)
  return r
}

function nextDayStartUtc(d = new Date()): Date {
  const r = dayStartUtc(d)
  r.setUTCDate(r.getUTCDate() + 1)
  return r
}

export async function checkGlobalPlaygroundQuota(): Promise<{
  allowed: boolean
  count: number
  ceiling: number
  resetAt: Date
}> {
  const now = Date.now()
  const dayKey = todayKeyUtc()

  const stale =
    !cache ||
    cache.dayKey !== dayKey ||
    now - cache.fetchedAt > CACHE_TTL_MS

  if (stale) {
    const [row] = await db
      .select({ count: count() })
      .from(playgroundRuns)
      .where(gte(playgroundRuns.createdAt, dayStartUtc()))
    cache = {
      count: Number(row?.count ?? 0),
      fetchedAt: now,
      dayKey,
    }
  }

  const current = cache!
  return {
    allowed: current.count < config.PLAYGROUND_DAILY_QUOTA_GLOBAL,
    count: current.count,
    ceiling: config.PLAYGROUND_DAILY_QUOTA_GLOBAL,
    resetAt: nextDayStartUtc(),
  }
}

// Optimistic in-memory increment so consecutive requests within the
// same cache window see a fresh count. Without this a burst right at
// the ceiling could slip a handful of extras through while the cache
// is warm.
export function recordPlaygroundRunInCache(): void {
  if (!cache) return
  if (cache.dayKey !== todayKeyUtc()) return
  cache.count += 1
}

// Test-only — reset the cache between tests so state doesn't bleed.
// Exported with an underscore prefix to signal "do not call in prod code".
export function _resetPlaygroundQuotaCache(): void {
  cache = null
}

export const playgroundGlobalQuotaMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const check = await checkGlobalPlaygroundQuota()
  if (!check.allowed) {
    const retrySeconds = Math.max(1, Math.ceil((check.resetAt.getTime() - Date.now()) / 1000))
    c.header('Retry-After', String(retrySeconds))
    return c.json(
      {
        error: 'quota_exceeded',
        retryAfter: check.resetAt.toISOString(),
        ceiling: check.ceiling,
      },
      503,
    )
  }

  await next()

  // Bump the cache only on a successful response — 4xx/5xx shouldn't
  // count toward the daily ceiling (the user wasn't served code execution).
  if (c.res.status >= 200 && c.res.status < 300) {
    recordPlaygroundRunInCache()
  }
}
