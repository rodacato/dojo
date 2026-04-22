import type { MiddlewareHandler } from 'hono'
import { config } from '../../../config'
import type { AppEnv } from '../app-env'

// Layer 1 of spec 027 §4.5 — Cloudflare Turnstile bot gate.
//
// When TURNSTILE_SECRET_KEY is empty the middleware is a strict no-op —
// no network call, no token requirement. This is the intended dev-mode
// shape: running Turnstile against a local dev server requires a live
// Cloudflare account every time, which hurts iteration speed.
//
// When the secret is set, every request must carry a `turnstileToken`
// field in the JSON body. Missing or invalid → 403 closes the request
// before it reaches the rate-limit chain or Piston. Turnstile's widget
// operates invisibly when the client's risk score is low, so this is
// not normally visible UX friction.
//
// The validator is intentionally fail-closed on network errors: if the
// Cloudflare endpoint is unreachable we reject the request. A false
// negative (real user rejected) is temporary; a false positive (bot
// let through because we couldn't check) is persistent abuse.

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const SITEVERIFY_TIMEOUT_MS = 5_000

interface SiteverifyResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
  action?: string
}

export const playgroundTurnstileMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!config.TURNSTILE_SECRET_KEY) {
    // Dev mode. No-op.
    await next()
    return
  }

  const body = await c.req.json().catch(() => null) as { turnstileToken?: unknown } | null
  const token = typeof body?.turnstileToken === 'string' ? body.turnstileToken : null

  if (!token) {
    return c.json({ error: 'turnstile_required' }, 403)
  }

  const verification = await verifyTurnstile(token, extractClientIp(c))
  if (!verification.success) {
    return c.json(
      {
        error: 'turnstile_failed',
        codes: verification['error-codes'] ?? [],
      },
      403,
    )
  }

  await next()
}

async function verifyTurnstile(token: string, clientIp: string | null): Promise<SiteverifyResponse> {
  const params = new URLSearchParams({
    secret: config.TURNSTILE_SECRET_KEY,
    response: token,
  })
  if (clientIp) params.set('remoteip', clientIp)

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(
        JSON.stringify({
          evt: 'turnstile.siteverify_http_error',
          status: res.status,
        }),
      )
      return { success: false, 'error-codes': ['siteverify_http_error'] }
    }

    return (await res.json()) as SiteverifyResponse
  } catch (err) {
    console.error(
      JSON.stringify({
        evt: 'turnstile.siteverify_network_error',
        message: err instanceof Error ? err.message : String(err),
      }),
    )
    return { success: false, 'error-codes': ['siteverify_network_error'] }
  }
}

function extractClientIp(c: Parameters<MiddlewareHandler>[0]): string | null {
  const cf = c.req.header('cf-connecting-ip')
  if (cf) return cf
  const xff = c.req.header('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  const xr = c.req.header('x-real-ip')
  if (xr) return xr.trim()
  return null
}
