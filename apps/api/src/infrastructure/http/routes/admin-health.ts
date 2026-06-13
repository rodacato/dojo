import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { config } from '../../../config'
import { db } from '../../persistence/drizzle/client'
import { pistonRuntimeProvisioner } from '../../container'
import { requireAuth, requireCreator } from '../middleware/auth'
import type { AppEnv } from '../app-env'

export const adminHealthRoutes = new Hono<AppEnv>()

adminHealthRoutes.use('*', requireAuth, requireCreator)

interface CheckEnvelope<T> {
  status: 'ok' | 'down' | 'unconfigured'
  latencyMs: number | null
  detail: T
}

// GET /admin/health — aggregate liveness for the operator. Each subsystem
// is awaited in parallel so one slow check doesn't block the others.
// LLM is reported as configured/unconfigured by env (no live request, that
// would burn tokens on every poll).
adminHealthRoutes.get('/', async (c) => {
  const [api, dbCheck, piston, llm] = await Promise.all([
    checkApi(),
    checkDb(),
    checkPiston(),
    checkLlm(),
  ])
  return c.json({ api, db: dbCheck, piston, llm })
})

async function checkApi(): Promise<CheckEnvelope<{ env: string }>> {
  return { status: 'ok', latencyMs: 0, detail: { env: config.NODE_ENV } }
}

async function checkDb(): Promise<CheckEnvelope<{ error?: string }>> {
  const start = Date.now()
  try {
    await db.execute(sql`SELECT 1`)
    return { status: 'ok', latencyMs: Date.now() - start, detail: {} }
  } catch (err) {
    return {
      status: 'down',
      latencyMs: Date.now() - start,
      detail: { error: err instanceof Error ? err.message : String(err) },
    }
  }
}

async function checkPiston(): Promise<
  CheckEnvelope<{
    expected: Array<{ language: string; version: string }>
    actual: Array<{ language: string; version: string }>
    missing: Array<{ language: string; version: string }>
    extra: Array<{ language: string; version: string }>
    error?: string
  }>
> {
  const start = Date.now()
  const status = await pistonRuntimeProvisioner.status()
  const latencyMs = Date.now() - start
  if (!status.reachable) {
    return {
      status: 'down',
      latencyMs,
      detail: {
        expected: status.expected,
        actual: status.actual,
        missing: status.missing,
        extra: status.extra,
        error: status.error ?? 'unreachable',
      },
    }
  }
  return {
    status: status.missing.length === 0 ? 'ok' : 'down',
    latencyMs,
    detail: {
      expected: status.expected,
      actual: status.actual,
      missing: status.missing,
      extra: status.extra,
    },
  }
}

async function checkLlm(): Promise<
  CheckEnvelope<{ adapter: 'mock' | 'anthropic' | 'openai'; configured: boolean }>
> {
  const adapter = config.LLM_ADAPTER_FORMAT
  const configured = adapter === 'mock' ? true : config.LLM_API_KEY.length > 0
  return {
    status: configured ? 'ok' : 'unconfigured',
    latencyMs: null,
    detail: { adapter, configured },
  }
}
