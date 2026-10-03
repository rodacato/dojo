import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Context, Next } from 'hono'
import { ExecuteScrollCode } from '../../../application/scrolls/ExecuteScrollCode'
import type { ExecutionResult } from '../../../domain/practice/ports'
import { InMemoryScrollRepository, testManifest, testScrollEntry } from '../../../test/scrolls'
import { domainErrorToStatus } from '../domain-error-status'
import type { AppEnv } from '../app-env'

const { mockConfig, authState, holder } = vi.hoisted(() => ({
  mockConfig: { FF_CODE_EXECUTION_ENABLED: true, SCROLL_EXEC_USER_PER_MINUTE: 3 },
  authState: { userId: null as string | null },
  holder: {
    repo: undefined as unknown as InMemoryScrollRepository,
    run: undefined as unknown as (params: unknown) => Promise<ExecutionResult>,
  },
}))

vi.mock('../../../config', () => ({ config: mockConfig }))

vi.mock('../middleware/auth', () => ({
  requireAuth: async (c: Context, next: Next) => {
    if (!authState.userId) throw new HTTPException(401, { message: 'Authentication required' })
    c.set('user', { id: authState.userId })
    await next()
  },
}))

vi.mock('../../container', () => ({
  useCases: {
    get executeScrollCode() {
      return new ExecuteScrollCode({ scrollRepo: holder.repo, runner: { run: (p) => holder.run(p) } })
    },
  },
}))

import { scrollExecuteRoutes } from './scroll-execute'

const app = new Hono<AppEnv>()
app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse()
  if (err.name === 'DomainError') {
    const code = (err as { code?: string }).code
    return c.json({ error: err.message, code }, domainErrorToStatus(code))
  }
  return c.json({ error: 'Internal server error' }, 500)
})
app.route('/', scrollExecuteRoutes)

const done: ExecutionResult = {
  stdout: 'hi\n',
  stderr: '',
  exitCode: 0,
  timedOut: false,
  outputExceeded: false,
  runTimeoutMs: 8000,
  executionTimeMs: 20,
}

const validBody = { language: 'ruby', files: [{ name: 'main.rb', content: 'puts "hi"' }] }

let userCount = 0
const signIn = () => {
  authState.userId = `user-${++userCount}`
}

function post(body: unknown, slug = 'circuit') {
  return app.request(`/scrolls/${slug}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

beforeEach(async () => {
  mockConfig.FF_CODE_EXECUTION_ENABLED = true
  authState.userId = null
  holder.run = vi.fn(async () => done)
  holder.repo = new InMemoryScrollRepository()
  await holder.repo.insert(
    testScrollEntry({
      slug: 'circuit',
      status: 'published',
      manifest: { ...testManifest, capabilities: ['run'] },
    }),
  )
})

describe('POST /scrolls/:slug/execute', () => {
  it('runs the code for a signed-in user and returns the raw outcome', async () => {
    signIn()
    const res = await post(validBody)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ kind: 'ok', exitCode: 0, stdout: 'hi\n', stderr: '', durationMs: 20 })
  })

  it('rejects an anonymous visitor with 401 and runs nothing', async () => {
    const res = await post(validBody)
    expect(res.status).toBe(401)
    expect(holder.run).not.toHaveBeenCalled()
  })

  it('answers 404 when the instance has execution disabled', async () => {
    signIn()
    mockConfig.FF_CODE_EXECUTION_ENABLED = false
    expect((await post(validBody)).status).toBe(404)
    expect(holder.run).not.toHaveBeenCalled()
  })

  it('answers 422 for a language outside the manifest', async () => {
    signIn()
    const res = await post({ ...validBody, language: 'python' })
    expect(res.status).toBe(422)
    expect(holder.run).not.toHaveBeenCalled()
  })

  it('answers 403 when the scroll does not declare run', async () => {
    signIn()
    await holder.repo.insert(testScrollEntry({ slug: 'no-run', status: 'published' }))
    expect((await post(validBody, 'no-run')).status).toBe(403)
  })

  it('answers 404 for an unknown scroll and a malformed slug', async () => {
    signIn()
    expect((await post(validBody, 'nope')).status).toBe(404)
    expect((await post(validBody, 'Bad_Slug')).status).toBe(404)
  })

  it('answers 422 for a malformed body', async () => {
    signIn()
    expect((await post('not json')).status).toBe(422)
    expect((await post({ language: 'ruby' })).status).toBe(422)
    expect((await post({ ...validBody, files: [{ name: '../x', content: '' }] })).status).toBe(422)
    expect(holder.run).not.toHaveBeenCalled()
  })

  it('answers 413 past the file count and total size limits', async () => {
    signIn()
    const many = Array.from({ length: 9 }, (_, i) => ({ name: `f${i}.rb`, content: '1' }))
    expect((await post({ ...validBody, files: many })).status).toBe(413)
    const big = [{ name: 'main.rb', content: 'x'.repeat(65_537) }]
    expect((await post({ ...validBody, files: big })).status).toBe(413)
    const huge = [{ name: 'main.rb', content: 'x'.repeat(300_000) }]
    expect((await post({ ...validBody, files: huge })).status).toBe(413)
    expect(holder.run).not.toHaveBeenCalled()
  })

  it('answers 429 past the per-user rate limit, and only for that user', async () => {
    signIn()
    for (let i = 0; i < 3; i++) expect((await post(validBody)).status).toBe(200)
    expect((await post(validBody)).status).toBe(429)

    signIn()
    expect((await post(validBody)).status).toBe(200)
  })

  it('answers kind unavailable, not an error, when the sandbox is down', async () => {
    signIn()
    holder.run = vi.fn(async () => {
      throw new Error('ECONNREFUSED')
    })
    const res = await post(validBody)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ kind: 'unavailable', exitCode: null })
  })
})

describe('GET /scrolls/execution/status', () => {
  it('reports whether the instance executes code, without auth', async () => {
    expect(await (await app.request('/scrolls/execution/status')).json()).toEqual({ enabled: true })
    mockConfig.FF_CODE_EXECUTION_ENABLED = false
    expect(await (await app.request('/scrolls/execution/status')).json()).toEqual({ enabled: false })
  })
})
