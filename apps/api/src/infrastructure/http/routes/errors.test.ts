import { describe, expect, it, vi, beforeEach } from 'vitest'

const { report } = vi.hoisted(() => ({ report: vi.fn() }))

vi.mock('../../container', () => ({
  errorReporter: { report },
}))

// Import AFTER the mock so the route binds to the mocked reporter.
import { errorRoutes } from './errors'
import { Hono } from 'hono'
import type { AppEnv } from '../app-env'

type AppUser = AppEnv['Variables']['user']

function makeApp(opts: { requestId?: string; userId?: string } = {}) {
  const app = new Hono<AppEnv>()
  if (opts.requestId !== undefined || opts.userId !== undefined) {
    app.use('*', async (c, next) => {
      if (opts.requestId !== undefined) c.set('requestId', opts.requestId)
      if (opts.userId !== undefined) c.set('user', { id: opts.userId } as AppUser)
      await next()
    })
  }
  app.route('/', errorRoutes)
  return app
}

function postErrors(app: Hono<AppEnv>, body: unknown, init: RequestInit = {}) {
  return app.request('/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    ...init,
  })
}

describe('POST /errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    report.mockResolvedValue(undefined)
  })

  it('accepts a minimal valid report and returns { ok: true }', async () => {
    const app = makeApp()
    const res = await postErrors(app, { message: 'boom' })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(report).toHaveBeenCalledTimes(1)
  })

  it('forwards all optional fields to the reporter with web defaults', async () => {
    const app = makeApp()
    const res = await postErrors(app, {
      message: 'render failed',
      stack: 'Error: render failed\n  at Foo',
      route: '/scrolls/intro',
      context: { component: 'StepView', attempt: 2 },
    })

    expect(res.status).toBe(200)
    expect(report).toHaveBeenCalledTimes(1)
    expect(report).toHaveBeenCalledWith({
      message: 'render failed',
      stack: 'Error: render failed\n  at Foo',
      status: 0,
      source: 'web',
      route: '/scrolls/intro',
      method: 'GET',
      requestId: undefined,
      userId: undefined,
      context: { component: 'StepView', attempt: 2 },
    })
  })

  it('passes through requestId and userId from context when present', async () => {
    const app = makeApp({ requestId: 'req-123', userId: 'user-9' })
    const res = await postErrors(app, { message: 'auth page crashed' })

    expect(res.status).toBe(200)
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'req-123', userId: 'user-9' }),
    )
  })

  it('omits userId (undefined) when no user is on the context — anonymous report', async () => {
    const app = makeApp({ requestId: 'req-anon' })
    await postErrors(app, { message: 'landing crashed' })

    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'req-anon', userId: undefined }),
    )
  })

  it('returns 400 when message is missing', async () => {
    const app = makeApp()
    const res = await postErrors(app, { stack: 'no message here' })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid report' })
    expect(report).not.toHaveBeenCalled()
  })

  it('returns 400 when message is an empty string (min(1))', async () => {
    const app = makeApp()
    const res = await postErrors(app, { message: '' })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid report' })
    expect(report).not.toHaveBeenCalled()
  })

  it('returns 400 when message exceeds the 2000-char cap', async () => {
    const app = makeApp()
    const res = await postErrors(app, { message: 'x'.repeat(2001) })

    expect(res.status).toBe(400)
    expect(report).not.toHaveBeenCalled()
  })

  it('accepts a message exactly at the 2000-char boundary', async () => {
    const app = makeApp()
    const res = await postErrors(app, { message: 'x'.repeat(2000) })

    expect(res.status).toBe(200)
    expect(report).toHaveBeenCalledTimes(1)
  })

  it('returns 400 when stack exceeds the 20000-char cap', async () => {
    const app = makeApp()
    const res = await postErrors(app, {
      message: 'ok',
      stack: 'x'.repeat(20_001),
    })

    expect(res.status).toBe(400)
    expect(report).not.toHaveBeenCalled()
  })

  it('returns 400 when route exceeds the 500-char cap', async () => {
    const app = makeApp()
    const res = await postErrors(app, {
      message: 'ok',
      route: 'x'.repeat(501),
    })

    expect(res.status).toBe(400)
    expect(report).not.toHaveBeenCalled()
  })

  it('returns 400 when message has the wrong type', async () => {
    const app = makeApp()
    const res = await postErrors(app, { message: 42 })

    expect(res.status).toBe(400)
    expect(report).not.toHaveBeenCalled()
  })

  it('returns 400 when context is not an object', async () => {
    const app = makeApp()
    const res = await postErrors(app, { message: 'ok', context: 'nope' })

    expect(res.status).toBe(400)
    expect(report).not.toHaveBeenCalled()
  })

  it('returns 400 when the body is not valid JSON (parse → null → safeParse fails)', async () => {
    const app = makeApp()
    const res = await postErrors(app, '{ not json', {
      headers: { 'Content-Type': 'application/json' },
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid report' })
    expect(report).not.toHaveBeenCalled()
  })

  it('returns 400 when the body is missing entirely', async () => {
    const app = makeApp()
    const res = await app.request('/errors', { method: 'POST' })

    expect(res.status).toBe(400)
    expect(report).not.toHaveBeenCalled()
  })

  it('strips unknown top-level fields and still reports the known ones', async () => {
    const app = makeApp()
    const res = await postErrors(app, {
      message: 'ok',
      evil: 'drop me',
      status: 999,
      source: 'forged',
    })

    expect(res.status).toBe(200)
    const arg = report.mock.calls[0][0]
    expect(arg).not.toHaveProperty('evil')
    expect(arg.status).toBe(0)
    expect(arg.source).toBe('web')
  })
})
