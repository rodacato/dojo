import { and, eq } from 'drizzle-orm'
import type * as DrizzleOrm from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppEnv } from '../app-env'

// Partial mock: delegate to the real eq/and so the route's query-helpers keep
// working, while spying on the filter conditions built from the query params.
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof DrizzleOrm>()
  return { ...actual, eq: vi.fn(actual.eq), and: vi.fn(actual.and) }
})

// vi.hoisted so the mock factories below can close over these bindings.
const { db, findFirst, selectQueue } = vi.hoisted(() => {
  const selectQueue: unknown[][] = []

  // Minimal chainable that resolves to the next queued row set when awaited.
  // The route builds two query chains inside Promise.all:
  //   select().from().where().orderBy().limit().offset()  -> rows
  //   select().from().where()                             -> [{ count }]
  function chainable(rows: unknown[]): unknown {
    const handler: ProxyHandler<() => unknown> = {
      get(_target, prop) {
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

  return {
    selectQueue,
    findFirst: vi.fn(),
    db: {
      select: vi.fn(() => chainable(selectQueue.shift() ?? [])),
      query: {
        userSessions: {
          findFirst: vi.fn(),
        },
      },
    },
  }
})

// config is read by requireCreator (CREATOR_GITHUB_ID) — pin a known value
// so the creator/non-creator boundary is deterministic. Literal lives inside
// the hoisted factory; CREATOR_ID below mirrors it for the test bodies.
vi.mock('../../../config', () => ({
  config: { CREATOR_GITHUB_ID: 'creator-gh-id' },
}))
const CREATOR_ID = 'creator-gh-id'

vi.mock('../../persistence/drizzle/client', () => ({ db }))

vi.mock('../../persistence/drizzle/schema', () => ({
  errors: {
    source: 'errors.source',
    status: 'errors.status',
    createdAt: 'errors.createdAt',
  },
  userSessions: { id: 'userSessions.id', expiresAt: 'userSessions.expiresAt' },
}))

// Import AFTER mocks so both the route and the auth middleware grab mocked deps.
import { adminErrorsRoutes } from './admin-errors'
// The mocked table-ref — same object the route passes into eq(); assert against it.
import { errors } from '../../persistence/drizzle/schema'

// Wire db.query.userSessions.findFirst to the hoisted spy so per-test setup
// can vary the resolved session.
db.query.userSessions.findFirst = findFirst

function makeApp() {
  const app = new Hono<AppEnv>()
  app.route('/admin/errors', adminErrorsRoutes)
  // Mirror the production router's onError: HTTPException passthrough,
  // everything else (incl. ZodError) becomes a 500. Without this Hono's
  // default already returns the HTTPException response, but ZodError would
  // surface as a 500 too — assert that explicitly.
  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()
    return c.json({ error: 'Internal server error' }, 500)
  })
  return app
}

const CREATED_AT = new Date('2026-06-01T12:00:00.000Z')

function errorRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'err-1',
    createdAt: CREATED_AT,
    source: 'api',
    status: 500,
    route: '/sessions',
    method: 'POST',
    message: 'boom',
    stack: 'Error: boom\n  at x',
    requestId: 'req-1',
    userId: 'user-9',
    context: { extra: true },
    ...overrides,
  }
}

const FUTURE = new Date(Date.now() + 60 * 60 * 1000)

function seedCreatorSession() {
  findFirst.mockResolvedValue({
    id: 'session-1',
    expiresAt: FUTURE,
    user: { id: 'user-creator', githubId: CREATOR_ID },
  })
}

function seedNonCreatorSession() {
  findFirst.mockResolvedValue({
    id: 'session-2',
    expiresAt: FUTURE,
    user: { id: 'user-other', githubId: 'not-the-creator' },
  })
}

const CREATOR_AUTH = { Authorization: 'Bearer session-1' }

describe('GET /admin/errors — auth & role', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    selectQueue.length = 0
  })

  it('returns 401 when no Authorization header is present', async () => {
    const res = await makeApp().request('/admin/errors')
    expect(res.status).toBe(401)
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('returns 401 when Authorization is not a Bearer token', async () => {
    const res = await makeApp().request('/admin/errors', {
      headers: { Authorization: 'Basic abc' },
    })
    expect(res.status).toBe(401)
  })

  it('returns 401 when the session is expired or unknown', async () => {
    findFirst.mockResolvedValue(undefined)
    const res = await makeApp().request('/admin/errors', { headers: CREATOR_AUTH })
    expect(res.status).toBe(401)
  })

  it('returns 403 when an authenticated non-creator user requests', async () => {
    seedNonCreatorSession()
    const res = await makeApp().request('/admin/errors', {
      headers: { Authorization: 'Bearer session-2' },
    })
    expect(res.status).toBe(403)
    // Role gate fires before any data query runs.
    expect(db.select).not.toHaveBeenCalled()
  })

  it('returns 200 for the creator user', async () => {
    seedCreatorSession()
    selectQueue.push([], [{ count: 0 }])
    const res = await makeApp().request('/admin/errors', { headers: CREATOR_AUTH })
    expect(res.status).toBe(200)
  })
})

describe('GET /admin/errors — response shape', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    selectQueue.length = 0
    seedCreatorSession()
  })

  it('maps rows and serialises createdAt to an ISO string', async () => {
    selectQueue.push([errorRow()], [{ count: 1 }])

    const res = await makeApp().request('/admin/errors', { headers: CREATOR_AUTH })
    expect(res.status).toBe(200)

    const body = (await res.json()) as {
      total: number
      limit: number
      offset: number
      rows: Array<Record<string, unknown>>
    }

    expect(body.total).toBe(1)
    expect(body.limit).toBe(100)
    expect(body.offset).toBe(0)
    expect(body.rows).toHaveLength(1)
    expect(body.rows[0]).toEqual({
      id: 'err-1',
      createdAt: '2026-06-01T12:00:00.000Z',
      source: 'api',
      status: 500,
      route: '/sessions',
      method: 'POST',
      message: 'boom',
      stack: 'Error: boom\n  at x',
      requestId: 'req-1',
      userId: 'user-9',
      context: { extra: true },
    })
  })

  it('returns total 0 when the count query yields no row', async () => {
    // Exercises the `totalRow[0]?.count ?? 0` fallback branch.
    selectQueue.push([], [])

    const res = await makeApp().request('/admin/errors', { headers: CREATOR_AUTH })
    const body = (await res.json()) as { total: number; rows: unknown[] }

    expect(body.total).toBe(0)
    expect(body.rows).toEqual([])
  })

  it('returns the computed total alongside the rows', async () => {
    selectQueue.push([errorRow({ id: 'a' }), errorRow({ id: 'b' })], [{ count: 42 }])

    const res = await makeApp().request('/admin/errors', { headers: CREATOR_AUTH })
    const body = (await res.json()) as { total: number; rows: unknown[] }

    expect(body.total).toBe(42)
    expect(body.rows).toHaveLength(2)
  })
})

describe('GET /admin/errors — query params', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    selectQueue.length = 0
    seedCreatorSession()
  })

  it('echoes default limit/offset when none are supplied', async () => {
    selectQueue.push([], [{ count: 0 }])
    const res = await makeApp().request('/admin/errors', { headers: CREATOR_AUTH })
    const body = (await res.json()) as { limit: number; offset: number }

    expect(body.limit).toBe(100)
    expect(body.offset).toBe(0)
  })

  it('coerces and echoes custom limit/offset', async () => {
    selectQueue.push([], [{ count: 0 }])
    const res = await makeApp().request('/admin/errors?limit=25&offset=50', {
      headers: CREATOR_AUTH,
    })
    const body = (await res.json()) as { limit: number; offset: number }

    expect(body.limit).toBe(25)
    expect(body.offset).toBe(50)
  })

  it('accepts the source filter (exercises the source WHERE branch)', async () => {
    selectQueue.push([errorRow({ source: 'web' })], [{ count: 1 }])
    const res = await makeApp().request('/admin/errors?source=web', {
      headers: CREATOR_AUTH,
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as { rows: Array<{ source: string }> }
    expect(body.rows[0]?.source).toBe('web')
    expect(eq).toHaveBeenCalledWith(errors.source, 'web')
  })

  it('accepts the status filter (exercises the status WHERE branch)', async () => {
    selectQueue.push([errorRow({ status: 404 })], [{ count: 1 }])
    const res = await makeApp().request('/admin/errors?status=404', {
      headers: CREATOR_AUTH,
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as { rows: Array<{ status: number }> }
    expect(body.rows[0]?.status).toBe(404)
    expect(eq).toHaveBeenCalledWith(errors.status, 404)
  })

  it('combines source and status filters', async () => {
    selectQueue.push([], [{ count: 0 }])
    const res = await makeApp().request('/admin/errors?source=api&status=500', {
      headers: CREATOR_AUTH,
    })
    expect(res.status).toBe(200)
    expect(eq).toHaveBeenCalledWith(errors.source, 'api')
    expect(eq).toHaveBeenCalledWith(errors.status, 500)
    expect(and).toHaveBeenCalled()
  })

  it('returns 500 when limit exceeds the max=200 bound (Zod parse throws)', async () => {
    // Route uses listSchema.parse(); a ZodError is not an HTTPException, so
    // the router's onError converts it to a 500 (no 400 handler exists).
    const res = await makeApp().request('/admin/errors?limit=999', {
      headers: CREATOR_AUTH,
    })
    expect(res.status).toBe(500)
    expect(db.select).not.toHaveBeenCalled()
  })

  it('returns 500 on a non-numeric offset (Zod coercion throws)', async () => {
    const res = await makeApp().request('/admin/errors?offset=abc', {
      headers: CREATOR_AUTH,
    })
    expect(res.status).toBe(500)
  })

  it('returns 500 on an out-of-enum source value', async () => {
    const res = await makeApp().request('/admin/errors?source=mobile', {
      headers: CREATOR_AUTH,
    })
    expect(res.status).toBe(500)
  })
})

describe('GET /admin/errors — data-layer failure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    selectQueue.length = 0
    seedCreatorSession()
  })

  it('returns 500 when the select chain rejects', async () => {
    db.select.mockImplementationOnce(() => {
      throw new Error('db down')
    })
    const res = await makeApp().request('/admin/errors', { headers: CREATOR_AUTH })
    expect(res.status).toBe(500)
  })
})
