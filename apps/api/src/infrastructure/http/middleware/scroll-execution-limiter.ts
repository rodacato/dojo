import type { Context } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import { config } from '../../../config'

const MINUTE_MS = 60 * 1000

const userKey = (c: Context): string => (c.get('user') as { id?: string } | undefined)?.id ?? 'unknown'

export function createUserMinuteLimiter(limitPerMinute: number) {
  return rateLimiter({
    windowMs: MINUTE_MS,
    limit: limitPerMinute,
    keyGenerator: userKey,
    message: { error: 'rate_limited', scope: 'user_per_min' },
  })
}

export const scrollExecutionLimiter = createUserMinuteLimiter(config.SCROLL_EXEC_USER_PER_MINUTE)

/** Run tests inside a kata: a learner fixing a bug runs them a few times, never in a loop. */
export const kataRunLimiter = createUserMinuteLimiter(10)
