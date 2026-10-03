import type { Context } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import { config } from '../../../config'

const MINUTE_MS = 60 * 1000

const userKey = (c: Context): string => (c.get('user') as { id?: string } | undefined)?.id ?? 'unknown'

export function createScrollExecutionLimiter(limitPerMinute: number) {
  return rateLimiter({
    windowMs: MINUTE_MS,
    limit: limitPerMinute,
    keyGenerator: userKey,
    message: { error: 'rate_limited', scope: 'user_per_min' },
  })
}

export const scrollExecutionLimiter = createScrollExecutionLimiter(config.SCROLL_EXEC_USER_PER_MINUTE)
