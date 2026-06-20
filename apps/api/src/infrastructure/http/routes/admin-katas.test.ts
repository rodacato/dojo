import { eq } from 'drizzle-orm'
import type * as DrizzleOrm from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppEnv } from '../app-env'

// Partial mock: delegate to the real eq/and so the route's WHERE conditions are
// real operators, while spying on what they're built from (kataId, etc.).
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof DrizzleOrm>()
  return { ...actual, eq: vi.fn(actual.eq), and: vi.fn(actual.and) }
})

// vi.hoisted so the mock factories below can close over these bindings.
const {
  mockConfig,
  authState,
  selectQueue,
  dbSelect,
  updateSet,
  updateWhere,
  dbUpdate,
  dbDelete,
  insertValues,
  insertReturning,
  dbInsert,
  getKataById,
  createKata,
  resendSend,
} = vi.hoisted(() => {
  const selectQueue: unknown[][] = []

  // Minimal chainable that resolves to the next queued row set when awaited.
  // Covers select().from().leftJoin()...orderBy() and select().from().where().orderBy().
  function chainable(rows: unknown[]): unknown {
    const handler: ProxyHandler<() => unknown> = {
      get(_t, prop) {
        if (prop === 'then') {
          return (onFulfilled: (v: unknown[]) => unknown) =>
            Promise.resolve(rows).then(onFulfilled)
        }
        return new Proxy(() => undefined, handler)
      },
      apply() {
        return new Proxy(() => undefined, handler)
      },
    }
    return new Proxy(() => undefined, handler)
  }

  const updateWhere = vi.fn().mockResolvedValue(undefined)
  const updateSet = vi.fn((_set: Record<string, unknown>) => ({ where: updateWhere }))

  const deleteWhere = vi.fn().mockResolvedValue(undefined)

  const insertReturning = vi.fn()
  // insert().values() is awaited directly in PUT, and chained .returning() in POST /invitations.
  const insertValues = vi.fn((_values: Record<string, unknown>) => {
    const p = Promise.resolve(undefined) as Promise<unknown> & { returning: typeof insertReturning }
    p.returning = insertReturning
    return p
  })

  return {
    mockConfig: {
      CREATOR_GITHUB_ID: 'creator-gh',
      WEB_URL: 'https://dojo.example',
      RESEND_API_KEY: '',
      RESEND_FROM_EMAIL: 'dojo <noreply@example.dev>',
    } as {
      CREATOR_GITHUB_ID: string
      WEB_URL: string
      RESEND_API_KEY: string
      RESEND_FROM_EMAIL: string
    },
    authState: { mode: 'creator' as 'creator' | 'non-creator' | 'anon' },
    selectQueue,
    dbSelect: vi.fn(() => chainable(selectQueue.shift() ?? [])),
    updateSet,
    updateWhere,
    dbUpdate: vi.fn(() => ({ set: updateSet })),
    deleteWhere,
    dbDelete: vi.fn(() => ({ where: deleteWhere })),
    insertValues,
    insertReturning,
    dbInsert: vi.fn(() => ({ values: insertValues })),
    getKataById: vi.fn(),
    createKata: vi.fn(),
    resendSend: vi.fn(),
  }
})

vi.mock('../../../config', () => ({ config: mockConfig }))

vi.mock('../../persistence/drizzle/client', () => ({
  db: {
    select: dbSelect,
    update: dbUpdate,
    delete: dbDelete,
    insert: dbInsert,
  },
}))

// Table refs are only used as eq()/from() args; identity objects suffice and
// double as assertion targets.
vi.mock('../../persistence/drizzle/schema', () => ({
  katas: { id: 'katas.id', createdAt: 'katas.createdAt', version: 'katas.version' },
  variations: { id: 'variations.id', kataId: 'variations.kataId' },
  sessions: { id: 'sessions.id', kataId: 'sessions.kataId' },
  attempts: { id: 'attempts.id', sessionId: 'attempts.sessionId', isFinalEvaluation: 'attempts.isFinalEvaluation', llmResponse: 'attempts.llmResponse' },
  invitations: { id: 'invitations.id', token: 'invitations.token', usedBy: 'invitations.usedBy', expiresAt: 'invitations.expiresAt', createdAt: 'invitations.createdAt' },
  kataFeedback: { kataId: 'kataFeedback.kataId', submittedAt: 'kataFeedback.submittedAt' },
  users: { id: 'users.id', username: 'users.username' },
}))

vi.mock('../../container', () => ({
  useCases: {
    getKataById: { execute: getKataById },
    createKata: { execute: createKata },
  },
  errorReporter: { report: vi.fn() },
}))

// Mock the auth boundary like admin-scrolls.test.ts: requireAuth resolves a
// user, requireCreator gates on githubId. Both throw the HTTPExceptions the
// real middleware throws so onError maps them to 401/403.
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

// Mocked dynamically-imported 'resend' SDK. The route does `await import('resend')`.
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({ emails: { send: resendSend } })),
}))

import { adminKatasRoutes } from './admin-katas'
import { katas, kataFeedback, variations } from '../../persistence/drizzle/schema'

// Mounted under /admin in the real router (router.ts: app.route('/admin', adminKatasRoutes)).
function makeApp() {
  const app = new Hono<AppEnv>()
  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()
    return c.json({ error: 'Internal server error' }, 500)
  })
  app.route('/admin', adminKatasRoutes)
  return app
}

function jsonReq(path: string, method: string, body: unknown) {
  return makeApp().request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const CREATED_AT = new Date('2026-06-01T12:00:00.000Z')

function validKataBody(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Refactor the parser',
    description: 'A tricky one',
    duration: 30,
    difficulty: 'medium',
    type: 'code',
    languages: ['python'],
    tags: ['parsing'],
    topics: ['recursion'],
    variations: [{ ownerRole: 'senior', ownerContext: 'legacy codebase' }],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  selectQueue.length = 0
  authState.mode = 'creator'
  mockConfig.RESEND_API_KEY = ''
})

// ---------------------------------------------------------------------------
// Auth gate — shared requireAuth + requireCreator across every route
// ---------------------------------------------------------------------------

describe('admin-katas — auth gate', () => {
  it('returns 401 for an anonymous request to GET /katas', async () => {
    authState.mode = 'anon'
    const res = await makeApp().request('/admin/katas')
    expect(res.status).toBe(401)
    expect(dbSelect).not.toHaveBeenCalled()
  })

  it('returns 403 for an authenticated non-creator', async () => {
    authState.mode = 'non-creator'
    const res = await makeApp().request('/admin/katas')
    expect(res.status).toBe(403)
    expect(dbSelect).not.toHaveBeenCalled()
  })

  it('gates the mutating POST /katas for a non-creator (use case never runs)', async () => {
    authState.mode = 'non-creator'
    const res = await jsonReq('/admin/katas', 'POST', validKataBody())
    expect(res.status).toBe(403)
    expect(createKata).not.toHaveBeenCalled()
  })

  it('gates POST /invitations for an anonymous request', async () => {
    authState.mode = 'anon'
    const res = await jsonReq('/admin/invitations', 'POST', {})
    expect(res.status).toBe(401)
    expect(dbInsert).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// GET /katas
// ---------------------------------------------------------------------------

describe('GET /admin/katas', () => {
  it('maps rows, coerces counts to Number and serialises createdAt', async () => {
    selectQueue.push([
      {
        id: 'k-1',
        title: 'Kata One',
        type: 'code',
        difficulty: 'easy',
        duration: 20,
        status: 'published',
        createdAt: CREATED_AT,
        variationCount: '3', // sql count() comes back as a string from pg
        sessionCount: '5',
        avgScore: '0.75',
      },
    ])

    const res = await makeApp().request('/admin/katas')
    expect(res.status).toBe(200)
    const body = (await res.json()) as Array<Record<string, unknown>>
    expect(body).toHaveLength(1)
    expect(body[0]).toEqual({
      id: 'k-1',
      title: 'Kata One',
      type: 'code',
      difficulty: 'easy',
      duration: 20,
      status: 'published',
      variationCount: 3,
      sessionCount: 5,
      avgScore: 0.75,
      createdAt: CREATED_AT.toISOString(),
    })
  })

  it('preserves a null avgScore (no sessions/attempts) instead of coercing to 0', async () => {
    selectQueue.push([
      {
        id: 'k-2',
        title: 'Kata Two',
        type: 'chat',
        difficulty: 'hard',
        duration: 45,
        status: 'draft',
        createdAt: CREATED_AT,
        variationCount: '0',
        sessionCount: '0',
        avgScore: null,
      },
    ])

    const res = await makeApp().request('/admin/katas')
    const body = (await res.json()) as Array<{ avgScore: number | null }>
    expect(body[0].avgScore).toBeNull()
  })

  it('returns an empty array when there are no katas', async () => {
    selectQueue.push([])
    const res = await makeApp().request('/admin/katas')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns 500 when the select chain rejects', async () => {
    dbSelect.mockImplementationOnce(() => {
      throw new Error('db down')
    })
    const res = await makeApp().request('/admin/katas')
    expect(res.status).toBe(500)
  })
})

// ---------------------------------------------------------------------------
// GET /katas/:id
// ---------------------------------------------------------------------------

describe('GET /admin/katas/:id', () => {
  function fullKata(overrides: Record<string, unknown> = {}) {
    return {
      id: 'k-1',
      title: 'Kata One',
      description: 'desc',
      durationMinutes: 30,
      difficulty: 'medium',
      type: 'code',
      languages: ['python'],
      tags: ['t'],
      topics: ['recursion'],
      status: 'published',
      version: 4,
      adminNotes: 'be careful',
      variations: [
        { id: 'v-1', ownerRole: 'senior', ownerContext: 'ctx' },
      ],
      ...overrides,
    }
  }

  it('passes the path param to the use case and maps the result', async () => {
    getKataById.mockResolvedValue(fullKata())
    const res = await makeApp().request('/admin/katas/k-1')
    expect(res.status).toBe(200)
    expect(getKataById).toHaveBeenCalledWith('k-1')

    expect(await res.json()).toEqual({
      id: 'k-1',
      title: 'Kata One',
      description: 'desc',
      duration: 30,
      difficulty: 'medium',
      type: 'code',
      languages: ['python'],
      tags: ['t'],
      topics: ['recursion'],
      status: 'published',
      version: 4,
      adminNotes: 'be careful',
      variations: [{ id: 'v-1', ownerRole: 'senior', ownerContext: 'ctx' }],
    })
  })

  it('defaults version to 1 and adminNotes to null when absent', async () => {
    getKataById.mockResolvedValue(fullKata({ version: null, adminNotes: null }))
    const res = await makeApp().request('/admin/katas/k-1')
    const body = (await res.json()) as { version: number; adminNotes: string | null }
    expect(body.version).toBe(1)
    expect(body.adminNotes).toBeNull()
  })

  it('returns 404 when the kata is not found', async () => {
    getKataById.mockResolvedValue(null)
    const res = await makeApp().request('/admin/katas/missing')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Kata not found' })
  })

  it('returns 500 when the use case rejects', async () => {
    getKataById.mockRejectedValue(new Error('repo blew up'))
    const res = await makeApp().request('/admin/katas/k-1')
    expect(res.status).toBe(500)
  })
})

// ---------------------------------------------------------------------------
// GET /katas/:id/feedback
// ---------------------------------------------------------------------------

describe('GET /admin/katas/:id/feedback', () => {
  function fb(overrides: Record<string, unknown> = {}) {
    return {
      kataId: 'k-1',
      variationId: 'v-1',
      clarity: 'clear',
      timing: 'just_right',
      evaluation: 'fair',
      note: null,
      submittedAt: CREATED_AT,
      ...overrides,
    }
  }

  it('returns the empty-aggregate shape when there is no feedback', async () => {
    selectQueue.push([])
    const res = await makeApp().request('/admin/katas/k-1/feedback')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      total: 0,
      clarity: {},
      timing: {},
      evaluation: {},
      notes: [],
      byVariation: {},
    })
    // WHERE built from the path param.
    expect(eq).toHaveBeenCalledWith(kataFeedback.kataId, 'k-1')
  })

  it('aggregates signal counts, groups by variation and collects notes', async () => {
    selectQueue.push([
      fb({ variationId: 'v-1', clarity: 'clear', timing: 'just_right', evaluation: 'fair', note: 'good' }),
      fb({ variationId: 'v-1', clarity: 'clear', timing: 'too_long', evaluation: 'fair', note: null }),
      fb({ variationId: 'v-2', clarity: 'confusing', timing: 'just_right', evaluation: 'harsh', note: 'meh' }),
    ])

    const res = await makeApp().request('/admin/katas/k-1/feedback')
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      total: number
      clarity: Record<string, number>
      timing: Record<string, number>
      evaluation: Record<string, number>
      notes: Array<{ note: string; variationId: string; submittedAt: string }>
      byVariation: Record<string, { total: number; clarity: Record<string, number>; timing: Record<string, number>; evaluation: Record<string, number> }>
    }

    expect(body.total).toBe(3)
    expect(body.clarity).toEqual({ clear: 2, confusing: 1 })
    expect(body.timing).toEqual({ just_right: 2, too_long: 1 })
    expect(body.evaluation).toEqual({ fair: 2, harsh: 1 })

    expect(body.notes).toEqual([
      { note: 'good', variationId: 'v-1', submittedAt: CREATED_AT.toISOString() },
      { note: 'meh', variationId: 'v-2', submittedAt: CREATED_AT.toISOString() },
    ])

    expect(body.byVariation['v-1']).toEqual({
      total: 2,
      clarity: { clear: 2 },
      timing: { just_right: 1, too_long: 1 },
      evaluation: { fair: 2 },
    })
    expect(body.byVariation['v-2']).toEqual({
      total: 1,
      clarity: { confusing: 1 },
      timing: { just_right: 1 },
      evaluation: { harsh: 1 },
    })
  })

  it('skips null signal fields in the aggregates', async () => {
    selectQueue.push([
      fb({ clarity: null, timing: null, evaluation: null, note: null }),
    ])
    const res = await makeApp().request('/admin/katas/k-1/feedback')
    const body = (await res.json()) as {
      total: number
      clarity: Record<string, number>
      notes: unknown[]
    }
    expect(body.total).toBe(1)
    expect(body.clarity).toEqual({})
    expect(body.notes).toEqual([])
  })

  it('returns 500 when the feedback query rejects', async () => {
    dbSelect.mockImplementationOnce(() => {
      throw new Error('db down')
    })
    const res = await makeApp().request('/admin/katas/k-1/feedback')
    expect(res.status).toBe(500)
  })
})

// ---------------------------------------------------------------------------
// PUT /katas/:id
// ---------------------------------------------------------------------------

describe('PUT /admin/katas/:id', () => {
  it('updates the kata, replaces variations, and returns ok', async () => {
    const res = await jsonReq('/admin/katas/k-1', 'PUT', validKataBody({
      languages: ['python', 'go'],
      tags: ['a', 'b'],
      topics: ['x'],
      status: 'published',
      adminNotes: 'note',
      variations: [
        { ownerRole: 'r1', ownerContext: 'c1' },
        { ownerRole: 'r2', ownerContext: 'c2' },
      ],
    }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })

    // Kata update targets the katas table.
    expect(dbUpdate).toHaveBeenCalledWith(katas)
    const setArg = updateSet.mock.calls[0][0] as Record<string, unknown>
    expect(setArg.title).toBe('Refactor the parser')
    expect(setArg.language).toBe(JSON.stringify(['python', 'go']))
    expect(setArg.tags).toBe(JSON.stringify(['a', 'b']))
    expect(setArg.topics).toBe(JSON.stringify(['x']))
    expect(setArg.status).toBe('published')
    expect(setArg.adminNotes).toBe('note')
    // WHERE on the kata id from the path param.
    expect(eq).toHaveBeenCalledWith(katas.id, 'k-1')

    // Old variations deleted, then one insert per new variation.
    expect(dbDelete).toHaveBeenCalledWith(variations)
    expect(eq).toHaveBeenCalledWith(variations.kataId, 'k-1')
    expect(dbInsert).toHaveBeenCalledTimes(2)
    expect(insertValues).toHaveBeenNthCalledWith(1, expect.objectContaining({
      kataId: 'k-1',
      ownerRole: 'r1',
      ownerContext: 'c1',
    }))
    expect(insertValues).toHaveBeenNthCalledWith(2, expect.objectContaining({
      kataId: 'k-1',
      ownerRole: 'r2',
      ownerContext: 'c2',
    }))
  })

  it('omits status from the SET when status is not supplied', async () => {
    const body = validKataBody()
    delete (body as Record<string, unknown>).status
    await jsonReq('/admin/katas/k-1', 'PUT', body)
    const setArg = updateSet.mock.calls[0][0] as Record<string, unknown>
    expect('status' in setArg).toBe(false)
  })

  it('persists adminNotes:null when explicitly null (distinct from omitted)', async () => {
    await jsonReq('/admin/katas/k-1', 'PUT', validKataBody({ adminNotes: null }))
    const setArg = updateSet.mock.calls[0][0] as Record<string, unknown>
    expect('adminNotes' in setArg).toBe(true)
    expect(setArg.adminNotes).toBeNull()
  })

  it('returns 400 when the body fails schema validation (bad difficulty)', async () => {
    const res = await jsonReq('/admin/katas/k-1', 'PUT', validKataBody({ difficulty: 'extreme' }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid request body' })
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it('returns 400 when variations is empty (min(1))', async () => {
    const res = await jsonReq('/admin/katas/k-1', 'PUT', validKataBody({ variations: [] }))
    expect(res.status).toBe(400)
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it('returns 500 when the body is not valid JSON', async () => {
    const res = await makeApp().request('/admin/katas/k-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    expect(res.status).toBe(500)
  })

  it('returns 500 when the update query rejects', async () => {
    updateWhere.mockRejectedValueOnce(new Error('constraint'))
    const res = await jsonReq('/admin/katas/k-1', 'PUT', validKataBody())
    expect(res.status).toBe(500)
  })
})

// ---------------------------------------------------------------------------
// POST /katas/:id/archive
// ---------------------------------------------------------------------------

describe('POST /admin/katas/:id/archive', () => {
  it('sets status archived for the path id and returns ok', async () => {
    const res = await makeApp().request('/admin/katas/k-1/archive', { method: 'POST' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })

    expect(dbUpdate).toHaveBeenCalledWith(katas)
    const setArg = updateSet.mock.calls[0][0] as Record<string, unknown>
    expect(setArg.status).toBe('archived')
    expect(eq).toHaveBeenCalledWith(katas.id, 'k-1')
  })

  it('returns 500 when the archive update rejects', async () => {
    updateWhere.mockRejectedValueOnce(new Error('db down'))
    const res = await makeApp().request('/admin/katas/k-1/archive', { method: 'POST' })
    expect(res.status).toBe(500)
  })
})

// ---------------------------------------------------------------------------
// POST /katas
// ---------------------------------------------------------------------------

describe('POST /admin/katas', () => {
  it('creates a kata via the use case with mapped args and returns 201', async () => {
    createKata.mockResolvedValue({ id: 'new-kata' })
    const res = await jsonReq('/admin/katas', 'POST', validKataBody())
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: 'new-kata' })

    expect(createKata).toHaveBeenCalledWith({
      title: 'Refactor the parser',
      description: 'A tricky one',
      durationMinutes: 30,
      difficulty: 'medium',
      type: 'code',
      languages: ['python'],
      tags: ['parsing'],
      topics: ['recursion'],
      createdBy: 'user-1',
      variations: [{ ownerRole: 'senior', ownerContext: 'legacy codebase' }],
    })
  })

  it('applies schema defaults for omitted optional arrays', async () => {
    createKata.mockResolvedValue({ id: 'new-kata' })
    const body = validKataBody()
    delete (body as Record<string, unknown>).languages
    delete (body as Record<string, unknown>).tags
    delete (body as Record<string, unknown>).topics
    await jsonReq('/admin/katas', 'POST', body)
    const arg = createKata.mock.calls[0][0] as { languages: string[]; tags: string[]; topics: string[] }
    expect(arg.languages).toEqual([])
    expect(arg.tags).toEqual([])
    expect(arg.topics).toEqual([])
  })

  it('returns 400 on an invalid type and never calls the use case', async () => {
    const res = await jsonReq('/admin/katas', 'POST', validKataBody({ type: 'video' }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid request body' })
    expect(createKata).not.toHaveBeenCalled()
  })

  it('returns 400 when duration is not a positive integer', async () => {
    const res = await jsonReq('/admin/katas', 'POST', validKataBody({ duration: -5 }))
    expect(res.status).toBe(400)
    expect(createKata).not.toHaveBeenCalled()
  })

  it('returns 500 when the use case rejects', async () => {
    createKata.mockRejectedValue(new Error('repo failed'))
    const res = await jsonReq('/admin/katas', 'POST', validKataBody())
    expect(res.status).toBe(500)
  })
})

// ---------------------------------------------------------------------------
// POST /invitations
// ---------------------------------------------------------------------------

describe('POST /admin/invitations', () => {
  const EXPIRES = new Date('2026-07-01T00:00:00.000Z')

  function seedInvitationInsert() {
    insertReturning.mockResolvedValue([
      { id: 'inv-1', token: 'tok123', expiresAt: EXPIRES },
    ])
  }

  it('creates an invitation with no email and returns 201 with emailSent:false', async () => {
    seedInvitationInsert()
    const res = await jsonReq('/admin/invitations', 'POST', {})
    expect(res.status).toBe(201)

    const body = (await res.json()) as {
      id: string
      token: string
      url: string
      expiresAt: string
      emailSent: boolean
    }
    expect(body.id).toBe('inv-1')
    // token in the response comes from the DB row (.returning()).
    expect(body.token).toBe('tok123')
    // url is built from the locally generated token (16 hex chars), NOT the
    // DB row's token — assert the shape rather than a fixed value.
    expect(body.url).toMatch(/^https:\/\/dojo\.example\/invite\/[0-9a-f]{16}$/)
    expect(body.expiresAt).toBe(EXPIRES.toISOString())
    expect(body.emailSent).toBe(false)

    // Insert records createdBy from the authed user and the generated token
    // (same one used to build the url, distinct from the DB-returned token).
    const insertArg = insertValues.mock.calls[0][0] as { createdBy: string; token: string }
    expect(insertArg.createdBy).toBe('user-1')
    expect(body.url).toBe(`https://dojo.example/invite/${insertArg.token}`)
    expect(resendSend).not.toHaveBeenCalled()
  })

  it('does not send email when an email is given but Resend is unconfigured', async () => {
    seedInvitationInsert()
    mockConfig.RESEND_API_KEY = ''
    const res = await jsonReq('/admin/invitations', 'POST', { email: 'x@y.com' })
    const body = (await res.json()) as { emailSent: boolean }
    expect(body.emailSent).toBe(false)
    expect(resendSend).not.toHaveBeenCalled()
  })

  it('sends the invite email and reports emailSent:true when configured', async () => {
    seedInvitationInsert()
    mockConfig.RESEND_API_KEY = 're_test'
    resendSend.mockResolvedValue({ id: 'email-1' })

    const res = await jsonReq('/admin/invitations', 'POST', { email: 'invitee@example.com' })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { emailSent: boolean }
    expect(body.emailSent).toBe(true)

    expect(resendSend).toHaveBeenCalledTimes(1)
    const sendArg = resendSend.mock.calls[0][0] as { to: string; from: string; html: string }
    expect(sendArg.to).toBe('invitee@example.com')
    expect(sendArg.from).toBe('dojo <noreply@example.dev>')
    // The email links to the generated token (same one passed to the insert).
    const generatedToken = (insertValues.mock.calls[0][0] as { token: string }).token
    expect(sendArg.html).toContain(`https://dojo.example/invite/${generatedToken}`)
  })

  it('swallows a Resend failure and still returns 201 with emailSent:false', async () => {
    seedInvitationInsert()
    mockConfig.RESEND_API_KEY = 're_test'
    resendSend.mockRejectedValue(new Error('resend down'))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const res = await jsonReq('/admin/invitations', 'POST', { email: 'invitee@example.com' })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { emailSent: boolean }
    expect(body.emailSent).toBe(false)

    errSpy.mockRestore()
  })

  it('ignores an invalid email body (parse fails -> email undefined, no send)', async () => {
    seedInvitationInsert()
    mockConfig.RESEND_API_KEY = 're_test'
    const res = await jsonReq('/admin/invitations', 'POST', { email: 'not-an-email' })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { emailSent: boolean }
    expect(body.emailSent).toBe(false)
    expect(resendSend).not.toHaveBeenCalled()
  })

  it('tolerates a non-JSON body (catch -> {}) and still creates the invitation', async () => {
    seedInvitationInsert()
    const res = await makeApp().request('/admin/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    expect(res.status).toBe(201)
    expect(dbInsert).toHaveBeenCalledTimes(1)
  })

  it('returns 500 when the invitation insert rejects', async () => {
    insertReturning.mockRejectedValue(new Error('db down'))
    const res = await jsonReq('/admin/invitations', 'POST', {})
    expect(res.status).toBe(500)
  })
})

// ---------------------------------------------------------------------------
// GET /invitations
// ---------------------------------------------------------------------------

describe('GET /admin/invitations', () => {
  function invRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 'inv-1',
      token: 'tok123',
      usedBy: null,
      usedByUsername: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      createdAt: CREATED_AT,
      ...overrides,
    }
  }

  it('marks an unused, unexpired invitation as pending', async () => {
    selectQueue.push([invRow()])
    const res = await makeApp().request('/admin/invitations')
    expect(res.status).toBe(200)
    const body = (await res.json()) as Array<{ status: string; usedBy: string | null }>
    expect(body[0].status).toBe('pending')
    expect(body[0].usedBy).toBeNull()
  })

  it('marks a used invitation as used and surfaces the username', async () => {
    selectQueue.push([invRow({ usedBy: 'user-9', usedByUsername: 'neo' })])
    const res = await makeApp().request('/admin/invitations')
    const body = (await res.json()) as Array<{ status: string; usedBy: string | null }>
    expect(body[0].status).toBe('used')
    expect(body[0].usedBy).toBe('neo')
  })

  it('marks an unused, past-expiry invitation as expired', async () => {
    selectQueue.push([invRow({ expiresAt: new Date(Date.now() - 60 * 60 * 1000) })])
    const res = await makeApp().request('/admin/invitations')
    const body = (await res.json()) as Array<{ status: string }>
    expect(body[0].status).toBe('expired')
  })

  it('returns an empty array when there are no invitations', async () => {
    selectQueue.push([])
    const res = await makeApp().request('/admin/invitations')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns 500 when the listing query rejects', async () => {
    dbSelect.mockImplementationOnce(() => {
      throw new Error('db down')
    })
    const res = await makeApp().request('/admin/invitations')
    expect(res.status).toBe(500)
  })
})
