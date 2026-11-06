import { rateLimiter } from 'hono-rate-limiter'
import { config } from '../../../config'
import { clientIp } from '../client-ip'

const keyGenerator = clientIp

// 200 requests per 15 minutes per IP — applied to all routes
export const globalLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  keyGenerator,
  message: { error: 'Too many requests. Try again later.' },
})

// Applied to /auth/* routes. GET /auth/me runs on every page load, and a 429 there reads as signed out.
export const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: config.AUTH_RATE_LIMIT_MAX,
  keyGenerator,
  message: { error: 'Too many authentication attempts. Try again later.' },
})

// 30 reports per minute per IP — for POST /errors from the web client.
// Spikes during a buggy deploy are expected; we just need a ceiling so a
// malicious client cannot fill the errors table.
export const errorReportLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator,
  message: { error: 'Too many error reports.' },
})
