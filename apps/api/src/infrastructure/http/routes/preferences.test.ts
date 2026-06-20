import { describe, expect, it, vi, beforeEach } from 'vitest'

// vi.hoisted so the mock factories below can close over these bindings.
const { db, state } = vi.hoisted(() => {
  const state = {
    session: undefined as unknown,
    user: undefined as unknown,
    prefs: undefined as unknown,
    updateWhere: vi.fn(),
    updateSet: vi.fn(),
    onConflictDoUpdate: vi.fn(),
    insertValues: vi.fn(),
  }

  return {
    state,
    db: {
      query: {
        userSessions: {
          findFirst: vi.fn(async () => state.session),
        },
        users: {
          findFirst: vi.fn(async () => state.user),
        },
        userPreferences: {
          findFirst: vi.fn(async () => state.prefs),
        },
      },
      update: vi.fn(() => ({
        set: vi.fn((vals: unknown) => {
          state.updateSet(vals)
          return {
            where: vi.fn(async (...args: unknown[]) => {
              state.updateWhere(...args)
            }),
          }
        }),
      })),
      insert: vi.fn(() => ({
        values: vi.fn((vals: unknown) => {
          state.insertValues(vals)
          return {
            onConflictDoUpdate: vi.fn(async (cfg: unknown) => {
              state.onConflictDoUpdate(cfg)
            }),
          }
        }),
      })),
    },
  }
})

vi.mock('../../persistence/drizzle/client', () => ({ db }))

vi.mock('../../persistence/drizzle/schema', () => ({
  users: { id: 'users.id' },
  userPreferences: { userId: 'userPreferences.userId' },
  userSessions: { id: 'userSessions.id', expiresAt: 'userSessions.expiresAt' },
}))

// createRouter pulls the whole container graph; stub it so unrelated routes
// don't drag real config/DB into the module load.
vi.mock('../../container', () => ({
  useCases: {},
  errorReporter: { report: vi.fn() },
}))

import { createRouter } from '../router'

const VALID_TOKEN = 'valid-session-id'

function authUser(id = 'user-1') {
  // requireAuth resolves c.get('user') from session.user.
  state.session = { id: VALID_TOKEN, user: { id } }
}

function bearer(token = VALID_TOKEN) {
  return { Authorization: `Bearer ${token}` }
}

beforeEach(() => {
  vi.clearAllMocks()
  state.session = undefined
  state.user = undefined
  state.prefs = undefined
})

describe('GET /preferences', () => {
  it('returns 401 when no Authorization header is present', async () => {
    const app = createRouter()
    const res = await app.request('/preferences')

    expect(res.status).toBe(401)
  })

  it('returns 401 when the bearer token resolves no session', async () => {
    state.session = undefined
    const app = createRouter()
    const res = await app.request('/preferences', { headers: bearer('bogus') })

    expect(res.status).toBe(401)
  })

  it('returns 404 when the authenticated user row is missing', async () => {
    authUser()
    state.user = undefined
    const app = createRouter()
    const res = await app.request('/preferences', { headers: bearer() })

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'User not found' })
  })

  it('returns 200 with stored user + preference values', async () => {
    authUser()
    state.user = {
      id: 'user-1',
      email: 'a@b.com',
      reminderEnabled: true,
      reminderHour: 9,
    }
    state.prefs = {
      level: 'senior',
      interests: ['ruby', 'rails'],
      randomness: 0.7,
      goalWeeklyTarget: 5,
    }

    const app = createRouter()
    const res = await app.request('/preferences', { headers: bearer() })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      reminderEnabled: true,
      reminderHour: 9,
      email: 'a@b.com',
      level: 'senior',
      interests: ['ruby', 'rails'],
      randomness: 0.7,
      goalWeeklyTarget: 5,
    })
  })

  it('falls back to defaults when no userPreferences row exists', async () => {
    authUser()
    state.user = {
      id: 'user-1',
      email: null,
      reminderEnabled: false,
      reminderHour: 0,
    }
    state.prefs = undefined

    const app = createRouter()
    const res = await app.request('/preferences', { headers: bearer() })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      reminderEnabled: false,
      reminderHour: 0,
      email: null,
      level: 'mid',
      interests: [],
      randomness: 0.3,
      goalWeeklyTarget: 3,
    })
  })
})

describe('PUT /preferences', () => {
  it('returns 401 when unauthenticated', async () => {
    const app = createRouter()
    const res = await app.request('/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderEnabled: true, reminderHour: 8 }),
    })

    expect(res.status).toBe(401)
  })

  it('returns 400 when reminderHour is out of range', async () => {
    authUser()
    const app = createRouter()
    const res = await app.request('/preferences', {
      method: 'PUT',
      headers: { ...bearer(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderEnabled: true, reminderHour: 24 }),
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid preferences' })
  })

  it('returns 400 when required fields are missing', async () => {
    authUser()
    const app = createRouter()
    const res = await app.request('/preferences', {
      method: 'PUT',
      headers: { ...bearer(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderHour: 8 }),
    })

    expect(res.status).toBe(400)
  })

  it('returns 400 when level is not an allowed enum value', async () => {
    authUser()
    const app = createRouter()
    const res = await app.request('/preferences', {
      method: 'PUT',
      headers: { ...bearer(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderEnabled: true, reminderHour: 8, level: 'expert' }),
    })

    expect(res.status).toBe(400)
  })

  it('returns 400 when randomness is above 1', async () => {
    authUser()
    const app = createRouter()
    const res = await app.request('/preferences', {
      method: 'PUT',
      headers: { ...bearer(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderEnabled: true, reminderHour: 8, randomness: 1.5 }),
    })

    expect(res.status).toBe(400)
  })

  it('updates only the user row when no preference fields are sent', async () => {
    authUser()
    const app = createRouter()
    const res = await app.request('/preferences', {
      method: 'PUT',
      headers: { ...bearer(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderEnabled: true, reminderHour: 7 }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(db.update).toHaveBeenCalledTimes(1)
    expect(state.updateWhere).toHaveBeenCalledTimes(1)
    expect(state.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ reminderEnabled: true, reminderHour: 7 }),
    )
    // No preference fields → the upsert branch is skipped entirely.
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('defaults email to null when omitted', async () => {
    authUser()
    const app = createRouter()
    const res = await app.request('/preferences', {
      method: 'PUT',
      headers: { ...bearer(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderEnabled: false, reminderHour: 12 }),
    })

    expect(res.status).toBe(200)
    expect(state.updateSet).toHaveBeenCalledWith(expect.objectContaining({ email: null }))
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('passes a supplied email through to the user row unchanged', async () => {
    authUser()
    const app = createRouter()
    const res = await app.request('/preferences', {
      method: 'PUT',
      headers: { ...bearer(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderEnabled: true, reminderHour: 8, email: 'a@b.com' }),
    })

    expect(res.status).toBe(200)
    expect(state.updateSet).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@b.com' }))
  })

  it('upserts preference fields when level/interests are provided', async () => {
    authUser()
    const app = createRouter()
    const res = await app.request('/preferences', {
      method: 'PUT',
      headers: { ...bearer(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reminderEnabled: true,
        reminderHour: 6,
        email: 'c@d.com',
        level: 'junior',
        interests: ['go'],
        randomness: 0.5,
        goalWeeklyTarget: 4,
      }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(db.update).toHaveBeenCalledTimes(1)
    expect(db.insert).toHaveBeenCalledTimes(1)

    expect(state.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        level: 'junior',
        interests: ['go'],
        randomness: 0.5,
        goalWeeklyTarget: 4,
      }),
    )
    expect(state.onConflictDoUpdate).toHaveBeenCalledTimes(1)

    const cfg = state.onConflictDoUpdate.mock.calls[0][0] as { set: Record<string, unknown> }
    expect(cfg.set).toMatchObject({
      level: 'junior',
      interests: ['go'],
      randomness: 0.5,
      goalWeeklyTarget: 4,
    })
  })

  it('upserts when only a single preference field (goalWeeklyTarget) is provided', async () => {
    authUser()
    const app = createRouter()
    const res = await app.request('/preferences', {
      method: 'PUT',
      headers: { ...bearer(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reminderEnabled: true,
        reminderHour: 10,
        goalWeeklyTarget: 2,
      }),
    })

    expect(res.status).toBe(200)
    expect(db.insert).toHaveBeenCalledTimes(1)
    expect(state.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', goalWeeklyTarget: 2 }),
    )
    // Only the supplied field lands in the conflict update set (+ updatedAt).
    const cfg = state.onConflictDoUpdate.mock.calls[0][0] as { set: Record<string, unknown> }
    expect(cfg.set).toHaveProperty('goalWeeklyTarget', 2)
    expect(cfg.set).not.toHaveProperty('level')
  })
})
