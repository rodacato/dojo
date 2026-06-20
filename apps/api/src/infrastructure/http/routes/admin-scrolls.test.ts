import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppEnv } from '../app-env'

// Hoisted so the mock factories below can close over the bindings the route
// pulls in. authState drives the requireAuth/requireCreator gate; the db spies
// stand in for the drizzle query builder the handlers call.
const {
  mockConfig,
  authState,
  scrollsFindMany,
  scrollsFindFirst,
  lessonsFindMany,
  updateReturning,
  updateSet,
  dbUpdate,
  deleteWhere,
  dbDelete,
  seedAllScrolls,
} = vi.hoisted(() => {
  const updateReturning = vi.fn()
  const updateWhere = vi.fn(() => ({ returning: updateReturning }))
  const updateSet = vi.fn(() => ({ where: updateWhere }))
  const dbUpdate = vi.fn(() => ({ set: updateSet }))

  const deleteWhere = vi.fn()
  const dbDelete = vi.fn(() => ({ where: deleteWhere }))

  return {
    mockConfig: { CREATOR_GITHUB_ID: 'creator-gh' },
    authState: { mode: 'creator' as 'creator' | 'non-creator' | 'anon' },
    scrollsFindMany: vi.fn(),
    scrollsFindFirst: vi.fn(),
    lessonsFindMany: vi.fn(),
    updateReturning,
    updateSet,
    dbUpdate,
    deleteWhere,
    dbDelete,
    seedAllScrolls: vi.fn(),
  }
})

vi.mock('../../../config', () => ({ config: mockConfig }))

vi.mock('../../persistence/drizzle/client', () => ({
  db: {
    query: {
      scrolls: { findMany: scrollsFindMany, findFirst: scrollsFindFirst },
      lessons: { findMany: lessonsFindMany },
    },
    update: dbUpdate,
    delete: dbDelete,
  },
}))

// The route only uses these as table refs passed to eq()/where(); a plain
// object is enough for the mocked builder.
vi.mock('../../persistence/drizzle/schema', () => ({
  scrolls: { id: 'scrolls.id' },
  lessons: { scrollId: 'lessons.scrollId', id: 'lessons.id' },
  steps: { lessonId: 'steps.lessonId' },
}))

vi.mock('../../persistence/seed-scrolls', () => ({ seedAllScrolls }))

// Mock the auth boundary directly: requireAuth resolves the session->user,
// requireCreator gates on githubId. Both throw the same HTTPExceptions the
// real middleware does so the router's onError maps them to 401/403.
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

import { adminScrollsRoutes } from './admin-scrolls'

function makeApp() {
  const app = new Hono<AppEnv>()
  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()
    return c.json({ error: 'Internal server error' }, 500)
  })
  app.route('/admin/scrolls', adminScrollsRoutes)
  return app
}

const CREATED_AT = new Date('2026-06-01T12:00:00.000Z')

function scrollRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'scroll-1',
    slug: 'python',
    title: 'Python',
    description: 'Learn Python',
    language: 'python',
    accentColor: '#abcdef',
    status: 'draft',
    isPublic: false,
    createdAt: CREATED_AT,
    lessons: [
      { id: 'l-1', steps: [{ id: 's-1' }, { id: 's-2' }] },
      { id: 'l-2', steps: [{ id: 's-3' }] },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.mode = 'creator'
})

describe('admin-scrolls — auth gate (all routes share requireAuth+requireCreator)', () => {
  it('returns 401 for an anonymous request', async () => {
    authState.mode = 'anon'
    const res = await makeApp().request('/admin/scrolls')
    expect(res.status).toBe(401)
    expect(scrollsFindMany).not.toHaveBeenCalled()
  })

  it('returns 403 for an authenticated non-creator', async () => {
    authState.mode = 'non-creator'
    const res = await makeApp().request('/admin/scrolls')
    expect(res.status).toBe(403)
    expect(scrollsFindMany).not.toHaveBeenCalled()
  })

  it('gates POST /seed for a non-creator', async () => {
    authState.mode = 'non-creator'
    const res = await makeApp().request('/admin/scrolls/seed', { method: 'POST' })
    expect(res.status).toBe(403)
    expect(seedAllScrolls).not.toHaveBeenCalled()
  })
})

describe('GET /admin/scrolls', () => {
  it('returns 200 with mapped rows including lesson/step counts', async () => {
    scrollsFindMany.mockResolvedValue([scrollRow()])
    const res = await makeApp().request('/admin/scrolls')
    expect(res.status).toBe(200)

    const body = (await res.json()) as Array<Record<string, unknown>>
    expect(body).toHaveLength(1)
    expect(body[0]).toEqual({
      id: 'scroll-1',
      slug: 'python',
      title: 'Python',
      description: 'Learn Python',
      language: 'python',
      accentColor: '#abcdef',
      status: 'draft',
      isPublic: false,
      lessonCount: 2,
      stepCount: 3,
      createdAt: CREATED_AT.toISOString(),
    })
  })

  it('returns an empty array when there are no scrolls', async () => {
    scrollsFindMany.mockResolvedValue([])
    const res = await makeApp().request('/admin/scrolls')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns 500 when the findMany query rejects', async () => {
    scrollsFindMany.mockRejectedValue(new Error('db down'))
    const res = await makeApp().request('/admin/scrolls')
    expect(res.status).toBe(500)
  })
})

describe('PATCH /admin/scrolls/:id', () => {
  function patch(id: string, body: unknown) {
    return makeApp().request(`/admin/scrolls/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('updates isPublic and returns the patched fields', async () => {
    updateReturning.mockResolvedValue([
      { id: 'scroll-1', isPublic: true, status: 'draft' },
    ])
    const res = await patch('scroll-1', { isPublic: true })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      id: 'scroll-1',
      isPublic: true,
      status: 'draft',
    })

    expect(dbUpdate).toHaveBeenCalledWith({ id: 'scrolls.id' })
    expect(updateSet).toHaveBeenCalledWith({ isPublic: true })
  })

  it('updates status and returns the patched fields', async () => {
    updateReturning.mockResolvedValue([
      { id: 'scroll-1', isPublic: false, status: 'published' },
    ])
    const res = await patch('scroll-1', { status: 'published' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      id: 'scroll-1',
      isPublic: false,
      status: 'published',
    })
    expect(updateSet).toHaveBeenCalledWith({ status: 'published' })
  })

  it('sets both isPublic and status when both are supplied', async () => {
    updateReturning.mockResolvedValue([
      { id: 'scroll-1', isPublic: true, status: 'published' },
    ])
    const res = await patch('scroll-1', { isPublic: true, status: 'published' })
    expect(res.status).toBe(200)
    expect(updateSet).toHaveBeenCalledWith({ isPublic: true, status: 'published' })
  })

  it('returns 422 when the body fails schema validation', async () => {
    const res = await patch('scroll-1', { status: 'archived' })
    expect(res.status).toBe(422)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('Invalid request')
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it('returns 422 when the body has nothing to update', async () => {
    const res = await patch('scroll-1', {})
    expect(res.status).toBe(422)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('Nothing to update')
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it('returns 404 when no row is updated', async () => {
    updateReturning.mockResolvedValue([])
    const res = await patch('missing', { isPublic: true })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Scroll not found' })
  })

  it('returns 500 when the JSON body is invalid', async () => {
    const res = await makeApp().request('/admin/scrolls/scroll-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    expect(res.status).toBe(500)
  })
})

describe('POST /admin/scrolls/seed', () => {
  it('returns 200 with the seed report on success', async () => {
    const report = { scrolls: 6, lessons: 30, steps: 120 }
    seedAllScrolls.mockResolvedValue(report)
    const res = await makeApp().request('/admin/scrolls/seed', { method: 'POST' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(report)
    expect(seedAllScrolls).toHaveBeenCalledTimes(1)
  })

  it('returns 500 with the error message when the seed throws an Error', async () => {
    seedAllScrolls.mockRejectedValue(new Error('seed exploded'))
    const res = await makeApp().request('/admin/scrolls/seed', { method: 'POST' })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'seed exploded' })
  })

  it('returns 500 with a fallback message for a non-Error rejection', async () => {
    seedAllScrolls.mockRejectedValue('boom-string')
    const res = await makeApp().request('/admin/scrolls/seed', { method: 'POST' })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Seed failed' })
  })
})

describe('POST /admin/scrolls/:id/wipe', () => {
  it('deletes steps per lesson then the lessons and returns ok', async () => {
    scrollsFindFirst.mockResolvedValue({ id: 'scroll-1' })
    lessonsFindMany.mockResolvedValue([{ id: 'l-1' }, { id: 'l-2' }])
    deleteWhere.mockResolvedValue(undefined)

    const res = await makeApp().request('/admin/scrolls/scroll-1/wipe', {
      method: 'POST',
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })

    // One delete(steps) per lesson + one delete(lessons) = 3 delete() calls.
    expect(dbDelete).toHaveBeenCalledTimes(3)
    expect(dbDelete).toHaveBeenNthCalledWith(1, { lessonId: 'steps.lessonId' })
    expect(dbDelete).toHaveBeenNthCalledWith(2, { lessonId: 'steps.lessonId' })
    expect(dbDelete).toHaveBeenNthCalledWith(3, {
      scrollId: 'lessons.scrollId',
      id: 'lessons.id',
    })
    expect(deleteWhere).toHaveBeenCalledTimes(3)
  })

  it('handles a scroll with no lessons (only the lessons delete runs)', async () => {
    scrollsFindFirst.mockResolvedValue({ id: 'scroll-1' })
    lessonsFindMany.mockResolvedValue([])
    deleteWhere.mockResolvedValue(undefined)

    const res = await makeApp().request('/admin/scrolls/scroll-1/wipe', {
      method: 'POST',
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(dbDelete).toHaveBeenCalledTimes(1)
    expect(dbDelete).toHaveBeenCalledWith({
      scrollId: 'lessons.scrollId',
      id: 'lessons.id',
    })
  })

  it('returns 404 when the scroll does not exist and never deletes', async () => {
    scrollsFindFirst.mockResolvedValue(undefined)
    const res = await makeApp().request('/admin/scrolls/missing/wipe', {
      method: 'POST',
    })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Scroll not found' })
    expect(lessonsFindMany).not.toHaveBeenCalled()
    expect(dbDelete).not.toHaveBeenCalled()
  })

  it('returns 500 when a delete rejects', async () => {
    scrollsFindFirst.mockResolvedValue({ id: 'scroll-1' })
    lessonsFindMany.mockResolvedValue([{ id: 'l-1' }])
    deleteWhere.mockRejectedValue(new Error('fk violation'))

    const res = await makeApp().request('/admin/scrolls/scroll-1/wipe', {
      method: 'POST',
    })
    expect(res.status).toBe(500)
  })
})
