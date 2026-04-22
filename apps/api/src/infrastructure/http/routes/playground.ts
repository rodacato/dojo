import { createHash, randomUUID } from 'node:crypto'
import { Hono, type Context, type MiddlewareHandler, type Next } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { config } from '../../../config'
import { executionQueue } from '../../container'
import { db } from '../../persistence/drizzle/client'
import { playgroundRuns } from '../../persistence/drizzle/schema'
import { optionalAuth } from '../middleware/auth'
import { playgroundGlobalQuotaMiddleware } from '../middleware/playground-quota'
import {
  playgroundAnonIpDayLimiter,
  playgroundAnonIpMinuteLimiter,
  playgroundAuthedUserDayLimiter,
  playgroundAuthedUserMinuteLimiter,
  playgroundSessionDayLimiter,
  playgroundSessionMinuteLimiter,
} from '../middleware/playground-rate-limiters'
import { playgroundTurnstileMiddleware } from '../middleware/playground-turnstile'
import type { AppEnv } from '../app-env'

// Every Piston language we want anonymous visitors to be able to run.
// Narrower than the full adapter LANGUAGE_MAP — javascript (vanilla)
// and the dom-iframe paths do not belong here.
const PLAYGROUND_LANGUAGE_WHITELIST = new Set(['python', 'typescript', 'go', 'ruby', 'rust', 'sql'])

// Browser-session cookie (NOT auth). Anonymous identifier, regenerated
// per browser, used by the per-session rate limiter + burst detection.
// Signed is unnecessary — we hash the value before persisting and we
// only use it to correlate requests from the same browser.
const SESSION_COOKIE = 'dojo_playground_session'
const SESSION_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60

// Zod caps mirror spec 027 §4.4. turnstileToken is optional at the schema
// level — the Turnstile middleware enforces presence when a secret key
// is configured, and its absence is fine in dev (no secret → no-op).
const runSchema = z.object({
  language: z.string().min(1).max(30),
  version: z.string().min(1).max(30),
  code: z.string().min(1).max(16_384),
  turnstileToken: z.string().max(2048).optional(),
})

export const playgroundRoutes = new Hono<AppEnv>()

// Middleware: stamp every playground request with a browser-session id.
// Runs before the per-session rate limiters read it — they look it up
// via c.get('playgroundSessionId'), not getCookie, because set-cookie
// only affects the response and subsequent middleware would not see a
// freshly-issued cookie via getCookie in the same request cycle.
async function ensurePlaygroundSession(c: Context<AppEnv>, next: Next): Promise<void> {
  let sessionId = getCookie(c, SESSION_COOKIE)
  if (!sessionId) {
    sessionId = randomUUID()
    const isProd = config.NODE_ENV === 'production'
    setCookie(c, SESSION_COOKIE, sessionId, {
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
      httpOnly: true,
      // Prod ships the web on dojo.* and the API on dojo-api.* — cross
      // origin. SameSite=None + Secure is the only combination that
      // lets an XHR from the web send this cookie back. In dev both
      // apps share `localhost` and Lax is enough.
      sameSite: isProd ? 'None' : 'Lax',
      secure: isProd,
    })
  }
  c.set('playgroundSessionId', sessionId)
  await next()
}
// Compose the abuse-stack chain into one middleware. Hono's route
// handler overloads cap out around 8 arguments — past that TS loses
// the types — so we combine the ten middlewares into one before mounting.
function composeMiddleware(
  ...mws: MiddlewareHandler<AppEnv>[]
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    let index = -1
    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) throw new Error('next() called multiple times')
      index = i
      const fn = i === mws.length ? next : mws[i]
      if (!fn) return
      await fn(c, () => dispatch(i + 1))
    }
    await dispatch(0)
  }
}

// Abuse-stack chain (spec 027 §4.5 — all four layers now in place):
//   Layer 2 (per-IP RL)   — ✅ playgroundAnonIp*Limiter (anon only)
//                            + playgroundAuthedUser*Limiter (authed only)
//   Layer 3 (per-session) — ✅ playgroundSession*Limiter (anon only)
//   Layer 1 (Turnstile)   — ✅ playgroundTurnstileMiddleware (no-op until
//                            TURNSTILE_SECRET_KEY is set)
//   Layer 4 (global)      — ✅ playgroundGlobalQuotaMiddleware (all traffic)
//
// Order deviates from the spec-numbered layers for cost efficiency:
// rate limiters first (fast, in-memory) drop scrapers before we pay a
// Turnstile siteverify network call; Turnstile then drops invalid
// tokens before we pay a DB query for the global quota.
const playgroundRunChain = composeMiddleware(
  ensurePlaygroundSession,
  optionalAuth,
  playgroundAnonIpMinuteLimiter,
  playgroundAnonIpDayLimiter,
  playgroundSessionMinuteLimiter,
  playgroundSessionDayLimiter,
  playgroundAuthedUserMinuteLimiter,
  playgroundAuthedUserDayLimiter,
  playgroundTurnstileMiddleware,
  playgroundGlobalQuotaMiddleware,
)

playgroundRoutes.post(
  '/playground/run',
  playgroundRunChain,
  async (c) => {
    if (!config.FF_PLAYGROUND_CONSOLE_ENABLED) {
      return c.json({ error: 'Not found' }, 404)
    }

    const body = await c.req.json().catch(() => null)
    const parsed = runSchema.safeParse(body)
    if (!parsed.success) {
      const flat = parsed.error.flatten()
      const codeTooLarge =
        flat.fieldErrors['code']?.some((m) => m.toLowerCase().includes('most')) ?? false
      return c.json(
        { error: codeTooLarge ? 'code_too_large' : 'invalid_request', details: flat },
        400,
      )
    }

    const { language, version, code } = parsed.data

    if (!PLAYGROUND_LANGUAGE_WHITELIST.has(language.toLowerCase())) {
      return c.json({ error: 'invalid_language' }, 400)
    }

    const sessionId = c.get('playgroundSessionId')
    const ip = extractClientIp(c)

    const result = await executionQueue.enqueueRun({ language, version, code })

    // Fire-and-forget log. A failed insert must never block the
    // response — this table is abuse metadata, not a business invariant.
    db.insert(playgroundRuns)
      .values({
        ipHash: hashWithPepper(ip),
        sessionHash: hashWithPepper(sessionId),
        language,
        version,
        exitCode: result.exitCode,
        runtimeMs: result.executionTimeMs,
      })
      .catch((err) => {
        console.error(
          JSON.stringify({
            evt: 'playground.log_insert_failed',
            message: err instanceof Error ? err.message : String(err),
          }),
        )
      })

    return c.json({
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      runtimeMs: result.executionTimeMs,
      timedOut: result.timedOut,
    })
  },
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractClientIp(c: Context<AppEnv>): string {
  // Kamal sits behind Traefik; x-forwarded-for is the authoritative
  // source. Fall back to x-real-ip, then to "unknown" (in dev requests
  // from localhost will also hit "unknown" and that's fine — the limiter
  // collapses them into one bucket, exactly what we want for a dev box).
  const xff = c.req.header('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  const xRealIp = c.req.header('x-real-ip')
  if (xRealIp) return xRealIp.trim()
  return 'unknown'
}

// Hash ip + session with the server's SESSION_SECRET as pepper so a DB
// dump does not leak the underlying values. SESSION_SECRET already
// exists and rotates with the session signing config — reusing it
// avoids a second secret to manage.
function hashWithPepper(value: string): string {
  return createHash('sha256').update(`${value}:${config.SESSION_SECRET}`).digest('hex')
}
