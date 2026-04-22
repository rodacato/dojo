import { createHash, randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { config } from '../../../config'
import { executionQueue } from '../../container'
import { db } from '../../persistence/drizzle/client'
import { playgroundRuns } from '../../persistence/drizzle/schema'
import type { AppEnv } from '../app-env'

// Every Piston language we want anonymous visitors to be able to run.
// Narrower than the full adapter LANGUAGE_MAP — javascript (vanilla)
// and the dom-iframe paths do not belong here.
const PLAYGROUND_LANGUAGE_WHITELIST = new Set(['python', 'typescript', 'go', 'ruby', 'rust', 'sql'])

// Browser-session cookie (NOT auth). Anonymous identifier, regenerated
// per browser, used by the upcoming per-session rate limiter. Signed is
// unnecessary — we hash the value before storing, and we only use it
// to correlate requests from the same browser.
const SESSION_COOKIE = 'dojo_playground_session'
const SESSION_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60

// Zod caps mirror spec 027 §4.4.
const runSchema = z.object({
  language: z.string().min(1).max(30),
  version: z.string().min(1).max(30),
  code: z.string().min(1).max(16_384),
})

export const playgroundRoutes = new Hono<AppEnv>()

// POST /playground/run — anonymous code execution. Four-layer abuse
// stack (Turnstile + per-IP RL + per-session RL + global daily quota)
// arrives in subsequent commits. Until then the feature flag is the
// only guard, which is why it stays off by default.
playgroundRoutes.post('/playground/run', async (c) => {
  if (!config.FF_PLAYGROUND_CONSOLE_ENABLED) {
    return c.json({ error: 'Not found' }, 404)
  }

  const body = await c.req.json().catch(() => null)
  const parsed = runSchema.safeParse(body)
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    const codeTooLarge = flat.fieldErrors['code']?.some((m) => m.toLowerCase().includes('most')) ?? false
    return c.json(
      { error: codeTooLarge ? 'code_too_large' : 'invalid_request', details: flat },
      400,
    )
  }

  const { language, version, code } = parsed.data

  if (!PLAYGROUND_LANGUAGE_WHITELIST.has(language.toLowerCase())) {
    return c.json({ error: 'invalid_language' }, 400)
  }

  const sessionId = ensureSessionCookie(c)
  const ip = extractClientIp(c)

  const result = await executionQueue.enqueueRun({ language, version, code })

  // Fire-and-forget log. A failed insert must never block the response —
  // this table is abuse metadata, not a business invariant.
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
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureSessionCookie(c: Parameters<typeof getCookie>[0]): string {
  const existing = getCookie(c, SESSION_COOKIE)
  if (existing) return existing

  const fresh = randomUUID()
  setCookie(c, SESSION_COOKIE, fresh, {
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: 'Lax',
    secure: config.NODE_ENV === 'production',
  })
  return fresh
}

function extractClientIp(c: Parameters<typeof getCookie>[0]): string {
  // Kamal sits behind Traefik; x-forwarded-for is the authoritative
  // source. Fall back to x-real-ip, then to the raw remote address
  // (which in dev is 127.0.0.1 and that's fine).
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
