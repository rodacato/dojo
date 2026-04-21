import { Hono } from 'hono'
import { config } from '../../../config'

export const healthRoutes = new Hono()

healthRoutes.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Proxy health check for Piston. Piston runs as an internal Kamal accessory
// (no public port), so this endpoint is the only way to verify API↔Piston
// connectivity from outside the container network.
healthRoutes.get('/health/piston', async (c) => {
  const start = Date.now()
  try {
    const res = await fetch(`${config.PISTON_URL}/api/v2/runtimes`, {
      signal: AbortSignal.timeout(3000),
    })
    const latencyMs = Date.now() - start
    if (!res.ok) {
      return c.json(
        { status: 'down', error: `HTTP ${res.status} ${res.statusText}`, latencyMs },
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
        latencyMs: Date.now() - start,
      },
      503,
    )
  }
})
