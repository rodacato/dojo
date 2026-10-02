import type { Context } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'

// Key extractor: uses Cloudflare real IP when behind Cloudflare Tunnel,
// falls back to X-Forwarded-For, then the direct connection IP.
const keyGenerator = (c: Context): string =>
  c.req.header('cf-connecting-ip') ??
  c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
  'unknown'

// 200 requests per 15 minutes per IP — applied to all routes
export const globalLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  keyGenerator,
  message: { error: 'Too many requests. Try again later.' },
})

// 10 requests per 15 minutes per IP — applied to /auth/* routes
export const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
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
