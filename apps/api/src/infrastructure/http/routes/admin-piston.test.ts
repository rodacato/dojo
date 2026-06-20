import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { AppEnv } from '../app-env'

// vi.hoisted so the mock factories can close over these bindings without
// hitting "Cannot access X before initialization".
const { provision, findFirst, CREATOR_GITHUB_ID } = vi.hoisted(() => ({
  provision: vi.fn(),
  findFirst: vi.fn(),
  CREATOR_GITHUB_ID: 'creator-gh-123',
}))

vi.mock('../../container', () => ({
  pistonRuntimeProvisioner: { provision },
}))

// requireAuth resolves the bearer token to a user via this lookup; controlling
// it lets us drive the anon / authed / creator-vs-not branches end to end.
vi.mock('../../persistence/drizzle/client', () => ({
  db: { query: { userSessions: { findFirst } } },
}))

vi.mock('../../persistence/drizzle/schema', () => ({
  userSessions: { id: 'id', expiresAt: 'expiresAt' },
  users: {},
}))

vi.mock('../../../config', () => ({
  config: { CREATOR_GITHUB_ID },
}))

// Import AFTER the mocks so the route grabs the mocked deps.
import { adminPistonRoutes } from './admin-piston'

const RUNTIMES = [
  { language: 'go', version: '1.16.2' },
  { language: 'python', version: '3.12.0' },
]

function makeApp() {
  const app = new Hono<AppEnv>()
  app.route('/admin/piston', adminPistonRoutes)
  return app
}

type SessionUser = { id: string; githubId: string }

function seedSession(user: SessionUser | null) {
  findFirst.mockResolvedValue(user ? { user } : undefined)
}

const creator: SessionUser = { id: 'user-creator', githubId: CREATOR_GITHUB_ID }
const nonCreator: SessionUser = { id: 'user-other', githubId: 'someone-else' }

const BEARER = { Authorization: 'Bearer valid-session-id' }

describe('POST /admin/piston/reprovision', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('auth + creator guard', () => {
    it('returns 401 when no Authorization header is present', async () => {
      seedSession(creator)
      const res = await makeApp().request('/admin/piston/reprovision', { method: 'POST' })

      expect(res.status).toBe(401)
      expect(provision).not.toHaveBeenCalled()
    })

    it('returns 401 when Authorization is not a Bearer token', async () => {
      seedSession(creator)
      const res = await makeApp().request('/admin/piston/reprovision', {
        method: 'POST',
        headers: { Authorization: 'Basic abc123' },
      })

      expect(res.status).toBe(401)
      expect(provision).not.toHaveBeenCalled()
    })

    it('returns 401 when the session is expired or unknown', async () => {
      seedSession(null)
      const res = await makeApp().request('/admin/piston/reprovision', {
        method: 'POST',
        headers: BEARER,
      })

      expect(res.status).toBe(401)
      expect(provision).not.toHaveBeenCalled()
    })

    it('returns 403 when an authenticated non-creator hits the route', async () => {
      seedSession(nonCreator)
      const res = await makeApp().request('/admin/piston/reprovision', {
        method: 'POST',
        headers: BEARER,
      })

      expect(res.status).toBe(403)
      expect(provision).not.toHaveBeenCalled()
    })
  })

  describe('creator-authorized reprovision', () => {
    it('returns 200 with the full report when every runtime provisions', async () => {
      seedSession(creator)
      const report = {
        installed: [RUNTIMES[0]],
        skipped: [RUNTIMES[1]],
        failed: [],
        runtimes: RUNTIMES,
      }
      provision.mockResolvedValue(report)

      const res = await makeApp().request('/admin/piston/reprovision', {
        method: 'POST',
        headers: BEARER,
      })

      expect(res.status).toBe(200)
      expect(provision).toHaveBeenCalledTimes(1)
      expect(await res.json()).toEqual(report)
    })

    it('returns 500 (but still the report body) when some runtimes failed', async () => {
      seedSession(creator)
      const report = {
        installed: [],
        skipped: [],
        failed: [{ ...RUNTIMES[0], error: 'install timed out' }],
        runtimes: RUNTIMES,
      }
      provision.mockResolvedValue(report)

      const res = await makeApp().request('/admin/piston/reprovision', {
        method: 'POST',
        headers: BEARER,
      })

      expect(res.status).toBe(500)
      expect(await res.json()).toEqual(report)
    })

    it('returns 500 with the error message when provision throws an Error', async () => {
      seedSession(creator)
      provision.mockRejectedValue(new Error('Piston unreachable'))

      const res = await makeApp().request('/admin/piston/reprovision', {
        method: 'POST',
        headers: BEARER,
      })

      expect(res.status).toBe(500)
      expect(await res.json()).toEqual({ error: 'Piston unreachable' })
    })

    it('returns 500 with a fallback message when provision rejects a non-Error', async () => {
      seedSession(creator)
      provision.mockRejectedValue('boom')

      const res = await makeApp().request('/admin/piston/reprovision', {
        method: 'POST',
        headers: BEARER,
      })

      expect(res.status).toBe(500)
      expect(await res.json()).toEqual({ error: 'Reprovision failed' })
    })
  })
})
