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

// 5 requests per hour per IP — applied to POST /sessions (starts a kata)
// Each session start triggers an LLM call — this is the primary cost control.
export const sessionLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator,
  message: { error: 'Session limit reached. You can start up to 5 kata per hour.' },
})
