import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as DrizzleOrm from 'drizzle-orm'
import type { AppEnv } from '../app-env'
import { StepNotFoundError } from '../../../application/learning/GenerateNudge'

// ── Hoisted boundary spies ──────────────────────────────────────────
// authState drives the mocked optionalAuth/requireAuth so 200/401/403 are all
// exercised. The use-case + repo + db spies stand in for everything below the
// route handler; nothing of the route's own branching is mocked.
const {
  authState,
  mockConfig,
  getScrollList,
  getAllScrollProgress,
  getScrollBySlug,
  executeStep,
  trackProgress,
  getScrollProgress,
  mergeAnonymousProgress,
  generateNudge,
  submitNudgeFeedback,
  scrollRepoFindById,
  stepsFindFirst,
  errorReport,
} = vi.hoisted(() => ({
  authState: { user: null as { id: string } | null },
  mockConfig: { FF_COURSE_NUDGE_ENABLED: true, CREATOR_GITHUB_ID: 'creator-gh' },
  getScrollList: vi.fn(),
  getAllScrollProgress: vi.fn(),
  getScrollBySlug: vi.fn(),
  executeStep: vi.fn(),
  trackProgress: vi.fn(),
  getScrollProgress: vi.fn(),
  mergeAnonymousProgress: vi.fn(),
  generateNudge: vi.fn(),
  submitNudgeFeedback: vi.fn(),
  scrollRepoFindById: vi.fn(),
  stepsFindFirst: vi.fn(),
  errorReport: vi.fn(),
}))

vi.mock('../../../config', () => ({ config: mockConfig }))

vi.mock('../../container', () => ({
  scrollRepo: { findById: scrollRepoFindById },
  errorReporter: { report: errorReport },
  useCases: {
    getScrollList: { execute: getScrollList },
    getAllScrollProgress: { execute: getAllScrollProgress },
    getScrollBySlug: { execute: getScrollBySlug },
    executeStep: { execute: executeStep },
    trackProgress: { execute: trackProgress },
    getScrollProgress: { execute: getScrollProgress },
    mergeAnonymousProgress: { execute: mergeAnonymousProgress },
    generateNudge: { execute: generateNudge },
    submitNudgeFeedback: { execute: submitNudgeFeedback },
  },
}))

vi.mock('../../persistence/drizzle/client', () => ({
  db: { query: { steps: { findFirst: stepsFindFirst } } },
}))

// Plain table ref — the route only feeds steps.id into eq().
vi.mock('../../persistence/drizzle/schema', () => ({
  steps: { id: 'steps.id' },
}))

// Pass-through limiters: deterministic, no shared in-memory window across tests.
vi.mock('../middleware/rateLimiter', () => ({
  executionLimiter: async (_c: unknown, next: () => Promise<void>) => next(),
  nudgeLimiter: async (_c: unknown, next: () => Promise<void>) => next(),
}))

// Mock the auth boundary so the handler's c.get('user') is driven by authState.
// optionalAuth never rejects; requireAuth 401s when there is no user — matching
// the real middleware's HTTPException(401) that the router's onError maps.
vi.mock('../middleware/auth', () => ({
  optionalAuth: async (
    c: { set: (k: string, v: unknown) => void },
    next: () => Promise<void>,
  ) => {
    if (authState.user) c.set('user', authState.user)
    await next()
  },
  requireAuth: async (
    c: { set: (k: string, v: unknown) => void },
    next: () => Promise<void>,
  ) => {
    if (!authState.user) {
      throw new HTTPException(401, { message: 'Authentication required' })
    }
    c.set('user', authState.user)
    await next()
  },
}))

// eq spy delegating to the real operator so we can assert WHERE is built from
// the route param, not from a constant.
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof DrizzleOrm>()
  return { ...actual, eq: vi.fn(actual.eq) }
})

import { eq } from 'drizzle-orm'
import { scrollRoutes } from './scrolls'

// The route runs under the production onError so DomainError + thrown errors
// surface as the real status codes (500 / domain mapping) the app ships.
function makeApp() {
  const app = new Hono<AppEnv>()
  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()
    if (err.name === 'DomainError') {
      const code = (err as { code?: string }).code
      const status = code === 'KATA_NOT_FOUND' ? 404 : 500
      return c.json({ error: err.message, code }, status)
    }
    void errorReport({ message: err.message, status: 500 })
    return c.json({ error: 'Internal server error' }, 500)
  })
  app.route('/', scrollRoutes)
  return app
}

const STEP_ID = '11111111-1111-1111-1111-111111111111'
const SCROLL_UUID = '22222222-2222-2222-2222-222222222222'
const ANON_ID = '33333333-3333-3333-3333-333333333333'

function scrollDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: 'scroll-1',
    slug: 'python',
    title: 'Python',
    description: 'Learn Python',
    language: 'python',
    accentColor: '#abcdef',
    status: 'published',
    isPublic: true,
    estimatedMinutes: 30,
    externalReferences: [],
    lessons: [
      {
        id: 'l-1',
        order: 1,
        title: 'Lesson 1',
        outcome: 'You can print',
        steps: [
          {
            id: STEP_ID,
            order: 1,
            type: 'CODE',
            title: 'Step 1',
            instruction: 'do it',
            starterCode: '',
            testCode: 't',
            hint: null,
            hints: null,
            data: null,
          },
        ],
      },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.user = null
  mockConfig.FF_COURSE_NUDGE_ENABLED = true
})

// ── GET /scrolls ────────────────────────────────────────────────────

describe('GET /scrolls', () => {
  it('returns the publicOnly catalog and never leaks drafts/private', async () => {
    getScrollList.mockResolvedValue([{ id: 's1' }])
    const res = await makeApp().request('/scrolls')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ scrolls: [{ id: 's1' }] })
    // The publicOnly flag is the whole point — assert the handler passes it.
    expect(getScrollList).toHaveBeenCalledWith({ publicOnly: true })
  })

  it('returns 500 via onError when the use case throws', async () => {
    getScrollList.mockRejectedValue(new Error('db down'))
    const res = await makeApp().request('/scrolls')
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
    expect(errorReport).toHaveBeenCalledTimes(1)
  })
})

// ── GET /scrolls/progress (batch) ───────────────────────────────────

describe('GET /scrolls/progress', () => {
  it('returns empty progress for an anonymous caller without a session id', async () => {
    const res = await makeApp().request('/scrolls/progress')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ progress: [] })
    expect(getAllScrollProgress).not.toHaveBeenCalled()
  })

  it('queries anonymous progress with the session-id owner', async () => {
    getAllScrollProgress.mockResolvedValue([{ scrollId: 's1', count: 2 }])
    const res = await makeApp().request(`/scrolls/progress?anonymousSessionId=${ANON_ID}`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ progress: [{ scrollId: 's1', count: 2 }] })
    expect(getAllScrollProgress).toHaveBeenCalledWith({ kind: 'anonymous', sessionId: ANON_ID })
  })

  it('queries user progress (ignoring any session id) when authed', async () => {
    authState.user = { id: 'user-9' }
    getAllScrollProgress.mockResolvedValue([])
    await makeApp().request(`/scrolls/progress?anonymousSessionId=${ANON_ID}`)
    expect(getAllScrollProgress).toHaveBeenCalledWith({ kind: 'user', userId: 'user-9' })
  })

  it('is not shadowed by the /scrolls/:slug route', async () => {
    // Registration order guard: /scrolls/progress must resolve to the batch
    // handler, not getScrollBySlug('progress').
    await makeApp().request('/scrolls/progress')
    expect(getScrollBySlug).not.toHaveBeenCalled()
  })
})

// ── GET /scrolls/:slug ──────────────────────────────────────────────

describe('GET /scrolls/:slug', () => {
  it('returns 422 for a slug that fails the schema regex', async () => {
    const res = await makeApp().request('/scrolls/Has_Caps')
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: 'Invalid slug' })
    expect(getScrollBySlug).not.toHaveBeenCalled()
  })

  it('returns 404 when the scroll does not exist', async () => {
    getScrollBySlug.mockResolvedValue(null)
    const res = await makeApp().request('/scrolls/python')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Scroll not found' })
    expect(getScrollBySlug).toHaveBeenCalledWith('python')
  })

  it('hides a private scroll from an anonymous caller (404, not 200)', async () => {
    getScrollBySlug.mockResolvedValue(scrollDetail({ isPublic: false }))
    const res = await makeApp().request('/scrolls/python')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Scroll not found' })
  })

  it('serves a private scroll to an authed caller with derived counts', async () => {
    authState.user = { id: 'user-1' }
    getScrollBySlug.mockResolvedValue(scrollDetail({ isPublic: false }))
    const res = await makeApp().request('/scrolls/python')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { scroll: Record<string, unknown> }
    expect(body.scroll.lessonCount).toBe(1)
    expect(body.scroll.stepCount).toBe(1)
    // solution / testCode-leak guard: the DTO surface here exposes testCode but
    // never solution.
    expect(body.scroll).not.toHaveProperty('solution')
  })

  it('returns a public scroll with mapped lesson/step shape', async () => {
    getScrollBySlug.mockResolvedValue(scrollDetail())
    const res = await makeApp().request('/scrolls/python')
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      scroll: {
        lessonCount: number
        stepCount: number
        lessons: Array<{ outcome: string; steps: Array<{ id: string }> }>
      }
    }
    expect(body.scroll.lessonCount).toBe(1)
    expect(body.scroll.stepCount).toBe(1)
    expect(body.scroll.lessons[0]?.outcome).toBe('You can print')
    expect(body.scroll.lessons[0]?.steps[0]?.id).toBe(STEP_ID)
  })
})

// ── POST /scrolls/execute ───────────────────────────────────────────

describe('POST /scrolls/execute', () => {
  function exec(body: unknown) {
    return makeApp().request('/scrolls/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('returns 422 when the body fails executeStepSchema', async () => {
    const res = await exec({ code: 'x', language: 'python' }) // missing testCode
    expect(res.status).toBe(422)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('Invalid request')
    expect(executeStep).not.toHaveBeenCalled()
  })

  it('blocks an anonymous caller from a non-whitelisted language (401)', async () => {
    const res = await exec({ code: 'x', testCode: 't', language: 'java' })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Language requires authentication' })
    expect(executeStep).not.toHaveBeenCalled()
  })

  it('allows an anonymous caller to run a whitelisted language', async () => {
    executeStep.mockResolvedValue({ passed: true })
    const res = await exec({ code: 'print(1)', testCode: 't', language: 'python' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ passed: true })
    expect(executeStep).toHaveBeenCalledWith({ code: 'print(1)', testCode: 't', language: 'python' })
  })

  it('lets an authed caller run any language (java passes the gate)', async () => {
    authState.user = { id: 'user-1' }
    executeStep.mockResolvedValue({ passed: false })
    const res = await exec({ code: 'x', testCode: 't', language: 'java' })
    expect(res.status).toBe(200)
    expect(executeStep).toHaveBeenCalledTimes(1)
  })
})

// ── POST /scrolls/progress (track) ──────────────────────────────────

describe('POST /scrolls/progress', () => {
  function track(body: unknown) {
    return makeApp().request('/scrolls/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('returns 422 when the body fails trackProgressSchema', async () => {
    const res = await track({ scrollId: 'not-a-uuid', stepId: STEP_ID })
    expect(res.status).toBe(422)
    expect((await res.json() as { error: string }).error).toBe('Invalid request')
    expect(trackProgress).not.toHaveBeenCalled()
  })

  it('tracks progress for an authed user without touching scrollRepo', async () => {
    authState.user = { id: 'user-1' }
    trackProgress.mockResolvedValue(undefined)
    const res = await track({ scrollId: SCROLL_UUID, stepId: STEP_ID })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(scrollRepoFindById).not.toHaveBeenCalled()
    expect(trackProgress).toHaveBeenCalledWith({
      owner: { kind: 'user', userId: 'user-1' },
      scrollId: SCROLL_UUID,
      stepId: STEP_ID,
    })
  })

  it('returns 404 for anonymous when the scroll is missing', async () => {
    scrollRepoFindById.mockResolvedValue(null)
    const res = await track({ scrollId: SCROLL_UUID, stepId: STEP_ID, anonymousSessionId: ANON_ID })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Scroll not found' })
    expect(scrollRepoFindById).toHaveBeenCalledWith(SCROLL_UUID)
    expect(trackProgress).not.toHaveBeenCalled()
  })

  it('returns 401 for anonymous when the scroll is private', async () => {
    scrollRepoFindById.mockResolvedValue({ id: 'scroll-1', isPublic: false })
    const res = await track({ scrollId: SCROLL_UUID, stepId: STEP_ID, anonymousSessionId: ANON_ID })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Authentication required' })
    expect(trackProgress).not.toHaveBeenCalled()
  })

  it('returns 401 for anonymous on a public scroll without a session id', async () => {
    scrollRepoFindById.mockResolvedValue({ id: 'scroll-1', isPublic: true })
    const res = await track({ scrollId: SCROLL_UUID, stepId: STEP_ID })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'anonymousSessionId required' })
    expect(trackProgress).not.toHaveBeenCalled()
  })

  it('tracks anonymous progress on a public scroll with a session id', async () => {
    scrollRepoFindById.mockResolvedValue({ id: 'scroll-1', isPublic: true })
    trackProgress.mockResolvedValue(undefined)
    const res = await track({ scrollId: SCROLL_UUID, stepId: STEP_ID, anonymousSessionId: ANON_ID })
    expect(res.status).toBe(200)
    expect(trackProgress).toHaveBeenCalledWith({
      owner: { kind: 'anonymous', sessionId: ANON_ID },
      scrollId: SCROLL_UUID,
      stepId: STEP_ID,
    })
  })
})

// ── GET /scrolls/progress/:scrollId ─────────────────────────────────

describe('GET /scrolls/progress/:scrollId', () => {
  it('returns completedSteps for an authed user', async () => {
    authState.user = { id: 'user-1' }
    getScrollProgress.mockResolvedValue(['a', 'b'])
    const res = await makeApp().request(`/scrolls/progress/${SCROLL_UUID}`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ completedSteps: ['a', 'b'] })
    expect(getScrollProgress).toHaveBeenCalledWith({ kind: 'user', userId: 'user-1' }, SCROLL_UUID)
  })

  it('returns 401 for anonymous on a private scroll', async () => {
    scrollRepoFindById.mockResolvedValue({ id: 'scroll-1', isPublic: false })
    const res = await makeApp().request(`/scrolls/progress/${SCROLL_UUID}`)
    expect(res.status).toBe(401)
    expect(getScrollProgress).not.toHaveBeenCalled()
  })

  it('returns completedSteps for an anonymous caller on a public scroll', async () => {
    scrollRepoFindById.mockResolvedValue({ id: 'scroll-1', isPublic: true })
    getScrollProgress.mockResolvedValue(['x'])
    const res = await makeApp().request(
      `/scrolls/progress/${SCROLL_UUID}?anonymousSessionId=${ANON_ID}`,
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ completedSteps: ['x'] })
    expect(getScrollProgress).toHaveBeenCalledWith(
      { kind: 'anonymous', sessionId: ANON_ID },
      SCROLL_UUID,
    )
  })
})

// ── POST /scrolls/progress/merge ────────────────────────────────────

describe('POST /scrolls/progress/merge', () => {
  function merge(body: unknown, authed = true) {
    if (authed) authState.user = { id: 'user-1' }
    return makeApp().request('/scrolls/progress/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('returns 401 when unauthenticated (requireAuth gate)', async () => {
    const res = await merge({ anonymousSessionId: ANON_ID }, false)
    expect(res.status).toBe(401)
    expect(mergeAnonymousProgress).not.toHaveBeenCalled()
  })

  it('returns 422 when the body fails the schema', async () => {
    const res = await merge({ anonymousSessionId: 'nope' })
    expect(res.status).toBe(422)
    expect(mergeAnonymousProgress).not.toHaveBeenCalled()
  })

  it('merges with the authed user id and the body session id', async () => {
    mergeAnonymousProgress.mockResolvedValue(undefined)
    const res = await merge({ anonymousSessionId: ANON_ID })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(mergeAnonymousProgress).toHaveBeenCalledWith({
      userId: 'user-1',
      anonymousSessionId: ANON_ID,
    })
  })
})

// ── GET /scrolls/:slug/steps/:stepId/solution ───────────────────────

describe('GET /scrolls/:slug/steps/:stepId/solution', () => {
  function solution(slug: string, stepId: string, query = '') {
    return makeApp().request(`/scrolls/${slug}/steps/${stepId}/solution${query}`)
  }

  it('returns 422 for an invalid slug', async () => {
    const res = await solution('Bad_Slug', STEP_ID)
    expect(res.status).toBe(422)
    expect(getScrollBySlug).not.toHaveBeenCalled()
  })

  it('returns 404 when the scroll is missing', async () => {
    getScrollBySlug.mockResolvedValue(null)
    const res = await solution('python', STEP_ID)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Scroll not found' })
  })

  it('returns 404 hiding a private scroll from anonymous', async () => {
    getScrollBySlug.mockResolvedValue(scrollDetail({ isPublic: false }))
    const res = await solution('python', STEP_ID)
    expect(res.status).toBe(404)
  })

  it('returns 404 when the step is not part of the scroll', async () => {
    authState.user = { id: 'user-1' }
    getScrollBySlug.mockResolvedValue(scrollDetail())
    const res = await solution('python', '99999999-9999-9999-9999-999999999999')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Step not found' })
    expect(getScrollProgress).not.toHaveBeenCalled()
  })

  it('returns 403 when the caller has not passed the step', async () => {
    authState.user = { id: 'user-1' }
    getScrollBySlug.mockResolvedValue(scrollDetail())
    getScrollProgress.mockResolvedValue([]) // step not completed
    const res = await solution('python', STEP_ID)
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Solution available after passing this step' })
    expect(stepsFindFirst).not.toHaveBeenCalled()
  })

  it('returns the solution once the step is completed and reads steps by id', async () => {
    authState.user = { id: 'user-1' }
    getScrollBySlug.mockResolvedValue(scrollDetail())
    getScrollProgress.mockResolvedValue([STEP_ID])
    stepsFindFirst.mockResolvedValue({
      solution: 'print(42)',
      alternativeApproach: 'use a loop',
    })
    const res = await solution('python', STEP_ID)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      solution: 'print(42)',
      alternativeApproach: 'use a loop',
    })
    // WHERE must be built from the stepId param, not a constant.
    expect(eq).toHaveBeenCalledWith('steps.id', STEP_ID)
  })

  it('nulls out solution fields when the steps row is missing', async () => {
    authState.user = { id: 'user-1' }
    getScrollBySlug.mockResolvedValue(scrollDetail())
    getScrollProgress.mockResolvedValue([STEP_ID])
    stepsFindFirst.mockResolvedValue(undefined)
    const res = await solution('python', STEP_ID)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ solution: null, alternativeApproach: null })
  })
})

// ── POST /scrolls/nudge ─────────────────────────────────────────────

describe('POST /scrolls/nudge', () => {
  function nudge(body: unknown) {
    return makeApp().request('/scrolls/nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  const validBody = { scrollSlug: 'python', stepId: STEP_ID, userCode: 'print(1)' }

  it('returns 404 when the feature flag is off', async () => {
    mockConfig.FF_COURSE_NUDGE_ENABLED = false
    const res = await nudge(validBody)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Nudges are not enabled.' })
    expect(generateNudge).not.toHaveBeenCalled()
  })

  it('returns 422 when the body fails the inline schema', async () => {
    const res = await nudge({ scrollSlug: 'python', stepId: 'not-uuid', userCode: 'x' })
    expect(res.status).toBe(422)
    expect(generateNudge).not.toHaveBeenCalled()
  })

  it('returns 422 when the JSON body is unparseable', async () => {
    const res = await makeApp().request('/scrolls/nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    expect(res.status).toBe(422)
  })

  it('generates a nudge and passes a null userId for anonymous callers', async () => {
    generateNudge.mockResolvedValue({ id: 'n1', nudge: 'try x', stepId: STEP_ID })
    const res = await nudge(validBody)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id: 'n1', nudge: 'try x', stepId: STEP_ID })
    expect(generateNudge).toHaveBeenCalledWith({
      scrollSlug: 'python',
      stepId: STEP_ID,
      userCode: 'print(1)',
      userId: null,
    })
  })

  it('threads the authed user id into the use case', async () => {
    authState.user = { id: 'user-7' }
    generateNudge.mockResolvedValue({ id: 'n1', nudge: 'x', stepId: STEP_ID })
    await nudge(validBody)
    expect(generateNudge).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-7' }))
  })

  it('maps StepNotFoundError to 404 with its message', async () => {
    generateNudge.mockRejectedValue(new StepNotFoundError('Step not found'))
    const res = await nudge(validBody)
    expect(res.status).toBe(404)
    expect((await res.json() as { error: string }).error).toBe('Step not found')
  })

  it('lets an unexpected error bubble to onError as 500', async () => {
    generateNudge.mockRejectedValue(new Error('llm exploded'))
    const res = await nudge(validBody)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
  })
})

// ── POST /scrolls/nudge/:id/feedback ────────────────────────────────

describe('POST /scrolls/nudge/:id/feedback', () => {
  function feedback(id: string, body: unknown) {
    return makeApp().request(`/scrolls/nudge/${id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('returns 422 when the id is not a uuid', async () => {
    const res = await feedback('not-a-uuid', { feedback: 'up' })
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: 'Invalid nudge id' })
    expect(submitNudgeFeedback).not.toHaveBeenCalled()
  })

  it('returns 422 when the feedback value is invalid', async () => {
    const res = await feedback(STEP_ID, { feedback: 'meh' })
    expect(res.status).toBe(422)
    expect((await res.json() as { error: string }).error).toBe('Invalid request')
    expect(submitNudgeFeedback).not.toHaveBeenCalled()
  })

  it('submits valid feedback with the id and value', async () => {
    submitNudgeFeedback.mockResolvedValue(undefined)
    const res = await feedback(STEP_ID, { feedback: 'down' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(submitNudgeFeedback).toHaveBeenCalledWith({ id: STEP_ID, feedback: 'down' })
  })
})
