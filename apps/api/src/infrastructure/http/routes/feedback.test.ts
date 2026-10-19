import { describe, expect, it, vi, beforeEach } from 'vitest'

// vi.hoisted so the mock factories below can close over these bindings.
const { db } = vi.hoisted(() => ({
  db: {
    query: {
      sessions: { findFirst: vi.fn() },
      kataFeedback: { findFirst: vi.fn() },
    },
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
  },
}))

vi.mock('../../persistence/drizzle/client', () => ({ db }))

const saveKataFeedback = vi.fn()
vi.mock('../../persistence/kata-feedback', () => ({
  saveKataFeedback: (...args: unknown[]) => saveKataFeedback(...args),
}))

vi.mock('../../persistence/drizzle/schema', () => ({
  sessions: {},
  kataFeedback: {},
}))

// Honor a Bearer header so we exercise both the authed handler and the 401
// guard without hitting the real userSessions lookup.
vi.mock('../middleware/auth', () => ({
  requireAuth: async (
    c: {
      req: { header: (k: string) => string | undefined }
      set: (k: string, v: unknown) => void
      json: (b: unknown, s?: number) => Response
    },
    next: () => Promise<void>,
  ) => {
    const auth = c.req.header('Authorization')
    const id = auth?.startsWith('Bearer ') ? auth.slice(7) : null
    if (!id) return c.json({ error: 'Authentication required' }, 401)
    c.set('user', { id })
    await next()
  },
}))

import { feedbackRoutes } from './feedback'
import { Hono } from 'hono'

const USER_ID = 'user-1'
const AUTH = { Authorization: `Bearer ${USER_ID}` }
const SESSION_ID = 'sess-1'

function makeApp() {
  const app = new Hono()
  app.route('/', feedbackRoutes)
  return app
}

function completedSession(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    userId: USER_ID,
    kataId: 'kata-1',
    variationId: 'var-1',
    status: 'completed',
    ...overrides,
  }
}

function post(app: ReturnType<typeof makeApp>, body: unknown, headers: Record<string, string> = AUTH) {
  return app.request(`/sessions/${SESSION_ID}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

describe('POST /sessions/:id/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    db.insert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) })
  })

  it('returns 401 when no Authorization header is present', async () => {
    const app = makeApp()
    const res = await app.request(`/sessions/${SESSION_ID}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clarity: 'clear' }),
    })

    expect(res.status).toBe(401)
    // Auth runs before any DB work.
    expect(db.query.sessions.findFirst).not.toHaveBeenCalled()
  })

  const OWNER = { sessionId: SESSION_ID, kataId: 'kata-1', variationId: 'var-1', userId: USER_ID }

  it('saves only the vote that was tapped (D62)', async () => {
    db.query.sessions.findFirst.mockResolvedValue(completedSession())

    const res = await post(makeApp(), { timing: 'about_right' })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(saveKataFeedback).toHaveBeenCalledWith(db, OWNER, { timing: 'about_right' })
  })

  it('accepts a second vote on a session that already has feedback', async () => {
    db.query.sessions.findFirst.mockResolvedValue(completedSession())
    db.query.kataFeedback.findFirst.mockResolvedValue({ id: 'fb-1', sessionId: SESSION_ID })

    const res = await post(makeApp(), { evaluation: 'fair_and_relevant' })

    expect(res.status).toBe(200)
    expect(saveKataFeedback).toHaveBeenCalledWith(db, OWNER, { evaluation: 'fair_and_relevant' })
  })

  it('treats a failed session as eligible for feedback', async () => {
    db.query.sessions.findFirst.mockResolvedValue(completedSession({ status: 'failed' }))

    const res = await post(makeApp(), { clarity: 'confusing' })

    expect(res.status).toBe(200)
  })

  it('returns 400 when clarity is not a valid enum value', async () => {
    const app = makeApp()
    const res = await post(app, { clarity: 'nope' })

    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string; details: unknown }
    expect(body.error).toBe('Invalid feedback')
    expect(body.details).toBeDefined()
    // Validation runs before the session lookup.
    expect(db.query.sessions.findFirst).not.toHaveBeenCalled()
  })

  it('returns 400 when note exceeds 280 chars', async () => {
    const app = makeApp()
    const res = await post(app, { note: 'x'.repeat(281) })

    expect(res.status).toBe(400)
  })

  it('returns 404 when the session does not exist', async () => {
    db.query.sessions.findFirst.mockResolvedValue(undefined)

    const app = makeApp()
    const res = await post(app, { clarity: 'clear' })

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Session not found' })
  })

  it('returns 403 when the session belongs to another user', async () => {
    db.query.sessions.findFirst.mockResolvedValue(completedSession({ userId: 'someone-else' }))

    const app = makeApp()
    const res = await post(app, { clarity: 'clear' })

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Forbidden' })
  })

  it('returns 409 when the session is not yet completed', async () => {
    db.query.sessions.findFirst.mockResolvedValue(completedSession({ status: 'active' }))

    const app = makeApp()
    const res = await post(app, { clarity: 'clear' })

    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'Session not yet completed' })
    expect(saveKataFeedback).not.toHaveBeenCalled()
  })
})

describe('GET /sessions/:id/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no Authorization header is present', async () => {
    const app = makeApp()
    const res = await app.request(`/sessions/${SESSION_ID}/feedback`)

    expect(res.status).toBe(401)
    expect(db.query.kataFeedback.findFirst).not.toHaveBeenCalled()
  })

  it('returns submitted:false when no feedback exists', async () => {
    db.query.kataFeedback.findFirst.mockResolvedValue(undefined)

    const app = makeApp()
    const res = await app.request(`/sessions/${SESSION_ID}/feedback`, { headers: AUTH })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ submitted: false })
  })

  it('returns submitted:true with the stored feedback fields', async () => {
    db.query.kataFeedback.findFirst.mockResolvedValue({
      clarity: 'somewhat_unclear',
      timing: 'too_long',
      evaluation: 'too_generic',
      note: 'hmm',
    })

    const app = makeApp()
    const res = await app.request(`/sessions/${SESSION_ID}/feedback`, { headers: AUTH })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      submitted: true,
      clarity: 'somewhat_unclear',
      timing: 'too_long',
      evaluation: 'too_generic',
      note: 'hmm',
    })
  })
})
