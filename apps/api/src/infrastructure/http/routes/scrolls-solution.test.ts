import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { scrollRoutes as LearnRoutes } from './scrolls'

let scrollRoutes: typeof LearnRoutes

// Hoisted state used by mocks; tests reach into it to control auth + completion.
const state = {
  userId: null as string | null,
  completedSteps: [] as string[],
  scroll: {
    id: 'scroll-1',
    slug: 'sql-deep-cuts',
    isPublic: true,
    lessons: [
      {
        id: 'lesson-1',
        steps: [
          { id: 'step-included', type: 'kata' as const },
          { id: 'step-other', type: 'kata' as const },
        ],
      },
    ],
  } as { id: string; slug: string; isPublic: boolean; lessons: Array<{ id: string; steps: Array<{ id: string; type: 'read' | 'code' | 'kata' | 'challenge' }> }> },
}

vi.mock('../../container', () => ({
  scrollRepo: { findById: vi.fn(async () => state.scroll) },
  useCases: {
    getScrollBySlug: { execute: vi.fn(async () => state.scroll) },
    getScrollProgress: { execute: vi.fn(async () => state.completedSteps) },
    trackProgress: { execute: vi.fn() },
    mergeAnonymousProgress: { execute: vi.fn() },
    executeStep: { execute: vi.fn() },
    getScrollList: { execute: vi.fn() },
  },
}))

vi.mock('../middleware/auth', () => ({
  optionalAuth: async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
    if (state.userId) c.set('user', { id: state.userId })
    await next()
  },
  requireAuth: async () => { /* unused in this suite */ },
}))

vi.mock('../middleware/rateLimiter', () => ({
  executionLimiter: async (_c: unknown, next: () => Promise<void>) => { await next() },
  nudgeLimiter: async (_c: unknown, next: () => Promise<void>) => { await next() },
}))

// Drizzle access in the route reads the steps table directly. We stub it
// to return a predictable solution so the test stays in-process.
vi.mock('../../persistence/drizzle/client', () => ({
  db: {
    query: {
      steps: {
        findFirst: vi.fn(async () => ({ solution: 'SELECT 1 AS dept_rank', alternativeApproach: 'Use a CTE instead' })),
      },
    },
  },
}))
vi.mock('../../persistence/drizzle/schema', () => ({ steps: {} }))

describe('GET /learn/scrolls/:slug/steps/:stepId/solution', () => {
  beforeAll(async () => {
    scrollRoutes = (await import('./scrolls')).scrollRoutes
  })

  function get(stepId: string, query = '') {
    return scrollRoutes.request(`/learn/scrolls/sql-deep-cuts/steps/${stepId}/solution${query}`)
  }

  it('returns 404 when the step does not belong to the scroll', async () => {
    state.userId = 'user-1'
    state.completedSteps = ['step-included']
    const res = await get('step-not-in-scroll')
    expect(res.status).toBe(404)
  })

  it('returns 403 when the caller has not completed the step yet', async () => {
    state.userId = 'user-1'
    state.completedSteps = []
    const res = await get('step-included')
    expect(res.status).toBe(403)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/after passing/i)
  })

  it('returns 200 + solution + alternativeApproach once the step is completed', async () => {
    state.userId = 'user-1'
    state.completedSteps = ['step-included']
    const res = await get('step-included')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { solution: string | null; alternativeApproach: string | null }
    expect(body.solution).toBe('SELECT 1 AS dept_rank')
    expect(body.alternativeApproach).toBe('Use a CTE instead')
  })

  it('serves an anonymous learner on a public scroll who passed the step', async () => {
    state.userId = null
    state.completedSteps = ['step-included']
    state.scroll.isPublic = true
    const res = await get('step-included', '?anonymousSessionId=00000000-0000-4000-8000-000000000000')
    expect(res.status).toBe(200)
  })

  it('rejects an anonymous learner on a private scroll with 404', async () => {
    state.userId = null
    state.completedSteps = ['step-included']
    state.scroll.isPublic = false
    const res = await get('step-included', '?anonymousSessionId=00000000-0000-4000-8000-000000000000')
    // Private scroll is hidden from anonymous callers — same shape as the
    // /learn/scrolls/:slug route that returns 404 in this case.
    expect(res.status).toBe(404)
    state.scroll.isPublic = true // restore for subsequent tests
  })
})
