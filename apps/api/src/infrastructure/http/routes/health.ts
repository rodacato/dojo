import { Hono } from 'hono'
import { config } from '../../../config'

export const healthRoutes = new Hono()

healthRoutes.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Proxy health check for Piston. Piston runs as an internal Kamal accessory
// (no public port), so this endpoint is the only way to verify API↔Piston
// connectivity from outside the container network.
//
// On failure we expose the sanitized target URL + error cause code so the
// operator can distinguish DNS (ENOTFOUND) vs reachability (ECONNREFUSED)
// vs timeout (AbortError) without shell access to the container.
healthRoutes.get('/health/piston', async (c) => {
  const start = Date.now()
  const target = safeUrl(config.PISTON_URL)
  try {
    const res = await fetch(`${config.PISTON_URL}/api/v2/runtimes`, {
      signal: AbortSignal.timeout(3000),
    })
    const latencyMs = Date.now() - start
    if (!res.ok) {
      return c.json(
        {
          status: 'down',
          error: `HTTP ${res.status} ${res.statusText}`,
          latencyMs,
          target,
        },
        503,
      )
    }
    const raw = (await res.json()) as Array<{ language: string; version: string }>
    const runtimes = raw.map(({ language, version }) => ({ language, version }))
    return c.json({ status: 'ok', latencyMs, runtimes })
  } catch (err) {
    return c.json(
      {
        status: 'down',
        error: err instanceof Error ? err.message : 'fetch failed',
        errorName: err instanceof Error ? err.name : undefined,
        causeCode: extractCauseCode(err),
        latencyMs: Date.now() - start,
        target,
      },
      503,
    )
  }
})

function safeUrl(raw: string): string {
  try {
    const u = new URL(raw)
    return `${u.protocol}//${u.host}${u.pathname === '/' ? '' : u.pathname}`
  } catch {
    return 'invalid-url'
  }
}

function extractCauseCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'cause' in err) {
    const cause = (err as { cause?: unknown }).cause
    if (cause && typeof cause === 'object' && 'code' in cause) {
      return String((cause as { code: unknown }).code)
    }
  }
  return undefined
}
