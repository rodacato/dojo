import { rateLimiter } from 'hono-rate-limiter'
import { clientIp } from '../client-ip'

// A scroll reports progress as the learner works, so the ceiling is per minute and generous.
export const scrollProgressWriteLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 120,
  keyGenerator: clientIp,
  message: { error: 'Too many progress updates. Try again later.' },
})
