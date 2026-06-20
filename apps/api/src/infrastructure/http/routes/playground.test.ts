import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as DrizzleOrm from 'drizzle-orm'
import type { AppEnv } from '../app-env'

// ---------------------------------------------------------------------------
// Hoisted bindings — the mock factories below close over these so the route
// grabs the mocked deps. authState drives the optionalAuth/requireAuth gate;
// the rest stand in for the container use cases, drizzle client, config and
// metrics emitter.
// ---------------------------------------------------------------------------
const {
  mockConfig,
  authState,
  enqueueRun,
  askSensei,
  dbInsert,
  insertValues,
  selectWhere,
  dbSelect,
  trackEvent,
} = vi.hoisted(() => {
  const insertValues = vi.fn()
  const dbInsert = vi.fn(() => ({ values: insertValues }))

  const selectWhere = vi.fn()
  const selectFrom = vi.fn(() => ({ where: selectWhere }))
  const dbSelect = vi.fn(() => ({ from: selectFrom }))

  return {
    mockConfig: {
      FF_PLAYGROUND_CONSOLE_ENABLED: true,
      FF_PLAYGROUND_ASK_SENSEI_ENABLED: true,
      PLAYGROUND_ASK_SENSEI_DAILY_QUOTA: 30,
      LLM_MODEL: 'claude-test-model',
      SESSION_SECRET: 'x'.repeat(32),
      NODE_ENV: 'test' as 'test' | 'production' | 'development',
    },
    authState: { mode: 'anon' as 'anon' | 'authed' },
    enqueueRun: vi.fn(),
    askSensei: vi.fn(),
    dbInsert,
    insertValues,
    selectWhere,
    dbSelect,
    trackEvent: vi.fn(),
  }
})

vi.mock('../../../config', () => ({ config: mockConfig }))

vi.mock('../../container', () => ({
  llm: { askSensei },
  executionQueue: { enqueueRun },
}))

vi.mock('../../observability/metrics', () => ({ trackEvent }))

vi.mock('../../persistence/drizzle/client', () => ({
  db: { insert: dbInsert, select: dbSelect },
}))

// Table refs are only used as eq()/and()/gte() operands; plain objects suffice.
vi.mock('../../persistence/drizzle/schema', () => ({
  playgroundRuns: { ipHash: 'pr.ipHash', sessionHash: 'pr.sessionHash' },
  llmRequestsLog: { userId: 'lrl.userId', askedAt: 'lrl.askedAt' },
}))

// drizzle-orm: real operators, but eq/and/gte spied so we can assert the
// WHERE condition is built from the route's params (not coverage theater).
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof DrizzleOrm>()
  return { ...actual, eq: vi.fn(actual.eq), and: vi.fn(actual.and), gte: vi.fn(actual.gte) }
})

// Auth boundary. optionalAuth sets c.get('user') only when authed; requireAuth
// throws the same 401 HTTPException the real middleware does so onError maps it.
vi.mock('../middleware/auth', () => ({
  optionalAuth: async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
    if (authState.mode === 'authed') {
      c.set('user', { id: 'user-1' } as AppEnv['Variables']['user'])
    }
    await next()
  },
  requireAuth: async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
    if (authState.mode !== 'authed') {
      throw new HTTPException(401, { message: 'Authentication required' })
    }
    c.set('user', { id: 'user-1' } as AppEnv['Variables']['user'])
    await next()
  },
}))

// The abuse-stack middlewares are mounted via .use() on /engawa/run. They read
// real config at module load and call external limiters / network — pass them
// through so the run handler's own logic is what we test, in isolation.
vi.mock('../middleware/playground-rate-limiters', () => ({
  playgroundAnonIpMinuteLimiter: passthrough,
  playgroundAnonIpDayLimiter: passthrough,
  playgroundSessionMinuteLimiter: passthrough,
  playgroundSessionDayLimiter: passthrough,
  playgroundAuthedUserMinuteLimiter: passthrough,
  playgroundAuthedUserDayLimiter: passthrough,
}))

vi.mock('../middleware/playground-turnstile', () => ({ playgroundTurnstileMiddleware: passthrough }))

vi.mock('../middleware/playground-quota', () => ({ playgroundGlobalQuotaMiddleware: passthrough }))

async function passthrough(_c: unknown, next: () => Promise<void>): Promise<void> {
  await next()
}

import { eq, and, gte } from 'drizzle-orm'
import { playgroundRoutes } from './playground'

const eqSpy = vi.mocked(eq)
const andSpy = vi.mocked(and)
const gteSpy = vi.mocked(gte)

function makeApp() {
  const app = new Hono<AppEnv>()
  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()
    return c.json({ error: 'Internal server error' }, 500)
  })
  app.route('/', playgroundRoutes)
  return app
}

function runResult(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    stdout: 'hello\n',
    stderr: '',
    exitCode: 0,
    timedOut: false,
    outputExceeded: false,
    runTimeoutMs: 5000,
    executionTimeMs: 42,
    ...overrides,
  }
}

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return makeApp().request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const VALID_RUN = { language: 'python', version: '3.11', code: 'print("hi")' }

beforeEach(() => {
  vi.clearAllMocks()
  authState.mode = 'anon'
  mockConfig.FF_PLAYGROUND_CONSOLE_ENABLED = true
  mockConfig.FF_PLAYGROUND_ASK_SENSEI_ENABLED = true
  mockConfig.PLAYGROUND_ASK_SENSEI_DAILY_QUOTA = 30
  mockConfig.NODE_ENV = 'test'
  enqueueRun.mockResolvedValue(runResult())
  insertValues.mockReturnValue(Promise.resolve(undefined))
  // db.select(...).from(...).where(...) resolves to the usage-count rows.
  selectWhere.mockResolvedValue([{ used: 0 }])
})

// ===========================================================================
// POST /engawa/run
// ===========================================================================
describe('POST /engawa/run', () => {
  it('returns the execution result shape on a valid python run', async () => {
    const res = await post('/engawa/run', VALID_RUN)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      stdout: 'hello\n',
      stderr: '',
      exitCode: 0,
      runtimeMs: 42,
      timedOut: false,
    })
  })

  it('enqueues the run with exactly the parsed language/version/code', async () => {
    await post('/engawa/run', VALID_RUN)
    expect(enqueueRun).toHaveBeenCalledTimes(1)
    expect(enqueueRun).toHaveBeenCalledWith({
      language: 'python',
      version: '3.11',
      code: 'print("hi")',
    })
  })

  it('stamps a fresh session cookie (HttpOnly, Lax in dev) on first request', async () => {
    const res = await post('/engawa/run', VALID_RUN)
    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).toContain('dojo_playground_session=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).not.toContain('Secure')
  })

  it('issues a SameSite=None; Secure cookie in production', async () => {
    mockConfig.NODE_ENV = 'production'
    const res = await post('/engawa/run', VALID_RUN)
    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).toContain('SameSite=None')
    expect(cookie).toContain('Secure')
  })

  it('reuses an existing session cookie instead of issuing a new one', async () => {
    const res = await post('/engawa/run', VALID_RUN, {
      cookie: 'dojo_playground_session=preexisting-id',
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('logs the run with peppered ip/session hashes and the execution result', async () => {
    await post('/engawa/run', VALID_RUN, { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })
    expect(insertValues).toHaveBeenCalledTimes(1)
    const logged = insertValues.mock.calls[0]?.[0] as Record<string, unknown>
    expect(logged.language).toBe('python')
    expect(logged.version).toBe('3.11')
    expect(logged.exitCode).toBe(0)
    expect(logged.runtimeMs).toBe(42)
    // Hashes are sha256 hex (64 chars), not the raw values.
    expect(logged.ipHash).toMatch(/^[a-f0-9]{64}$/)
    expect(logged.sessionHash).toMatch(/^[a-f0-9]{64}$/)
    expect(logged.ipHash).not.toBe('203.0.113.7')
  })

  it('derives the ip hash from x-forwarded-for first hop, not x-real-ip', async () => {
    await post('/engawa/run', VALID_RUN, { 'x-forwarded-for': '1.1.1.1', 'x-real-ip': '2.2.2.2' })
    const first = insertValues.mock.calls[0]?.[0] as Record<string, unknown>
    await post('/engawa/run', VALID_RUN, { 'x-real-ip': '1.1.1.1' })
    const second = insertValues.mock.calls[0]?.[0] as Record<string, unknown>
    // Same underlying ip (1.1.1.1) via different headers => identical hash.
    expect(first.ipHash).toBe(second.ipHash)
  })

  it('emits a playground_run metric with authed=false for anonymous traffic', async () => {
    await post('/engawa/run', VALID_RUN)
    expect(trackEvent).toHaveBeenCalledWith('playground_run', expect.objectContaining({
      language: 'python',
      version: '3.11',
      exitCode: 0,
      runtimeMs: 42,
      timedOut: false,
      authed: false,
    }))
  })

  it('emits authed=true in the metric when the request is authenticated', async () => {
    authState.mode = 'authed'
    await post('/engawa/run', VALID_RUN)
    expect(trackEvent).toHaveBeenCalledWith('playground_run', expect.objectContaining({ authed: true }))
  })

  it('returns 404 when the console feature flag is disabled', async () => {
    mockConfig.FF_PLAYGROUND_CONSOLE_ENABLED = false
    const res = await post('/engawa/run', VALID_RUN)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(enqueueRun).not.toHaveBeenCalled()
  })

  it('returns 400 invalid_request when a required field is missing', async () => {
    const res = await post('/engawa/run', { language: 'python', code: 'x' })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string; details: unknown }
    expect(body.error).toBe('invalid_request')
    expect(body.details).toBeDefined()
    expect(enqueueRun).not.toHaveBeenCalled()
  })

  it('returns 400 code_too_large when code exceeds the 16KB cap', async () => {
    const res = await post('/engawa/run', { ...VALID_RUN, code: 'a'.repeat(16_385) })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('code_too_large')
    expect(enqueueRun).not.toHaveBeenCalled()
  })

  it('returns 400 invalid_request for empty code (distinct from too-large)', async () => {
    const res = await post('/engawa/run', { ...VALID_RUN, code: '' })
    expect(res.status).toBe(400)
    expect(((await res.json()) as { error: string }).error).toBe('invalid_request')
  })

  it('returns 400 invalid_language for a whitelisted-miss language', async () => {
    const res = await post('/engawa/run', { ...VALID_RUN, language: 'javascript' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid_language' })
    expect(enqueueRun).not.toHaveBeenCalled()
  })

  it('accepts whitelisted languages case-insensitively', async () => {
    const res = await post('/engawa/run', { ...VALID_RUN, language: 'PYTHON' })
    expect(res.status).toBe(200)
    expect(enqueueRun).toHaveBeenCalledWith(expect.objectContaining({ language: 'PYTHON' }))
  })

  it('returns 400 invalid_request when the JSON body is unparseable', async () => {
    const res = await post('/engawa/run', 'not-json{')
    expect(res.status).toBe(400)
    expect(((await res.json()) as { error: string }).error).toBe('invalid_request')
  })

  it('surfaces timedOut/exitCode from the executor in the response', async () => {
    enqueueRun.mockResolvedValue(runResult({ exitCode: 137, timedOut: true, stderr: 'killed' }))
    const res = await post('/engawa/run', VALID_RUN)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      stdout: 'hello\n',
      stderr: 'killed',
      exitCode: 137,
      runtimeMs: 42,
      timedOut: true,
    })
  })

  it('still returns 200 when the fire-and-forget log insert rejects', async () => {
    insertValues.mockReturnValue(Promise.reject(new Error('db down')))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const res = await post('/engawa/run', VALID_RUN)
    expect(res.status).toBe(200)
    errSpy.mockRestore()
  })

  it('returns 500 via onError when the executor throws', async () => {
    enqueueRun.mockRejectedValue(new Error('piston exploded'))
    const res = await post('/engawa/run', VALID_RUN)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
  })
})

// ===========================================================================
// POST /engawa/ask
// ===========================================================================
async function* tokens(...parts: string[]): AsyncIterable<string> {
  for (const p of parts) yield p
}

function askReturn(parts: string[], usage = { inputTokens: 10, outputTokens: 20 }) {
  return { stream: tokens(...parts), usage: Promise.resolve(usage) }
}

const VALID_ASK = { question: 'why does this fail?', code: 'print(1/0)', language: 'python' }

describe('POST /engawa/ask', () => {
  beforeEach(() => {
    authState.mode = 'authed'
    askSensei.mockReturnValue(askReturn(['Because ', 'zero.']))
  })

  it('returns 401 for an anonymous request (no LLM access)', async () => {
    authState.mode = 'anon'
    const res = await post('/engawa/ask', VALID_ASK)
    expect(res.status).toBe(401)
    expect(askSensei).not.toHaveBeenCalled()
  })

  it('returns 404 when the ask-sensei feature flag is disabled', async () => {
    mockConfig.FF_PLAYGROUND_ASK_SENSEI_ENABLED = false
    const res = await post('/engawa/ask', VALID_ASK)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(askSensei).not.toHaveBeenCalled()
  })

  it('returns 400 invalid_request when the body fails schema validation', async () => {
    const res = await post('/engawa/ask', { question: '' })
    expect(res.status).toBe(400)
    expect(((await res.json()) as { error: string }).error).toBe('invalid_request')
    expect(askSensei).not.toHaveBeenCalled()
  })

  it('builds the daily-usage WHERE from the user id and the UTC day start', async () => {
    await post('/engawa/ask', VALID_ASK)
    // The route ANDs eq(userId, user.id) with gte(askedAt, dayStart).
    expect(eqSpy).toHaveBeenCalledWith('lrl.userId', 'user-1')
    expect(andSpy).toHaveBeenCalled()
    const gteArgs = gteSpy.mock.calls[0]
    expect(gteArgs?.[0]).toBe('lrl.askedAt')
    const dayStart = gteArgs?.[1] as Date
    expect(dayStart.getUTCHours()).toBe(0)
    expect(dayStart.getUTCMinutes()).toBe(0)
    expect(dayStart.getUTCSeconds()).toBe(0)
  })

  it('returns 429 quota_exhausted when the daily count has reached the ceiling', async () => {
    mockConfig.PLAYGROUND_ASK_SENSEI_DAILY_QUOTA = 5
    selectWhere.mockResolvedValue([{ used: 5 }])
    const res = await post('/engawa/ask', VALID_ASK)
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ error: 'quota_exhausted', used: 5, limit: 5 })
    expect(askSensei).not.toHaveBeenCalled()
  })

  it('allows the request when usage is one below the ceiling', async () => {
    mockConfig.PLAYGROUND_ASK_SENSEI_DAILY_QUOTA = 5
    selectWhere.mockResolvedValue([{ used: 4 }])
    const res = await post('/engawa/ask', VALID_ASK)
    expect(res.status).toBe(200)
    expect(askSensei).toHaveBeenCalledTimes(1)
  })

  it('treats an empty usage row as zero used', async () => {
    selectWhere.mockResolvedValue([])
    const res = await post('/engawa/ask', VALID_ASK)
    expect(res.status).toBe(200)
    expect(askSensei).toHaveBeenCalledTimes(1)
  })

  it('forwards question/code/language to askSensei', async () => {
    await post('/engawa/ask', VALID_ASK)
    expect(askSensei).toHaveBeenCalledWith({
      question: 'why does this fail?',
      code: 'print(1/0)',
      language: 'python',
    })
  })

  it('omits optional code/language when not provided', async () => {
    await post('/engawa/ask', { question: 'plain question' })
    expect(askSensei).toHaveBeenCalledWith({ question: 'plain question' })
  })

  it('streams token events then a done event over SSE', async () => {
    askSensei.mockReturnValue(askReturn(['Be', 'cause']))
    const res = await post('/engawa/ask', VALID_ASK)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    const text = await res.text()
    expect(text).toContain('event: token')
    expect(text).toContain('data: Be')
    expect(text).toContain('data: cause')
    expect(text).toContain('event: done')
  })

  it('logs cost into llm_requests_log with the model and token usage', async () => {
    askSensei.mockReturnValue(askReturn(['ok'], { inputTokens: 11, outputTokens: 22 }))
    await (await post('/engawa/ask', VALID_ASK)).text()
    expect(insertValues).toHaveBeenCalledWith({
      userId: 'user-1',
      model: 'claude-test-model',
      inputTokens: 11,
      outputTokens: 22,
    })
  })

  it('emits an error event when the stream throws mid-flight', async () => {
    async function* boom(): AsyncIterable<string> {
      yield 'partial'
      throw new Error('upstream gone')
    }
    askSensei.mockReturnValue({ stream: boom(), usage: Promise.resolve({ inputTokens: null, outputTokens: null }) })
    const res = await post('/engawa/ask', VALID_ASK)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('event: error')
    expect(text).toContain('upstream gone')
    // Cost insert must not fire when the stream failed before completion.
    expect(insertValues).not.toHaveBeenCalled()
  })

  it('still completes the stream when the cost-log insert rejects', async () => {
    askSensei.mockReturnValue(askReturn(['answer']))
    insertValues.mockReturnValue(Promise.reject(new Error('log insert failed')))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const res = await post('/engawa/ask', VALID_ASK)
    const text = await res.text()
    expect(text).toContain('event: done')
    expect(text).not.toContain('event: error')
    errSpy.mockRestore()
  })
})
