import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppEnv } from '../app-env'
import type { RuntimeStatus } from '../../execution/PistonRuntimeProvisioner'

// Hoisted so the mock factories below can close over the bindings the route
// pulls in: a mutable config object, a stubbable db.execute, and the piston
// provisioner's status(). authState drives the requireAuth/requireCreator gate.
const { mockConfig, dbExecute, pistonStatus, authState } = vi.hoisted(() => ({
  mockConfig: {
    NODE_ENV: 'test' as 'development' | 'test' | 'production',
    LLM_ADAPTER_FORMAT: 'mock' as 'mock' | 'anthropic' | 'openai',
    LLM_API_KEY: '',
    CREATOR_GITHUB_ID: 'creator-gh',
  },
  dbExecute: vi.fn(),
  pistonStatus: vi.fn(),
  authState: { mode: 'creator' as 'creator' | 'non-creator' | 'anon' },
}))

vi.mock('../../../config', () => ({ config: mockConfig }))

vi.mock('../../persistence/drizzle/client', () => ({
  db: { execute: dbExecute },
}))

vi.mock('../../container', () => ({
  pistonRuntimeProvisioner: { status: pistonStatus },
}))

// Mock the auth boundary directly: requireAuth resolves the session→user,
// requireCreator gates on githubId. Both throw the same HTTPExceptions the
// real middleware does so the router's onError maps them to 401/403.
vi.mock('../middleware/auth', () => ({
  requireAuth: async (
    c: { set: (k: string, v: unknown) => void },
    next: () => Promise<void>,
  ) => {
    if (authState.mode === 'anon') {
      throw new HTTPException(401, { message: 'Authentication required' })
    }
    const githubId = authState.mode === 'creator' ? 'creator-gh' : 'someone-else'
    c.set('user', { id: 'user-1', githubId } as AppEnv['Variables']['user'])
    await next()
  },
  requireCreator: async (
    c: { get: (k: string) => unknown },
    next: () => Promise<void>,
  ) => {
    const user = c.get('user') as { githubId: string } | undefined
    if (!user) throw new HTTPException(401, { message: 'Authentication required' })
    if (user.githubId !== mockConfig.CREATOR_GITHUB_ID) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }
    await next()
  },
}))

import { adminHealthRoutes } from './admin-health'

function makeApp() {
  const app = new Hono<AppEnv>()
  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()
    return c.json({ error: 'Internal server error' }, 500)
  })
  app.route('/admin/health', adminHealthRoutes)
  return app
}

const RUNTIME = { language: 'python', version: '3.12.0' }

function reachableStatus(overrides: Partial<RuntimeStatus> = {}): RuntimeStatus {
  return {
    reachable: true,
    error: null,
    expected: [RUNTIME],
    actual: [RUNTIME],
    missing: [],
    extra: [],
    ...overrides,
  }
}

type HealthBody = {
  api: { status: string; latencyMs: number | null; detail: { env: string } }
  db: { status: string; latencyMs: number | null; detail: { error?: string } }
  piston: {
    status: string
    latencyMs: number | null
    detail: {
      expected: unknown[]
      actual: unknown[]
      missing: unknown[]
      extra: unknown[]
      error?: string
    }
  }
  llm: {
    status: string
    latencyMs: number | null
    detail: { adapter: string; configured: boolean }
  }
}

describe('GET /admin/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.mode = 'creator'
    mockConfig.NODE_ENV = 'test'
    mockConfig.LLM_ADAPTER_FORMAT = 'mock'
    mockConfig.LLM_API_KEY = ''
    dbExecute.mockResolvedValue(undefined)
    pistonStatus.mockResolvedValue(reachableStatus())
  })

  describe('auth gate', () => {
    it('returns 401 for an anonymous request', async () => {
      authState.mode = 'anon'
      const res = await makeApp().request('/admin/health')
      expect(res.status).toBe(401)
    })

    it('returns 403 for an authenticated non-creator', async () => {
      authState.mode = 'non-creator'
      const res = await makeApp().request('/admin/health')
      expect(res.status).toBe(403)
    })

    it('returns 200 for the creator', async () => {
      const res = await makeApp().request('/admin/health')
      expect(res.status).toBe(200)
    })
  })

  describe('aggregate shape (all green)', () => {
    it('returns api/db/piston/llm envelopes', async () => {
      const res = await makeApp().request('/admin/health')
      const body = (await res.json()) as HealthBody

      expect(Object.keys(body).sort()).toEqual(['api', 'db', 'llm', 'piston'])
      expect(body.api).toEqual({ status: 'ok', latencyMs: 0, detail: { env: 'test' } })
      expect(body.db.status).toBe('ok')
      expect(body.piston.status).toBe('ok')
      expect(body.llm.status).toBe('ok')
    })
  })

  describe('api check', () => {
    it('reflects config.NODE_ENV in the detail', async () => {
      mockConfig.NODE_ENV = 'production'
      const res = await makeApp().request('/admin/health')
      const body = (await res.json()) as HealthBody
      expect(body.api.detail.env).toBe('production')
    })
  })

  describe('db check', () => {
    it("status 'ok' with empty detail and runs SELECT 1 when reachable", async () => {
      const res = await makeApp().request('/admin/health')
      const body = (await res.json()) as HealthBody

      expect(dbExecute).toHaveBeenCalledTimes(1)
      expect(body.db.status).toBe('ok')
      expect(body.db.detail).toEqual({})
      expect(typeof body.db.latencyMs).toBe('number')
    })

    it("status 'down' surfaces the Error message when the query throws", async () => {
      dbExecute.mockRejectedValue(new Error('connection refused'))
      const res = await makeApp().request('/admin/health')
      const body = (await res.json()) as HealthBody

      expect(res.status).toBe(200)
      expect(body.db.status).toBe('down')
      expect(body.db.detail.error).toBe('connection refused')
    })

    it("status 'down' stringifies a non-Error rejection", async () => {
      dbExecute.mockRejectedValue('boom-string')
      const res = await makeApp().request('/admin/health')
      const body = (await res.json()) as HealthBody

      expect(body.db.status).toBe('down')
      expect(body.db.detail.error).toBe('boom-string')
    })
  })

  describe('piston check', () => {
    it("status 'ok' when reachable with nothing missing", async () => {
      const res = await makeApp().request('/admin/health')
      const body = (await res.json()) as HealthBody

      expect(body.piston.status).toBe('ok')
      expect(body.piston.detail.missing).toEqual([])
      expect(body.piston.detail.error).toBeUndefined()
    })

    it("status 'down' when reachable but a runtime is missing", async () => {
      pistonStatus.mockResolvedValue(
        reachableStatus({ actual: [], missing: [RUNTIME] }),
      )
      const res = await makeApp().request('/admin/health')
      const body = (await res.json()) as HealthBody

      expect(body.piston.status).toBe('down')
      expect(body.piston.detail.missing).toEqual([RUNTIME])
      expect(body.piston.detail.error).toBeUndefined()
    })

    it("status 'down' with surfaced error when unreachable", async () => {
      pistonStatus.mockResolvedValue({
        reachable: false,
        error: 'ECONNREFUSED',
        expected: [RUNTIME],
        actual: [],
        missing: [RUNTIME],
        extra: [],
      } satisfies RuntimeStatus)
      const res = await makeApp().request('/admin/health')
      const body = (await res.json()) as HealthBody

      expect(body.piston.status).toBe('down')
      expect(body.piston.detail.error).toBe('ECONNREFUSED')
    })

    it("falls back to 'unreachable' when unreachable with a null error", async () => {
      pistonStatus.mockResolvedValue({
        reachable: false,
        error: null,
        expected: [RUNTIME],
        actual: [],
        missing: [RUNTIME],
        extra: [],
      } satisfies RuntimeStatus)
      const res = await makeApp().request('/admin/health')
      const body = (await res.json()) as HealthBody

      expect(body.piston.detail.error).toBe('unreachable')
    })
  })

  describe('llm check', () => {
    it("mock adapter is always 'ok'/configured regardless of api key", async () => {
      mockConfig.LLM_ADAPTER_FORMAT = 'mock'
      mockConfig.LLM_API_KEY = ''
      const res = await makeApp().request('/admin/health')
      const body = (await res.json()) as HealthBody

      expect(body.llm.status).toBe('ok')
      expect(body.llm.detail).toEqual({ adapter: 'mock', configured: true })
      expect(body.llm.latencyMs).toBeNull()
    })

    it("real adapter with a key is 'ok'/configured", async () => {
      mockConfig.LLM_ADAPTER_FORMAT = 'anthropic'
      mockConfig.LLM_API_KEY = 'sk-test'
      const res = await makeApp().request('/admin/health')
      const body = (await res.json()) as HealthBody

      expect(body.llm.status).toBe('ok')
      expect(body.llm.detail).toEqual({ adapter: 'anthropic', configured: true })
    })

    it("real adapter without a key is 'unconfigured'", async () => {
      mockConfig.LLM_ADAPTER_FORMAT = 'openai'
      mockConfig.LLM_API_KEY = ''
      const res = await makeApp().request('/admin/health')
      const body = (await res.json()) as HealthBody

      expect(body.llm.status).toBe('unconfigured')
      expect(body.llm.detail).toEqual({ adapter: 'openai', configured: false })
    })
  })
})
