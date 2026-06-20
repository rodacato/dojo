import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createRouter } from '../router'

const { calculateBelt, listUserMilestones, findFirst } = vi.hoisted(() => ({
  calculateBelt: vi.fn(),
  listUserMilestones: vi.fn(),
  findFirst: vi.fn(),
}))

vi.mock('../../container', () => ({
  useCases: {
    calculateBelt: { execute: calculateBelt },
    listUserMilestones: { execute: listUserMilestones },
  },
  // router.ts pulls errorReporter from the container for onError
  errorReporter: { report: vi.fn() },
}))

vi.mock('../../persistence/drizzle/client', () => ({
  db: {
    query: {
      userSessions: {
        findFirst,
      },
    },
  },
}))

vi.mock('../../persistence/drizzle/schema', () => ({
  userSessions: {},
}))

const WHITE_BELT = {
  rank: 'white',
  factors: { completed: 0, distinctClusters: 0, activeDays30: 0, daysAtRank: 0 },
}

function authedSession() {
  return { id: 'sess-1', user: { id: 'user-1', githubId: 'gh-1' } }
}

describe('GET /belts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    findFirst.mockResolvedValue(authedSession())
    calculateBelt.mockResolvedValue(WHITE_BELT)
    listUserMilestones.mockResolvedValue([])
  })

  it('returns 401 when no Authorization header is present', async () => {
    const app = createRouter()
    const res = await app.request('/belts')

    expect(res.status).toBe(401)
    expect(calculateBelt).not.toHaveBeenCalled()
    expect(listUserMilestones).not.toHaveBeenCalled()
  })

  it('returns 401 when Authorization header is not a Bearer token', async () => {
    const app = createRouter()
    const res = await app.request('/belts', {
      headers: { Authorization: 'Basic abc123' },
    })

    expect(res.status).toBe(401)
  })

  it('returns 401 when the session is expired or invalid', async () => {
    findFirst.mockResolvedValue(undefined)

    const app = createRouter()
    const res = await app.request('/belts', {
      headers: { Authorization: 'Bearer expired-session' },
    })

    expect(res.status).toBe(401)
    expect(calculateBelt).not.toHaveBeenCalled()
  })

  it('returns 200 with belt and empty milestones for an authenticated user', async () => {
    const app = createRouter()
    const res = await app.request('/belts', {
      headers: { Authorization: 'Bearer valid-session' },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      belt: typeof WHITE_BELT
      milestones: unknown[]
    }
    expect(body.belt).toEqual(WHITE_BELT)
    expect(body.milestones).toEqual([])
  })

  it('passes the authenticated user id to both use cases', async () => {
    const app = createRouter()
    await app.request('/belts', {
      headers: { Authorization: 'Bearer valid-session' },
    })

    expect(calculateBelt).toHaveBeenCalledWith('user-1')
    expect(listUserMilestones).toHaveBeenCalledWith('user-1')
  })

  it('serializes milestones with id, ISO earnedAt, and contextRef', async () => {
    const earnedAt = new Date('2026-01-15T10:30:00.000Z')
    listUserMilestones.mockResolvedValue([
      { milestoneId: 'first-kata', earnedAt, contextRef: 'session-42' },
      { milestoneId: 'streak-7', earnedAt, contextRef: null },
    ])

    const app = createRouter()
    const res = await app.request('/belts', {
      headers: { Authorization: 'Bearer valid-session' },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      milestones: Array<{ id: string; earnedAt: string; contextRef: string | null }>
    }
    expect(body.milestones).toEqual([
      {
        id: 'first-kata',
        earnedAt: '2026-01-15T10:30:00.000Z',
        contextRef: 'session-42',
      },
      {
        id: 'streak-7',
        earnedAt: '2026-01-15T10:30:00.000Z',
        contextRef: null,
      },
    ])
  })

  it('surfaces the belt computed by calculateBelt', async () => {
    const yellowBelt = {
      rank: 'yellow',
      factors: { completed: 12, distinctClusters: 2, activeDays30: 6, daysAtRank: 8 },
    }
    calculateBelt.mockResolvedValue(yellowBelt)

    const app = createRouter()
    const res = await app.request('/belts', {
      headers: { Authorization: 'Bearer valid-session' },
    })

    const body = (await res.json()) as { belt: typeof yellowBelt }
    expect(body.belt).toEqual(yellowBelt)
  })

  it('returns 500 when a use case rejects', async () => {
    calculateBelt.mockRejectedValue(new Error('boom'))

    const app = createRouter()
    const res = await app.request('/belts', {
      headers: { Authorization: 'Bearer valid-session' },
    })

    expect(res.status).toBe(500)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('Internal server error')
  })
})
