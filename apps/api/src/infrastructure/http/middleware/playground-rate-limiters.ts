import type { Context } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import { config } from '../../../config'

// Playground runs are signed-in only (ADR 035), so the ceilings are per user id.

const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

const userKey = (c: Context): string => {
  const user = c.get('user') as { id?: string } | undefined
  return user?.id ?? 'unknown'
}

export const playgroundAuthedUserMinuteLimiter = rateLimiter({
  windowMs: MINUTE_MS,
  limit: config.PLAYGROUND_RATE_LIMIT_AUTHED_PER_MIN,
  keyGenerator: userKey,
  message: { error: 'rate_limited', scope: 'user_per_min' },
})

export const playgroundAuthedUserDayLimiter = rateLimiter({
  windowMs: DAY_MS,
  limit: config.PLAYGROUND_RATE_LIMIT_AUTHED_PER_DAY,
  keyGenerator: userKey,
  message: { error: 'rate_limited', scope: 'user_per_day' },
})
