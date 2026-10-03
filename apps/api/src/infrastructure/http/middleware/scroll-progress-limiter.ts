import type { Context } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'

const ipKey = (c: Context): string =>
  c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

// A scroll reports progress as the learner works, so the ceiling is per minute and generous.
export const scrollProgressWriteLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 120,
  keyGenerator: ipKey,
  message: { error: 'Too many progress updates. Try again later.' },
})
