import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Belt } from '../../../domain/recognition/belt'

// vi.hoisted runs at the very top so the mock factories below can close over
// these bindings without hitting "Cannot access X before initialization".
const { db, selectQueue, calculateBelt } = vi.hoisted(() => {
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
        // Calling the proxy returns another chainable so the next .method()
        // in the chain (e.g. .from(t).innerJoin(...).where(...)) still works.
        // Await happens once a consumer hits .then via the get trap above.
        return new Proxy(() => undefined, handler)
      },
    }
    return new Proxy(() => undefined, handler)
  }

  return {
    selectQueue,
    db: {
      select: vi.fn(() => chainable(selectQueue.shift() ?? [])),
      update: vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
      })),
      query: {
        userPreferences: {
          findFirst: vi.fn().mockResolvedValue(undefined),
        },
      },
    },
    calculateBelt: vi.fn(),
  }
})

vi.mock('../../persistence/drizzle/client', () => ({ db }))

vi.mock('../../persistence/drizzle/schema', () => ({
  sessions: {},
  katas: {},
  attempts: {},
  userPreferences: {},
}))

vi.mock('../../container', () => ({
  useCases: { calculateBelt: { execute: calculateBelt } },
}))

vi.mock('../middleware/auth', () => ({
  requireAuth: async (
    c: { set: (k: string, v: unknown) => void },
    next: () => Promise<void>,
  ) => {
    c.set('user', { id: 'user-test-1' })
    await next()
  },
}))

// Import AFTER all mocks so the route grabs the mocked deps.
import { dashboardRoutes } from './dashboard'
import { Hono } from 'hono'

const WHITE_BELT: Belt = {
  rank: 'white',
  factors: { completed: 0, distinctClusters: 0, activeDays30: 0, daysAtRank: 0 },
}

function seedEmpty() {
  // 10 chained selects fire in the handler — activeRow (Phase 1) + the
  // 9-element Promise.all in Phase 2. Seed [] for every one so the handler
  // walks the no-data path end-to-end.
  selectQueue.length = 0
  selectQueue.push([], [], [], [], [], [], [], [], [], [])
}

function makeApp() {
  const app = new Hono()
  app.route('/', dashboardRoutes)
  return app
}

describe('GET /dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    db.query.userPreferences.findFirst.mockResolvedValue(undefined)
    calculateBelt.mockResolvedValue(WHITE_BELT)
    seedEmpty()
  })

  it('returns 200 with default-empty shape for a new user', async () => {
    const app = makeApp()
    const res = await app.request('/dashboard')

    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>

    expect(body).toMatchObject({
      streak: 0,
      totalCompleted: 0,
      todayComplete: false,
      todaySession: null,
      activeSessionId: null,
      heatmapData: [],
      recentSessions: [],
      weakAreas: [],
      weeklyGoal: { target: null, completed: 0 },
      belt: WHITE_BELT,
    })
    expect(body['practicePatterns']).toMatchObject({
      avgTimeMinutes: 0,
      mostAvoidedType: 'CODE',
      sessionsTimedOut: 0,
    })
  })

  it('excludes the removed senseiSuggests field', async () => {
    // Regression guard — Sprint 6 removed senseiSuggests because it
    // duplicated weakAreas without the frequency. If anyone re-adds it,
    // this test catches it.
    const app = makeApp()
    const res = await app.request('/dashboard')
    const body = (await res.json()) as Record<string, unknown>

    expect(body).not.toHaveProperty('senseiSuggests')
  })

  it('reports a user-set weekly goal target', async () => {
    db.query.userPreferences.findFirst.mockResolvedValue({ goalWeeklyTarget: 5 })

    const app = makeApp()
    const res = await app.request('/dashboard')
    const body = (await res.json()) as {
      weeklyGoal: { target: number | null; completed: number }
    }

    expect(body.weeklyGoal.target).toBe(5)
  })

  it('returns null weekly target when the user never picked one', async () => {
    // Sprint brand-honesty fix: don't invent a default goal of 3.
    db.query.userPreferences.findFirst.mockResolvedValue(undefined)

    const app = makeApp()
    const res = await app.request('/dashboard')
    const body = (await res.json()) as { weeklyGoal: { target: number | null } }

    expect(body.weeklyGoal.target).toBeNull()
  })

  it('surfaces the belt computed by calculateBelt', async () => {
    const yellowBelt: Belt = {
      rank: 'yellow',
      factors: { completed: 12, distinctClusters: 2, activeDays30: 6, daysAtRank: 8 },
    }
    calculateBelt.mockResolvedValueOnce(yellowBelt)

    const app = makeApp()
    const res = await app.request('/dashboard')
    const body = (await res.json()) as { belt: Belt }

    expect(body.belt).toEqual(yellowBelt)
  })
})
