import type { Context } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import { config } from '../../../config'

// Playground rate-limit middlewares — Layers 2 and 3 of spec 027 §4.5.
// Six stacked limiters enforce the anon and authed ceilings from env.
// Applied in order on POST /playground/run. The session-cookie pair
// runs only for anon traffic; authed users have user_id accountability
// which already bounds them.
//
// The session id is read from c.get('playgroundSessionId') — populated
// by ensurePlaygroundSession before this middleware runs.

const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

const ipKey = (c: Context): string =>
  c.req.header('cf-connecting-ip') ??
  c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
  c.req.header('x-real-ip')?.trim() ??
  'unknown'

const userKey = (c: Context): string => {
  const user = c.get('user') as { id?: string } | undefined
  return user?.id ?? 'unknown'
}

const sessionKey = (c: Context): string => c.get('playgroundSessionId') ?? 'unknown'

const isAuthed = (c: Context): boolean => Boolean(c.get('user'))

// Anon per-IP minute + day. Skip when the user is authenticated — they
// are tracked by user id instead (accountable, no IP-rotation concern).
export const playgroundAnonIpMinuteLimiter = rateLimiter({
  windowMs: MINUTE_MS,
  limit: config.PLAYGROUND_RATE_LIMIT_ANON_PER_MIN,
  keyGenerator: ipKey,
  skip: isAuthed,
  message: { error: 'rate_limited', scope: 'ip_per_min' },
})

export const playgroundAnonIpDayLimiter = rateLimiter({
  windowMs: DAY_MS,
  limit: config.PLAYGROUND_RATE_LIMIT_ANON_PER_DAY,
  keyGenerator: ipKey,
  skip: isAuthed,
  message: { error: 'rate_limited', scope: 'ip_per_day' },
})

// Authed per-user minute + day. Skip for anon (handled by the IP pair
// above). Authed ceilings are ~6x higher — signed-in users are the
// intended audience and should not be penalized.
export const playgroundAuthedUserMinuteLimiter = rateLimiter({
  windowMs: MINUTE_MS,
  limit: config.PLAYGROUND_RATE_LIMIT_AUTHED_PER_MIN,
  keyGenerator: userKey,
  skip: (c) => !isAuthed(c),
  message: { error: 'rate_limited', scope: 'user_per_min' },
})

export const playgroundAuthedUserDayLimiter = rateLimiter({
  windowMs: DAY_MS,
  limit: config.PLAYGROUND_RATE_LIMIT_AUTHED_PER_DAY,
  keyGenerator: userKey,
  skip: (c) => !isAuthed(c),
  message: { error: 'rate_limited', scope: 'user_per_day' },
})

// Per-browser-session limit — Layer 3. Only applies to anonymous
// traffic (authed already bound by user id). Same ceilings as anon
// IP. Makes raw IP-rotation attacks more expensive: the attacker now
// also has to rotate cookies, which requires actual headless browsers
// instead of a simple HTTP client.
export const playgroundSessionMinuteLimiter = rateLimiter({
  windowMs: MINUTE_MS,
  limit: config.PLAYGROUND_RATE_LIMIT_ANON_PER_MIN,
  keyGenerator: sessionKey,
  skip: isAuthed,
  message: { error: 'rate_limited', scope: 'session_per_min' },
})

export const playgroundSessionDayLimiter = rateLimiter({
  windowMs: DAY_MS,
  limit: config.PLAYGROUND_RATE_LIMIT_ANON_PER_DAY,
  keyGenerator: sessionKey,
  skip: isAuthed,
  message: { error: 'rate_limited', scope: 'session_per_day' },
})
