import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { eq } from 'drizzle-orm'
import type * as DrizzleOrm from 'drizzle-orm'
import type { Belt } from '../../../domain/recognition/belt'

// Partial mock: delegate to the real eq so the route's query-helpers keep
// working, while still spying on the username flowing into the where-clause.
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof DrizzleOrm>()
  return { ...actual, eq: vi.fn(actual.eq) }
})

// vi.hoisted runs first so the mock factories can close over these bindings.
const { db, selectQueue, findFirst, calculateBelt } = vi.hoisted(() => {
  const selectQueue: unknown[][] = []

  function chainable(rows: unknown[] = []) {
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
      selectDistinct: vi.fn(() => chainable(selectQueue.shift() ?? [])),
      query: {
        users: {
          findFirst: vi.fn(),
        },
      },
    },
    calculateBelt: vi.fn(),
  }
})

vi.mock('../../persistence/drizzle/client', () => ({ db }))

vi.mock('../../persistence/drizzle/schema', () => ({
  attempts: {},
  katas: {},
  sessions: {},
  userMilestones: {},
  users: {},
}))

vi.mock('../../container', () => ({
  useCases: { calculateBelt: { execute: calculateBelt } },
}))

// Import AFTER all mocks so the route grabs the mocked deps.
import { profileRoutes } from './profile'
import { users } from '../../persistence/drizzle/schema'

const WHITE_BELT: Belt = {
  rank: 'white',
  factors: { completed: 0, distinctClusters: 0, activeDays30: 0, daysAtRank: 0 },
}

const MEMBER_SINCE = new Date('2026-01-01T00:00:00.000Z')

function makeApp() {
  const app = new Hono()
  app.route('/', profileRoutes)
  // Mirror the production router's onError so the 500 path returns the same
  // JSON shape as it would in production (bare Hono would return plain text).
  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()
    return c.json({ error: 'Internal server error' }, 500)
  })
  return app
}

// The handler fires 7 db.select-family chains in this order:
// 1 heatmap, 2 totalRow, 3 passedRow, 4 langRows, 5 avgRow, 6 recentRows, 7 badgeRows
function seedSelects(rows: {
  heatmap?: unknown[]
  total?: unknown[]
  passed?: unknown[]
  langs?: unknown[]
  avg?: unknown[]
  recent?: unknown[]
  badges?: unknown[]
} = {}) {
  selectQueue.length = 0
  selectQueue.push(
    rows.heatmap ?? [],
    rows.total ?? [],
    rows.passed ?? [],
    rows.langs ?? [],
    rows.avg ?? [],
    rows.recent ?? [],
    rows.badges ?? [],
  )
}

function seedUser(overrides: Record<string, unknown> = {}) {
  db.query.users.findFirst.mockResolvedValue({
    id: 'user-1',
    username: 'kenji',
    avatarUrl: 'https://avatars.example/kenji.png',
    createdAt: MEMBER_SINCE,
    ...overrides,
  })
}

describe('GET /u/:username', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    db.query.users.findFirst.mockReset()
    findFirst.mockReset()
    calculateBelt.mockResolvedValue(WHITE_BELT)
    seedSelects()
  })

  it('returns 404 when the username does not resolve to a user', async () => {
    db.query.users.findFirst.mockResolvedValue(undefined)

    const app = makeApp()
    const res = await app.request('/u/ghost')

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'User not found' })
  })

  it('does not run any select queries when the user is missing', async () => {
    db.query.users.findFirst.mockResolvedValue(undefined)

    const app = makeApp()
    await app.request('/u/ghost')

    expect(db.select).not.toHaveBeenCalled()
    expect(calculateBelt).not.toHaveBeenCalled()
  })

  it('returns 200 with the default-empty profile shape for a user with no activity', async () => {
    seedUser()

    const app = makeApp()
    const res = await app.request('/u/kenji')

    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>

    expect(body).toMatchObject({
      username: 'kenji',
      avatarUrl: 'https://avatars.example/kenji.png',
      memberSince: MEMBER_SINCE.toISOString(),
      stats: {
        totalKata: 0,
        passRate: 0,
        avgTimeMinutes: 0,
        languages: [],
      },
      streak: 0,
      heatmapData: [],
      recentSessions: [],
      milestones: [],
      belt: WHITE_BELT,
    })
  })

  it('looks up the user by the username path param', async () => {
    seedUser()

    const app = makeApp()
    await app.request('/u/kenji')

    expect(db.query.users.findFirst).toHaveBeenCalledTimes(1)
    // Prove the :username path param reaches the user lookup's where-clause.
    // The column (first arg) is the mocked users.username, so only the value
    // is meaningful here; assert the username is what flowed in.
    expect(eq).toHaveBeenCalledWith(users.username, 'kenji')
  })

  it('computes passRate as rounded percentage of passed over completed', async () => {
    seedUser()
    seedSelects({
      total: [{ count: 8 }],
      passed: [{ count: 6 }],
    })

    const app = makeApp()
    const res = await app.request('/u/kenji')
    const body = (await res.json()) as { stats: { totalKata: number; passRate: number } }

    expect(body.stats.totalKata).toBe(8)
    // 6 / 8 = 0.75 -> 75
    expect(body.stats.passRate).toBe(75)
  })

  it('returns passRate 0 when there are no completed sessions (avoids divide-by-zero)', async () => {
    seedUser()
    seedSelects({
      total: [{ count: 0 }],
      passed: [{ count: 5 }],
    })

    const app = makeApp()
    const res = await app.request('/u/kenji')
    const body = (await res.json()) as { stats: { passRate: number } }

    expect(body.stats.passRate).toBe(0)
  })

  it('coerces null count rows to 0 for total and avg', async () => {
    seedUser()
    seedSelects({
      total: [],
      avg: [],
    })

    const app = makeApp()
    const res = await app.request('/u/kenji')
    const body = (await res.json()) as {
      stats: { totalKata: number; avgTimeMinutes: number }
    }

    expect(body.stats.totalKata).toBe(0)
    expect(body.stats.avgTimeMinutes).toBe(0)
  })

  it('surfaces distinct languages from the language rows', async () => {
    seedUser()
    seedSelects({
      langs: [{ lang: 'python' }, { lang: 'typescript' }],
    })

    const app = makeApp()
    const res = await app.request('/u/kenji')
    const body = (await res.json()) as { stats: { languages: string[] } }

    expect(body.stats.languages).toEqual(['python', 'typescript'])
  })

  it('maps heatmap rows to { date, count } with numeric counts', async () => {
    seedUser()
    seedSelects({
      heatmap: [
        { date: '2026-06-19', count: '3' },
        { date: '2026-06-18', count: 1 },
      ],
    })

    const app = makeApp()
    const res = await app.request('/u/kenji')
    const body = (await res.json()) as {
      heatmapData: Array<{ date: string; count: number }>
    }

    expect(body.heatmapData).toEqual([
      { date: '2026-06-19', count: 3 },
      { date: '2026-06-18', count: 1 },
    ])
  })

  it('serializes recent sessions, normalizing verdict and completedAt', async () => {
    seedUser()
    const startedAt = new Date('2026-06-19T10:00:00.000Z')
    const completedAt = new Date('2026-06-19T10:30:00.000Z')
    seedSelects({
      recent: [
        {
          id: 'session-1',
          status: 'completed',
          startedAt,
          completedAt,
          kataTitle: 'FizzBuzz',
          kataType: 'CODE',
          difficulty: 'easy',
          verdict: 'PASSED',
        },
        {
          id: 'session-2',
          status: 'completed',
          startedAt,
          completedAt: null,
          kataTitle: 'Reverse',
          kataType: 'CODE',
          difficulty: 'medium',
          verdict: null,
        },
      ],
    })

    const app = makeApp()
    const res = await app.request('/u/kenji')
    const body = (await res.json()) as {
      recentSessions: Array<{
        id: string
        kataTitle: string
        verdict: string | null
        completedAt: string | null
        startedAt: string
      }>
    }

    expect(body.recentSessions).toEqual([
      {
        id: 'session-1',
        kataTitle: 'FizzBuzz',
        kataType: 'CODE',
        difficulty: 'easy',
        verdict: 'PASSED',
        status: 'completed',
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
      },
      {
        id: 'session-2',
        kataTitle: 'Reverse',
        kataType: 'CODE',
        difficulty: 'medium',
        verdict: null,
        status: 'completed',
        startedAt: startedAt.toISOString(),
        completedAt: null,
      },
    ])
  })

  it('serializes milestones with ISO earnedAt timestamps', async () => {
    seedUser()
    const earnedAt = new Date('2026-05-01T12:00:00.000Z')
    seedSelects({
      badges: [{ slug: 'first-kata', earnedAt }],
    })

    const app = makeApp()
    const res = await app.request('/u/kenji')
    const body = (await res.json()) as {
      milestones: Array<{ slug: string; earnedAt: string }>
    }

    expect(body.milestones).toEqual([
      { slug: 'first-kata', earnedAt: earnedAt.toISOString() },
    ])
  })

  it('surfaces the belt computed by calculateBelt for the resolved user', async () => {
    seedUser()
    const yellowBelt: Belt = {
      rank: 'yellow',
      factors: { completed: 12, distinctClusters: 2, activeDays30: 6, daysAtRank: 8 },
    }
    calculateBelt.mockResolvedValueOnce(yellowBelt)

    const app = makeApp()
    const res = await app.request('/u/kenji')
    const body = (await res.json()) as { belt: Belt }

    expect(body.belt).toEqual(yellowBelt)
    expect(calculateBelt).toHaveBeenCalledWith('user-1')
  })

  it('passes a null avatarUrl through unchanged', async () => {
    seedUser({ avatarUrl: null })

    const app = makeApp()
    const res = await app.request('/u/kenji')
    const body = (await res.json()) as { avatarUrl: string | null }

    expect(body.avatarUrl).toBeNull()
  })

  it('returns 500 when calculateBelt rejects', async () => {
    seedUser()
    calculateBelt.mockRejectedValueOnce(new Error('belt boom'))

    const app = makeApp()
    const res = await app.request('/u/kenji')

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
  })
})
