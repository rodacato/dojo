import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Belt } from '../../../domain/recognition/belt'

// vi.hoisted runs at the very top so the mock factories below can close over
// these bindings without hitting "Cannot access X before initialization".
const { db, selectQueue, calculateBelt, pickDailyKata, resolveActiveSession } = vi.hoisted(() => {
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
      query: {
        userPreferences: {
          findFirst: vi.fn().mockResolvedValue(undefined),
        },
      },
    },
    calculateBelt: vi.fn(),
    pickDailyKata: vi.fn(),
    resolveActiveSession: vi.fn(),
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
  useCases: {
    calculateBelt: { execute: calculateBelt },
    pickDailyKata: { execute: pickDailyKata },
    resolveActiveSession: { execute: resolveActiveSession },
  },
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
  // Seed [] for all 9 chained selects so the handler walks the no-data path.
  selectQueue.length = 0
  selectQueue.push([], [], [], [], [], [], [], [], [])
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
    pickDailyKata.mockResolvedValue(null)
    resolveActiveSession.mockResolvedValue(null)
    seedEmpty()
  })

  it('tells how long the daily kata is without naming it', async () => {
    pickDailyKata.mockResolvedValue({ kataId: 'kata-micro', durationMinutes: 5, lastPracticedAt: null })
    const res = await makeApp().request('/dashboard')
    const text = await res.text()

    expect((JSON.parse(text) as { dailyKataMinutes: number }).dailyKataMinutes).toBe(5)
    expect(text).not.toContain('kata-micro')
  })

  it('has no daily kata when the instance has no micro kata', async () => {
    const res = await makeApp().request('/dashboard')

    expect(((await res.json()) as { dailyKataMinutes: unknown }).dailyKataMinutes).toBeNull()
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

  it('picks the least-practiced kata type, matching the lowercase types stored on katas', async () => {
    selectQueue.length = 0
    // heatmap, recent, total, today, topics, avgTime, then the per-type counts.
    selectQueue.push([], [], [], [], [], [], [{ type: 'code', count: 6 }, { type: 'whiteboard', count: 3 }], [], [])

    const res = await makeApp().request('/dashboard')
    const body = (await res.json()) as { practicePatterns: { mostAvoidedType: string } }

    expect(body.practicePatterns.mostAvoidedType).toBe('CHAT')
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
