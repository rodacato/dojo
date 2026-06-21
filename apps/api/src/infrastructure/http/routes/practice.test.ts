import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as DrizzleOrm from 'drizzle-orm'
import type { AppEnv } from '../app-env'

// ---------------------------------------------------------------------------
// Hoisted boundary bindings. authState drives the mocked requireAuth so
// 401/403/200 are exercised through real handler branches. Everything below
// the handler (container use-cases, drizzle client, metrics, config, resend)
// is mocked at the boundary; the route's own branching runs for real.
// ---------------------------------------------------------------------------
const {
  mockConfig,
  authState,
  getKataOptions,
  getKataById,
  startSession,
  getSession,
  generateSessionBodyExecute,
  generateSessionBodyStream,
  errorReport,
  trackEvent,
  resendSend,
  // db chain spies
  selectResult,
  dbSelect,
  deleteReturning,
  dbDelete,
  updateWhere,
  dbUpdate,
} = vi.hoisted(() => {
  // Per-call queue of rows the next db.select(...) chain resolves to.
  const selectResult: { rows: unknown[] } = { rows: [] }

  // db.select(cols?).from(t).where(c)[.orderBy(c)] — thenable at the end of
  // either the .where or .orderBy hop so both call sites resolve.
  const thenable = (): Record<string, unknown> => ({
    where: vi.fn(() => ({
      orderBy: vi.fn(() => Promise.resolve(selectResult.rows)),
      then: (onF: (v: unknown[]) => unknown) => Promise.resolve(selectResult.rows).then(onF),
    })),
  })
  const dbSelect = vi.fn(() => ({ from: vi.fn(thenable) }))

  const deleteReturning = vi.fn()
  const dbDelete = vi.fn(() => ({ where: vi.fn(() => ({ returning: deleteReturning })) }))

  const updateWhere = vi.fn(() => Promise.resolve(undefined))
  const dbUpdate = vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) }))

  return {
    mockConfig: {
      FF_LLM_PREP_STREAMING_ENABLED: false,
      RESEND_API_KEY: '',
      RESEND_FROM_EMAIL: 'dojo <noreply@notdefined.dev>',
      CRON_SECRET: 'cron-secret',
      CREATOR_GITHUB_ID: 'creator-gh',
      WEB_URL: 'https://dojo.test',
      SESSION_SECRET: 'x'.repeat(32),
    },
    authState: { user: null as Record<string, unknown> | null },
    getKataOptions: vi.fn(),
    getKataById: vi.fn(),
    startSession: vi.fn(),
    getSession: vi.fn(),
    generateSessionBodyExecute: vi.fn(),
    generateSessionBodyStream: vi.fn(),
    errorReport: vi.fn(),
    trackEvent: vi.fn(),
    resendSend: vi.fn(),
    selectResult,
    dbSelect,
    deleteReturning,
    dbDelete,
    updateWhere,
    dbUpdate,
  }
})

vi.mock('../../../config', () => ({ config: mockConfig }))

vi.mock('../../container', () => ({
  errorReporter: { report: errorReport },
  useCases: {
    getKataOptions: { execute: getKataOptions },
    getKataById: { execute: getKataById },
    startSession: { execute: startSession },
    getSession: { execute: getSession },
    generateSessionBody: {
      execute: generateSessionBodyExecute,
      executeStream: generateSessionBodyStream,
    },
  },
}))

vi.mock('../../observability/metrics', () => ({ trackEvent }))

vi.mock('../../persistence/drizzle/client', () => ({
  db: { select: dbSelect, delete: dbDelete, update: dbUpdate },
}))

// Plain table refs — only fed into eq()/and()/gte()/lt() operands.
vi.mock('../../persistence/drizzle/schema', () => ({
  attempts: { id: 'attempts.id', sessionId: 'attempts.sessionId', submittedAt: 'attempts.submittedAt' },
  sessions: { id: 'sessions.id' },
  users: {
    id: 'users.id',
    username: 'users.username',
    email: 'users.email',
    reminderEnabled: 'users.reminderEnabled',
    reminderHour: 'users.reminderHour',
  },
  errors: { id: 'errors.id', createdAt: 'errors.createdAt' },
  playgroundRuns: { sessionHash: 'pr.sessionHash', createdAt: 'pr.createdAt' },
}))

// resend is dynamically imported inside the handlers; mock the module so no
// network call ever fires. The Resend ctor returns an object whose
// emails.send is our spy.
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({ emails: { send: resendSend } })),
}))

// Auth boundary: requireAuth throws the same 401 HTTPException the real
// middleware does (router onError maps it); on success it sets c.get('user').
vi.mock('../middleware/auth', () => ({
  requireAuth: async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
    if (!authState.user) {
      throw new HTTPException(401, { message: 'Authentication required' })
    }
    c.set('user', authState.user)
    await next()
  },
}))

// Real drizzle operators, but eq/and/gte/lt spied so WHERE construction can be
// asserted against the route's params (not coverage theater).
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof DrizzleOrm>()
  return {
    ...actual,
    eq: vi.fn(actual.eq),
    and: vi.fn(actual.and),
    gte: vi.fn(actual.gte),
    lt: vi.fn(actual.lt),
  }
})

import { eq, gte, lt } from 'drizzle-orm'
import { practiceRoutes } from './practice'
import { pendingAttempts } from './pending-attempts'

const eqSpy = vi.mocked(eq)
const gteSpy = vi.mocked(gte)
const ltSpy = vi.mocked(lt)

// The router's production onError so DomainError + thrown errors surface as the
// real status codes the app ships (e.g. SESSION_EXPIRED -> 408).
function makeApp() {
  const app = new Hono<AppEnv>()
  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()
    if (err.name === 'DomainError') {
      const code = (err as { code?: string }).code
      const status: ContentfulStatusCode = code === 'SESSION_EXPIRED' ? 408 : 500
      return c.json({ error: err.message, code }, status)
    }
    void errorReport({ message: err.message, status: 500 })
    return c.json({ error: 'Internal server error' }, 500)
  })
  app.route('/', practiceRoutes)
  return app
}

const KATA_UUID = '11111111-1111-1111-1111-111111111111'
const SESSION_ID = 'sess-1'

function authedUser(over: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    githubId: 'gh-1',
    username: 'neo',
    avatarUrl: 'https://avatar/neo.png',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...over,
  }
}

function sessionEntity(over: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    userId: 'user-1',
    kataId: KATA_UUID,
    variationId: 'var-1',
    body: 'kata body',
    status: 'active',
    startedAt: new Date('2026-06-01T10:00:00.000Z'),
    completedAt: null,
    attempts: [],
    isExpired: vi.fn(() => false),
    ...over,
  }
}

function kataEntity(over: Record<string, unknown> = {}) {
  return {
    id: KATA_UUID,
    title: 'Reverse a string',
    description: 'desc',
    durationMinutes: 15,
    difficulty: 'easy',
    type: 'code',
    languages: ['python'],
    tags: ['strings'],
    starterCode: 'def f(): pass',
    variations: [{ id: 'var-1', ownerRole: 'reviewer', ownerContext: 'ctx' }],
    ...over,
  }
}

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return makeApp().request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.user = null
  selectResult.rows = []
  mockConfig.FF_LLM_PREP_STREAMING_ENABLED = false
  mockConfig.RESEND_API_KEY = ''
  mockConfig.CRON_SECRET = 'cron-secret'
  mockConfig.CREATOR_GITHUB_ID = 'creator-gh'
  pendingAttempts.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

// ===========================================================================
// GET /auth/me
// ===========================================================================
describe('GET /auth/me', () => {
  function me() {
    return makeApp().request('/auth/me')
  }

  it('returns 401 for an unauthenticated caller (requireAuth gate)', async () => {
    const res = await me()
    expect(res.status).toBe(401)
  })

  it('serializes the user and flags isCreator=false for a non-creator', async () => {
    authState.user = authedUser({ githubId: 'gh-other' })
    const res = await me()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      id: 'user-1',
      username: 'neo',
      avatarUrl: 'https://avatar/neo.png',
      createdAt: '2026-01-01T00:00:00.000Z',
      isCreator: false,
    })
  })

  it('flags isCreator=true when githubId matches CREATOR_GITHUB_ID', async () => {
    authState.user = authedUser({ githubId: 'creator-gh' })
    const res = await me()
    expect(((await res.json()) as { isCreator: boolean }).isCreator).toBe(true)
  })

  it('never flags isCreator when CREATOR_GITHUB_ID is unset, even on empty githubId', async () => {
    mockConfig.CREATOR_GITHUB_ID = ''
    authState.user = authedUser({ githubId: '' })
    const res = await me()
    expect(((await res.json()) as { isCreator: boolean }).isCreator).toBe(false)
  })
})

// ===========================================================================
// POST /access-requests (public)
// ===========================================================================
describe('POST /access-requests', () => {
  it('returns 400 on an invalid github handle', async () => {
    const res = await post('/access-requests', { githubHandle: 'bad handle!' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid request' })
    expect(resendSend).not.toHaveBeenCalled()
  })

  it('returns 503 when RESEND_API_KEY is not configured', async () => {
    mockConfig.RESEND_API_KEY = ''
    const res = await post('/access-requests', { githubHandle: '@neo' })
    expect(res.status).toBe(503)
    // A valid handle reached the 503 branch — this is not a masked 400.
    expect(res.status).not.toBe(400)
    expect(await res.json()).toEqual({ error: 'Access request channel not available' })
    expect(resendSend).not.toHaveBeenCalled()
  })

  it('sends the email and escapes html in handle/reason when configured', async () => {
    mockConfig.RESEND_API_KEY = 'rk-live'
    resendSend.mockResolvedValue({ id: 'em-1' })
    const res = await post('/access-requests', { githubHandle: 'neo', reason: '<b>hi</b>' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(resendSend).toHaveBeenCalledTimes(1)
    const sent = resendSend.mock.calls[0]?.[0] as { subject: string; html: string }
    expect(sent.subject).toContain('neo')
    // reason is html-escaped, not injected raw.
    expect(sent.html).toContain('&lt;b&gt;hi&lt;/b&gt;')
    expect(sent.html).not.toContain('<b>hi</b>')
  })

  it('returns 502 when resend delivery throws', async () => {
    mockConfig.RESEND_API_KEY = 'rk-live'
    resendSend.mockRejectedValue(new Error('smtp down'))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const res = await post('/access-requests', { githubHandle: 'neo' })
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ error: 'Email delivery failed' })
    errSpy.mockRestore()
  })
})

// ===========================================================================
// GET /katas
// ===========================================================================
describe('GET /katas', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await makeApp().request('/katas')
    expect(res.status).toBe(401)
    expect(getKataOptions).not.toHaveBeenCalled()
  })

  it('maps the exercise list and forwards parsed filters to the use case', async () => {
    authState.user = authedUser()
    getKataOptions.mockResolvedValue([
      {
        id: 'k1',
        title: 'T',
        description: 'D',
        durationMinutes: 10,
        difficulty: 'easy',
        type: 'code',
        languages: ['python'],
        tags: ['t'],
      },
    ])
    const res = await makeApp().request('/katas?mood=focused&maxDuration=20')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([
      {
        id: 'k1',
        title: 'T',
        description: 'D',
        duration: 10,
        difficulty: 'easy',
        type: 'code',
        language: ['python'],
        tags: ['t'],
      },
    ])
    expect(getKataOptions).toHaveBeenCalledWith({
      userId: 'user-1',
      filters: { mood: 'focused', maxDuration: 20 },
    })
  })

  it('returns 500 via onError when an invalid mood fails the schema parse', async () => {
    // The handler uses .parse() (not safeParse) so a bad enum throws -> onError.
    authState.user = authedUser()
    const res = await makeApp().request('/katas?mood=sleepy')
    expect(res.status).toBe(500)
    expect(getKataOptions).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// POST /sessions
// ===========================================================================
describe('POST /sessions', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await post('/sessions', { kataId: KATA_UUID })
    expect(res.status).toBe(401)
  })

  it('returns 400 when kataId is not a uuid', async () => {
    authState.user = authedUser()
    const res = await post('/sessions', { kataId: 'nope' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid request body' })
    expect(startSession).not.toHaveBeenCalled()
  })

  it('returns 404 when the kata does not exist', async () => {
    authState.user = authedUser()
    getKataById.mockResolvedValue(null)
    const res = await post('/sessions', { kataId: KATA_UUID })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Kata not found' })
    expect(startSession).not.toHaveBeenCalled()
  })

  it('returns 422 when the kata has no variations', async () => {
    authState.user = authedUser()
    getKataById.mockResolvedValue(kataEntity({ variations: [] }))
    const res = await post('/sessions', { kataId: KATA_UUID })
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: 'Kata has no variations' })
    expect(startSession).not.toHaveBeenCalled()
  })

  it('starts the session, returns 201 with sessionId, and kicks off bg body gen when streaming flag is OFF', async () => {
    authState.user = authedUser()
    getKataById.mockResolvedValue(kataEntity())
    startSession.mockResolvedValue({ id: SESSION_ID, kataId: KATA_UUID, variationId: 'var-1' })
    generateSessionBodyExecute.mockResolvedValue(undefined)

    const res = await post('/sessions', { kataId: KATA_UUID })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ sessionId: SESSION_ID })
    expect(startSession).toHaveBeenCalledWith({
      userId: 'user-1',
      kataId: KATA_UUID,
      variationId: 'var-1',
    })
    expect(generateSessionBodyExecute).toHaveBeenCalledWith({
      sessionId: SESSION_ID,
      kataId: KATA_UUID,
      variationId: 'var-1',
    })
  })

  it('skips background body generation when the streaming flag is ON', async () => {
    mockConfig.FF_LLM_PREP_STREAMING_ENABLED = true
    authState.user = authedUser()
    getKataById.mockResolvedValue(kataEntity())
    startSession.mockResolvedValue({ id: SESSION_ID, kataId: KATA_UUID, variationId: 'var-1' })

    const res = await post('/sessions', { kataId: KATA_UUID })
    expect(res.status).toBe(201)
    expect(generateSessionBodyExecute).not.toHaveBeenCalled()
  })

  it('fires playground_signup_conversion when a recent playground run matches the cookie', async () => {
    authState.user = authedUser()
    getKataById.mockResolvedValue(kataEntity())
    startSession.mockResolvedValue({ id: SESSION_ID, kataId: KATA_UUID, variationId: 'var-1' })
    selectResult.rows = [{ count: 3 }]

    const res = await post('/sessions', { kataId: KATA_UUID }, {
      cookie: 'dojo_playground_session=pg-123',
    })
    // Cookie funnel is fire-and-forget; await the microtask so the spy lands.
    await res.json()
    await new Promise((r) => setImmediate(r))

    expect(trackEvent).toHaveBeenCalledWith('playground_signup_conversion', {
      sessionId: SESSION_ID,
      userId: 'user-1',
      playgroundRunCount: 3,
      windowHours: 24,
    })
    // WHERE is built from the peppered hash + the 24h window, not a constant.
    expect(gteSpy).toHaveBeenCalled()
    expect(eqSpy).toHaveBeenCalledWith('pr.sessionHash', expect.stringMatching(/^[a-f0-9]{64}$/))
  })

  it('does not fire conversion when there is no playground cookie', async () => {
    authState.user = authedUser()
    getKataById.mockResolvedValue(kataEntity())
    startSession.mockResolvedValue({ id: SESSION_ID, kataId: KATA_UUID, variationId: 'var-1' })

    await post('/sessions', { kataId: KATA_UUID })
    await new Promise((r) => setImmediate(r))
    expect(trackEvent).not.toHaveBeenCalled()
    expect(dbSelect).not.toHaveBeenCalled()
  })

  it('does not fire conversion when the cookie matches zero recent runs', async () => {
    authState.user = authedUser()
    getKataById.mockResolvedValue(kataEntity())
    startSession.mockResolvedValue({ id: SESSION_ID, kataId: KATA_UUID, variationId: 'var-1' })
    selectResult.rows = [{ count: 0 }]

    await post('/sessions', { kataId: KATA_UUID }, { cookie: 'dojo_playground_session=pg-123' })
    await new Promise((r) => setImmediate(r))
    expect(trackEvent).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// GET /sessions/:id
// ===========================================================================
describe('GET /sessions/:id', () => {
  function get(id = SESSION_ID) {
    return makeApp().request(`/sessions/${id}`)
  }

  it('returns 401 when unauthenticated', async () => {
    const res = await get()
    expect(res.status).toBe(401)
  })

  it('returns 404 when the session is missing', async () => {
    authState.user = authedUser()
    getSession.mockResolvedValue(null)
    const res = await get()
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Session not found' })
  })

  it('returns 403 when the session belongs to another user', async () => {
    authState.user = authedUser({ id: 'user-1' })
    getSession.mockResolvedValue(sessionEntity({ userId: 'user-2' }))
    const res = await get()
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Forbidden' })
  })

  it('returns 404 when the kata behind the session is missing', async () => {
    authState.user = authedUser()
    getSession.mockResolvedValue(sessionEntity())
    getKataById.mockResolvedValue(null)
    const res = await get()
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Kata not found' })
  })

  it('returns the session DTO with no finalAttempt when there are no attempts', async () => {
    authState.user = authedUser()
    getSession.mockResolvedValue(sessionEntity())
    getKataById.mockResolvedValue(kataEntity())
    selectResult.rows = []
    const res = await get()
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.id).toBe(SESSION_ID)
    expect(body.ownerRole).toBe('reviewer')
    expect(body.finalAttempt).toBeNull()
    expect((body.kata as { starterCode: string }).starterCode).toBe('def f(): pass')
    // Date serialization: startedAt via toISOString(), completedAt via ?? null fallback.
    expect(body.status).toBe('active')
    expect(body.startedAt).toBe('2026-06-01T10:00:00.000Z')
    expect(body.completedAt).toBeNull()
    // attempts are fetched filtered by this sessionId.
    expect(eqSpy).toHaveBeenCalledWith('attempts.sessionId', SESSION_ID)
  })

  it('parses the LLM JSON of the final attempt into verdict/analysis/topics', async () => {
    authState.user = authedUser()
    getSession.mockResolvedValue(sessionEntity())
    getKataById.mockResolvedValue(kataEntity())
    selectResult.rows = [
      {
        id: 'att-final',
        userResponse: 'my answer',
        llmResponse: JSON.stringify({
          verdict: 'passed',
          analysis: 'good job',
          topicsToReview: ['recursion'],
        }),
        isFinalEvaluation: true,
        submittedAt: new Date('2026-06-01T10:05:00.000Z'),
      },
    ]
    const res = await get()
    const body = (await res.json()) as { finalAttempt: Record<string, unknown> }
    expect(body.finalAttempt).toEqual({
      id: 'att-final',
      userResponse: 'my answer',
      verdict: 'passed',
      analysis: 'good job',
      topicsToReview: ['recursion'],
      isFinalEvaluation: true,
      submittedAt: '2026-06-01T10:05:00.000Z',
    })
  })

  it('falls back to raw analysis when the LLM response is not valid JSON', async () => {
    authState.user = authedUser()
    getSession.mockResolvedValue(sessionEntity())
    getKataById.mockResolvedValue(kataEntity())
    selectResult.rows = [
      {
        id: 'att-1',
        userResponse: 'r',
        llmResponse: 'not json here',
        isFinalEvaluation: false,
        submittedAt: new Date('2026-06-01T10:03:00.000Z'),
      },
    ]
    const res = await get()
    const body = (await res.json()) as { finalAttempt: Record<string, unknown> }
    expect(body.finalAttempt.verdict).toBeNull()
    expect(body.finalAttempt.analysis).toBe('not json here')
    expect(body.finalAttempt.topicsToReview).toEqual([])
  })
})

// ===========================================================================
// GET /sessions/:id/body-stream  (SSE)
// ===========================================================================
describe('GET /sessions/:id/body-stream', () => {
  function stream(id = SESSION_ID) {
    return makeApp().request(`/sessions/${id}/body-stream`)
  }

  it('returns 404 when the streaming feature flag is off', async () => {
    mockConfig.FF_LLM_PREP_STREAMING_ENABLED = false
    authState.user = authedUser()
    const res = await stream()
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(getSession).not.toHaveBeenCalled()
  })

  it('returns 401 when unauthenticated even with the flag on', async () => {
    mockConfig.FF_LLM_PREP_STREAMING_ENABLED = true
    const res = await stream()
    expect(res.status).toBe(401)
  })

  it('returns 404 when the session is missing', async () => {
    mockConfig.FF_LLM_PREP_STREAMING_ENABLED = true
    authState.user = authedUser()
    getSession.mockResolvedValue(null)
    const res = await stream()
    expect(res.status).toBe(404)
  })

  it('returns 403 when the session belongs to another user', async () => {
    mockConfig.FF_LLM_PREP_STREAMING_ENABLED = true
    authState.user = authedUser({ id: 'user-1' })
    getSession.mockResolvedValue(sessionEntity({ userId: 'user-2' }))
    const res = await stream()
    expect(res.status).toBe(403)
  })

  it('replays an already-persisted body as a single token + done without calling the LLM', async () => {
    mockConfig.FF_LLM_PREP_STREAMING_ENABLED = true
    authState.user = authedUser()
    getSession.mockResolvedValue(sessionEntity({ body: 'cached body' }))
    const res = await stream()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    const text = await res.text()
    expect(text).toContain('event: token')
    expect(text).toContain('data: cached body')
    expect(text).toContain('event: done')
    expect(generateSessionBodyStream).not.toHaveBeenCalled()
  })

  it('streams generated chunks then a done event when no body is cached', async () => {
    mockConfig.FF_LLM_PREP_STREAMING_ENABLED = true
    authState.user = authedUser()
    getSession.mockResolvedValue(sessionEntity({ body: null }))
    async function* gen(): AsyncIterable<string> {
      yield 'Hel'
      yield 'lo'
    }
    generateSessionBodyStream.mockReturnValue(gen())
    const res = await stream()
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('data: Hel')
    expect(text).toContain('data: lo')
    expect(text).toContain('event: done')
    expect(generateSessionBodyStream).toHaveBeenCalledWith({
      sessionId: SESSION_ID,
      kataId: KATA_UUID,
      variationId: 'var-1',
    })
  })

  it('emits an error event when the generator throws mid-stream', async () => {
    mockConfig.FF_LLM_PREP_STREAMING_ENABLED = true
    authState.user = authedUser()
    getSession.mockResolvedValue(sessionEntity({ body: null }))
    async function* boom(): AsyncIterable<string> {
      yield 'partial'
      throw new Error('llm exploded')
    }
    generateSessionBodyStream.mockReturnValue(boom())
    const res = await stream()
    const text = await res.text()
    // The token emitted before the throw is flushed, then the error event.
    expect(text).toContain('data: partial')
    expect(text).toContain('event: error')
    expect(text).toContain('llm exploded')

    // The finally cleared the in-flight flag — a retry must not 409.
    generateSessionBodyStream.mockImplementation(async function* () {
      yield 'retry-ok'
    })
    const res2 = await stream()
    expect(res2.status).toBe(200)
    await res2.text()
  })

  it('clears the in-flight flag after a stream completes so a retry is not blocked', async () => {
    mockConfig.FF_LLM_PREP_STREAMING_ENABLED = true
    authState.user = authedUser()
    getSession.mockResolvedValue(sessionEntity({ body: null }))
    generateSessionBodyStream.mockImplementation(async function* () {
      yield 'x'
    })
    // First request drains fully.
    await (await stream()).text()
    // Second request must start a new generation, not 409.
    const res2 = await stream()
    expect(res2.status).toBe(200)
    expect(generateSessionBodyStream).toHaveBeenCalledTimes(2)
  })
})

// ===========================================================================
// POST /sessions/:id/attempts
// ===========================================================================
describe('POST /sessions/:id/attempts', () => {
  function submit(body: unknown, id = SESSION_ID) {
    return post(`/sessions/${id}/attempts`, body)
  }

  it('returns 401 when unauthenticated', async () => {
    const res = await submit({ userResponse: 'x' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when userResponse is empty', async () => {
    authState.user = authedUser()
    const res = await submit({ userResponse: '' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid request body' })
  })

  it('returns 404 when the session is missing', async () => {
    authState.user = authedUser()
    getSession.mockResolvedValue(null)
    const res = await submit({ userResponse: 'answer' })
    expect(res.status).toBe(404)
  })

  it('returns 403 for another user’s session', async () => {
    authState.user = authedUser({ id: 'user-1' })
    getSession.mockResolvedValue(sessionEntity({ userId: 'user-2' }))
    const res = await submit({ userResponse: 'answer' })
    expect(res.status).toBe(403)
  })

  it('returns 409 when the session is no longer active', async () => {
    authState.user = authedUser()
    getSession.mockResolvedValue(sessionEntity({ status: 'completed' }))
    const res = await submit({ userResponse: 'answer' })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'Session is no longer active' })
  })

  it('returns 404 when the kata is missing for timer enforcement', async () => {
    authState.user = authedUser()
    getSession.mockResolvedValue(sessionEntity())
    getKataById.mockResolvedValue(null)
    const res = await submit({ userResponse: 'answer' })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Kata not found' })
  })

  it('maps an expired session to 408 via the SessionExpiredError domain mapping', async () => {
    authState.user = authedUser()
    getSession.mockResolvedValue(sessionEntity({ isExpired: vi.fn(() => true) }))
    getKataById.mockResolvedValue(kataEntity())
    const res = await submit({ userResponse: 'answer' })
    expect(res.status).toBe(408)
    expect(((await res.json()) as { code: string }).code).toBe('SESSION_EXPIRED')
  })

  it('queues a pending attempt and returns 202 with the attemptId', async () => {
    vi.useFakeTimers()
    authState.user = authedUser()
    getSession.mockResolvedValue(sessionEntity())
    getKataById.mockResolvedValue(kataEntity())
    const res = await submit({ userResponse: 'my final answer' })
    expect(res.status).toBe(202)
    const { attemptId } = (await res.json()) as { attemptId: string }
    expect(attemptId).toMatch(/[0-9a-f-]{36}/)
    expect(pendingAttempts.get(attemptId)).toEqual({
      sessionId: SESSION_ID,
      userResponse: 'my final answer',
    })
    // The TTL evicts the entry after 5 minutes.
    vi.advanceTimersByTime(5 * 60 * 1000)
    expect(pendingAttempts.has(attemptId)).toBe(false)
  })
})

// ===========================================================================
// POST /sessions/:id/retry-evaluation
// ===========================================================================
describe('POST /sessions/:id/retry-evaluation', () => {
  function retry(id = SESSION_ID) {
    return post(`/sessions/${id}/retry-evaluation`, {})
  }

  it('returns 401 when unauthenticated', async () => {
    const res = await retry()
    expect(res.status).toBe(401)
  })

  it('returns 404 when the session is missing', async () => {
    authState.user = authedUser()
    getSession.mockResolvedValue(null)
    const res = await retry()
    expect(res.status).toBe(404)
  })

  it('returns 403 for another user’s session', async () => {
    authState.user = authedUser({ id: 'user-1' })
    getSession.mockResolvedValue(sessionEntity({ userId: 'user-2', attempts: [] }))
    const res = await retry()
    expect(res.status).toBe(403)
  })

  it('returns 400 when there is no attempt to retry', async () => {
    authState.user = authedUser()
    getSession.mockResolvedValue(sessionEntity({ attempts: [] }))
    const res = await retry()
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'No attempt to retry' })
  })

  it('returns 409 when the last attempt already has an evaluation', async () => {
    authState.user = authedUser()
    getSession.mockResolvedValue(
      sessionEntity({
        attempts: [{ id: 'a1', userResponse: 'r', evaluationResult: { verdict: 'passed' } }],
      }),
    )
    const res = await retry()
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'Session already has evaluation' })
  })

  it('deletes the failed attempt, re-queues it, resets a failed session to active, and returns 202', async () => {
    vi.useFakeTimers()
    authState.user = authedUser()
    getSession.mockResolvedValue(
      sessionEntity({
        status: 'failed',
        attempts: [{ id: 'a-failed', userResponse: 'orphan answer', evaluationResult: null }],
      }),
    )
    const res = await retry()
    expect(res.status).toBe(202)
    const { attemptId } = (await res.json()) as { attemptId: string }
    expect(pendingAttempts.get(attemptId)).toEqual({
      sessionId: SESSION_ID,
      userResponse: 'orphan answer',
    })
    // Failed attempt deleted by id.
    expect(dbDelete).toHaveBeenCalledTimes(1)
    expect(eqSpy).toHaveBeenCalledWith('attempts.id', 'a-failed')
    // Session reset to active (status was 'failed').
    expect(dbUpdate).toHaveBeenCalledTimes(1)
    expect(updateWhere).toHaveBeenCalled()
    expect(eqSpy).toHaveBeenCalledWith('sessions.id', SESSION_ID)
    vi.useRealTimers()
  })

  it('does not reset the session when its status is already active', async () => {
    authState.user = authedUser()
    getSession.mockResolvedValue(
      sessionEntity({
        status: 'active',
        attempts: [{ id: 'a-x', userResponse: 'r', evaluationResult: null }],
      }),
    )
    const res = await retry()
    expect(res.status).toBe(202)
    expect(dbDelete).toHaveBeenCalledTimes(1)
    expect(dbUpdate).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// POST /cron/reminders
// ===========================================================================
describe('POST /cron/reminders', () => {
  it('returns 401 when the Authorization bearer does not match CRON_SECRET', async () => {
    const res = await post('/cron/reminders', {}, { Authorization: 'Bearer wrong' })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
    expect(dbSelect).not.toHaveBeenCalled()
  })

  it('returns sent:0 when no users are eligible', async () => {
    selectResult.rows = []
    const res = await post('/cron/reminders', {}, { Authorization: 'Bearer cron-secret' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ sent: 0 })
    expect(resendSend).not.toHaveBeenCalled()
  })

  it('returns sent:0 when eligible users exist but RESEND_API_KEY is unset', async () => {
    mockConfig.RESEND_API_KEY = ''
    selectResult.rows = [{ id: 'u1', username: 'a', email: 'a@x.com' }]
    const res = await post('/cron/reminders', {}, { Authorization: 'Bearer cron-secret' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ sent: 0 })
    expect(resendSend).not.toHaveBeenCalled()
  })

  it('sends to each eligible user and reports the count', async () => {
    mockConfig.RESEND_API_KEY = 'rk-live'
    resendSend.mockResolvedValue({ id: 'em' })
    selectResult.rows = [
      { id: 'u1', username: 'a', email: 'a@x.com' },
      { id: 'u2', username: 'b', email: 'b@x.com' },
    ]
    const res = await post('/cron/reminders', {}, { Authorization: 'Bearer cron-secret' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ sent: 2 })
    expect(resendSend).toHaveBeenCalledTimes(2)
    // The eligibility WHERE filters on reminderEnabled + the current UTC hour.
    expect(eqSpy).toHaveBeenCalledWith('users.reminderEnabled', true)
    expect(eqSpy).toHaveBeenCalledWith('users.reminderHour', new Date().getUTCHours())
  })

  it('counts only successful sends when one delivery throws', async () => {
    mockConfig.RESEND_API_KEY = 'rk-live'
    resendSend.mockResolvedValueOnce({ id: 'em' }).mockRejectedValueOnce(new Error('bounce'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    selectResult.rows = [
      { id: 'u1', username: 'a', email: 'a@x.com' },
      { id: 'u2', username: 'b', email: 'b@x.com' },
    ]
    const res = await post('/cron/reminders', {}, { Authorization: 'Bearer cron-secret' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ sent: 1 })
    warnSpy.mockRestore()
  })

  it('skips users with a null email without sending', async () => {
    mockConfig.RESEND_API_KEY = 'rk-live'
    resendSend.mockResolvedValue({ id: 'em' })
    selectResult.rows = [
      { id: 'u1', username: 'a', email: null },
      { id: 'u2', username: 'b', email: 'b@x.com' },
    ]
    const res = await post('/cron/reminders', {}, { Authorization: 'Bearer cron-secret' })
    expect(await res.json()).toEqual({ sent: 1 })
    expect(resendSend).toHaveBeenCalledTimes(1)
  })
})

// ===========================================================================
// POST /cron/cleanup-errors
// ===========================================================================
describe('POST /cron/cleanup-errors', () => {
  it('returns 401 when CRON_SECRET is unset (even with no auth header)', async () => {
    mockConfig.CRON_SECRET = ''
    const res = await post('/cron/cleanup-errors', {})
    expect(res.status).toBe(401)
    expect(dbDelete).not.toHaveBeenCalled()
  })

  it('returns 401 when the bearer is wrong', async () => {
    const res = await post('/cron/cleanup-errors', {}, { Authorization: 'Bearer nope' })
    expect(res.status).toBe(401)
    expect(dbDelete).not.toHaveBeenCalled()
  })

  it('deletes errors older than the retention threshold and reports the count', async () => {
    deleteReturning.mockResolvedValue([{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }])
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const res = await post('/cron/cleanup-errors', {}, { Authorization: 'Bearer cron-secret' })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { deleted: number; retentionDays: number; threshold: string }
    expect(body.deleted).toBe(3)
    expect(body.retentionDays).toBe(30)
    expect(typeof body.threshold).toBe('string')
    // Deletion WHERE filters createdAt below the computed threshold.
    expect(dbDelete).toHaveBeenCalledTimes(1)
    const ltArgs = ltSpy.mock.calls[0]
    expect(ltArgs?.[0]).toBe('errors.createdAt')
    expect(ltArgs?.[1]).toBeInstanceOf(Date)
    logSpy.mockRestore()
  })
})
