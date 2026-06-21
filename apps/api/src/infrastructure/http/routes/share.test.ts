import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import type * as DrizzleOrm from 'drizzle-orm'
import type { AppEnv } from '../app-env'

// ---------------------------------------------------------------------------
// Boundary mocks. share.ts queries drizzle directly (chained select with sql``
// subqueries) and renders OG cards with satori + resvg. We mock:
//   - the drizzle client: a chainable proxy whose terminal `.limit()` (await)
//     resolves to a queued row set, so the route's own branching runs.
//   - satori (default) + Resvg (named): swapped for deterministic stand-ins so
//     no real SVG render / font fetch hits the network.
//   - global fetch (getFont): returns an empty ArrayBuffer so the font load is
//     deterministic and offline.
// drizzle-orm operators stay REAL (sql`` must build) but eq/and are spied so we
// can assert the WHERE is built from the route params, not constants.
// ---------------------------------------------------------------------------

const { db, selectQueue, satoriMock, resvgRender, resvgCtor } = vi.hoisted(() => {
  const selectQueue: unknown[][] = []

  // Proxy that answers every property access with another callable proxy and is
  // awaitable — `await db.select(...)...limit(1)` resolves to the next queued
  // row set. Mirrors og.test.ts's pattern; operands are irrelevant here because
  // WHERE verification is done via the eq/and spies, not this proxy.
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

  const satoriMock = vi.fn(() => Promise.resolve('<svg>card</svg>'))
  const resvgRender = vi.fn(() => ({ asPng: () => Buffer.from('PNGDATA') }))
  const resvgCtor = vi.fn().mockImplementation(() => ({ render: resvgRender }))

  return {
    selectQueue,
    satoriMock,
    resvgRender,
    resvgCtor,
    db: {
      select: vi.fn(() => chainable(selectQueue.shift() ?? [])),
    },
  }
})

vi.mock('../../persistence/drizzle/client', () => ({ db }))

// Table refs feed eq()/and()/sql`` operands. Plain objects suffice — the
// chainable proxy never inspects them, and the eq/and spies record them.
vi.mock('../../persistence/drizzle/schema', () => ({
  sessions: { id: 'sessions.id', kataId: 'sessions.kataId', userId: 'sessions.userId' },
  katas: { id: 'katas.id' },
  attempts: { sessionId: 'attempts.sessionId', isFinalEvaluation: 'attempts.isFinal' },
  users: { id: 'users.id' },
  scrolls: { id: 'scrolls.id', slug: 'scrolls.slug' },
  lessons: { id: 'lessons.id', scrollId: 'lessons.scrollId' },
  steps: { lessonId: 'steps.lessonId' },
  scrollProgress: { scrollId: 'sp.scrollId', userId: 'sp.userId' },
}))

vi.mock('satori', () => ({ default: satoriMock }))
vi.mock('@resvg/resvg-js', () => ({ Resvg: resvgCtor }))

// drizzle-orm: real operators (sql`` must work), eq/and spied to assert WHERE
// is param-derived.
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof DrizzleOrm>()
  return { ...actual, eq: vi.fn(actual.eq), and: vi.fn(actual.and) }
})

import { eq, and } from 'drizzle-orm'
import { shareRoutes } from './share'

const eqSpy = vi.mocked(eq)
const andSpy = vi.mocked(and)

// The element tree built by share.ts's h() helper and handed to satori. The
// mock is declared with no params, so its inferred calls tuple is empty; read
// the captured arg through an unknown view to extract it without `any`.
function firstSatoriArg(): unknown {
  const calls = satoriMock.mock.calls as unknown as unknown[][]
  return calls[0]?.[0]
}

function makeApp() {
  const app = new Hono<AppEnv>()
  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()
    return c.json({ error: 'Internal server error' }, 500)
  })
  app.route('/', shareRoutes)
  return app
}

const SESSION_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const USER_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

// A long, specific analysis whose extractPullQuote picks the second sentence
// (the first is short; the "specific" finder needs 40<len<200, not "overall").
const ANALYSIS =
  'Good. Your binary search handles the empty array boundary correctly which many candidates miss entirely here.'

function sessionRow(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: SESSION_ID,
    status: 'completed',
    startedAt: '2026-06-20T10:00:00.000Z',
    completedAt: '2026-06-20T10:12:00.000Z',
    kataTitle: 'Binary Search',
    kataType: 'CODE',
    difficulty: 'MEDIUM',
    username: 'rodacato',
    avatarUrl: 'https://avatars/rodacato.png',
    verdict: 'passed',
    analysis: ANALYSIS,
    ownerRole: 'staff',
    ...overrides,
  }
}

function scrollRow(overrides: Record<string, unknown> = {}) {
  return {
    scrollId: 'scroll-1',
    scrollTitle: 'Python Basics',
    courseAccentColor: '#10B981',
    scrollLanguage: 'python',
    isPublic: true,
    totalSteps: 3,
    completedSteps: ['s1', 's2', 's3'],
    lastAccessedAt: new Date('2026-06-18T08:00:00.000Z'),
    username: 'rodacato',
    avatarUrl: 'https://avatars/rodacato.png',
    ...overrides,
  }
}

let fetchSpy: MockInstance<typeof fetch>

beforeEach(() => {
  vi.clearAllMocks()
  selectQueue.length = 0
  satoriMock.mockResolvedValue('<svg>card</svg>')
  resvgRender.mockReturnValue({ asPng: () => Buffer.from('PNGDATA') })
  // getFont() does a one-time module-level fetch; keep it offline + deterministic.
  fetchSpy = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(new ArrayBuffer(8)))
})

afterEach(() => {
  fetchSpy.mockRestore()
})

// ===========================================================================
// GET /share/:sessionId.png — OG card image
// ===========================================================================
describe('GET /share/:sessionId.png', () => {
  it('renders a 200 image/png with the long-cache header for an existing session', async () => {
    selectQueue.push([sessionRow()])
    const res = await makeApp().request(`/share/${SESSION_ID}.png`)

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    expect(Buffer.from(await res.arrayBuffer())).toEqual(Buffer.from('PNGDATA'))
    // The render pipeline actually ran (not short-circuited).
    expect(satoriMock).toHaveBeenCalledTimes(1)
    expect(resvgRender).toHaveBeenCalledTimes(1)

    // The element tree satori received carries the happy-path presentation:
    // verdict PASSED/#10B981, type #6366F1, diff #F59E0B, title, @user, 12min.
    const tree = JSON.stringify(firstSatoriArg())
    expect(tree).toContain('PASSED')
    expect(tree).toContain('#10B981') // passed verdict color
    expect(tree).toContain('#6366F1') // code type color
    expect(tree).toContain('#F59E0B') // medium difficulty color
    expect(tree).toContain('Binary Search') // kataTitle
    expect(tree).toContain('@rodacato')
    expect(tree).toContain('12min') // completionTime from startedAt→completedAt
  })

  it('strips the .png suffix before building the WHERE on sessions.id', async () => {
    selectQueue.push([sessionRow()])
    await makeApp().request(`/share/${SESSION_ID}.png`)
    // sessionId param must be the bare id, not "<id>.png".
    expect(eqSpy).toHaveBeenCalledWith('sessions.id', SESSION_ID)
  })

  it('returns 404 JSON when no session row matches', async () => {
    selectQueue.push([])
    const res = await makeApp().request(`/share/${SESSION_ID}.png`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Session not found' })
    expect(satoriMock).not.toHaveBeenCalled()
  })

  it('still renders a 200 image when the session has no verdict/analysis (needs_work fallback)', async () => {
    selectQueue.push([sessionRow({ verdict: null, analysis: null, completedAt: null })])
    const res = await makeApp().request(`/share/${SESSION_ID}.png`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
    expect(satoriMock).toHaveBeenCalledTimes(1)

    // The fallback element tree must carry the needs_work verdict + color and
    // omit the pull-quote node (analysis null) and the completion-time node
    // (completedAt null).
    const tree = JSON.stringify(firstSatoriArg())
    expect(tree).toContain('NEEDS WORK')
    expect(tree).toContain('#EF4444') // needs_work verdict color
    expect(tree).not.toContain('3px solid #334155') // pull-quote borderLeft
    expect(tree).not.toContain('min') // no completionTime node
  })

  it('surfaces 500 via onError when satori rendering throws', async () => {
    selectQueue.push([sessionRow()])
    satoriMock.mockRejectedValue(new Error('satori boom'))
    const res = await makeApp().request(`/share/${SESSION_ID}.png`)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
  })
})

// ===========================================================================
// GET /share/:sessionId — public share JSON
// ===========================================================================
describe('GET /share/:sessionId', () => {
  it('returns mapped share data with an extracted pull quote for a completed session', async () => {
    selectQueue.push([sessionRow()])
    const res = await makeApp().request(`/share/${SESSION_ID}`)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      sessionId: SESSION_ID,
      kataTitle: 'Binary Search',
      kataType: 'CODE',
      difficulty: 'MEDIUM',
      verdict: 'passed',
      pullQuote:
        'Your binary search handles the empty array boundary correctly which many candidates miss entirely here.',
      completionMinutes: 12,
      username: 'rodacato',
      avatarUrl: 'https://avatars/rodacato.png',
      ownerRole: 'staff',
    })
    expect(eqSpy).toHaveBeenCalledWith('sessions.id', SESSION_ID)
    // The image branch must not run here — no satori render for the JSON route.
    expect(satoriMock).not.toHaveBeenCalled()
  })

  it('falls back to needs_work and null pullQuote/completionMinutes when fields are absent', async () => {
    selectQueue.push([
      sessionRow({ verdict: null, analysis: null, completedAt: null }),
    ])
    const res = await makeApp().request(`/share/${SESSION_ID}`)
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.verdict).toBe('needs_work')
    expect(body.pullQuote).toBeNull()
    expect(body.completionMinutes).toBeNull()
  })

  it('returns 404 when the row is missing', async () => {
    selectQueue.push([])
    const res = await makeApp().request(`/share/${SESSION_ID}`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })

  it('returns 404 for an in-progress (not completed/failed) session — no leaking of live runs', async () => {
    selectQueue.push([sessionRow({ status: 'in_progress' })])
    const res = await makeApp().request(`/share/${SESSION_ID}`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })

  it('treats a failed session as shareable (distinct from in-progress)', async () => {
    selectQueue.push([sessionRow({ status: 'failed' })])
    const res = await makeApp().request(`/share/${SESSION_ID}`)
    expect(res.status).toBe(200)
    expect(((await res.json()) as { sessionId: string }).sessionId).toBe(SESSION_ID)
  })

  it('surfaces 500 via onError when the db query rejects', async () => {
    db.select.mockImplementationOnce(() => {
      throw new Error('db down')
    })
    const res = await makeApp().request(`/share/${SESSION_ID}`)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
  })
})

// ===========================================================================
// GET /share/scroll/:slug/:userId.png — scroll completion OG card
//
// BUG PINNED: the `/share/:sessionId{.+\.png$}` route registered first uses a
// `.+` regex that greedily matches across slashes, so it SHADOWS the scroll PNG
// route. `/share/scroll/python/<id>.png` is captured as sessionId
// "scroll/python/<id>" by the session handler, which queries `sessions`, finds
// nothing, and returns 404 "Session not found" — the scroll card is never
// rendered. These tests assert the real shipped behavior (not the intended
// behavior); if the route is later fixed they should flip and break loudly.
// ===========================================================================
describe('GET /share/scroll/:slug/:userId.png (shadowed by session png route)', () => {
  it('is captured by the session png handler and 404s as "Session not found"', async () => {
    selectQueue.push([]) // session lookup misses
    const res = await makeApp().request(`/share/scroll/python/${USER_ID}.png`)

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Session not found' })
    expect(satoriMock).not.toHaveBeenCalled()
    // It queried sessions with the slash-joined path minus the .png suffix.
    expect(eqSpy).toHaveBeenCalledWith('sessions.id', `scroll/python/${USER_ID}`)
  })
})

// ===========================================================================
// GET /share/scroll/:slug/:userId — scroll completion JSON
// ===========================================================================
describe('GET /share/scroll/:slug/:userId', () => {
  it('returns mapped completion JSON for a finished scroll', async () => {
    selectQueue.push([scrollRow()])
    const res = await makeApp().request(`/share/scroll/python/${USER_ID}`)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      scrollSlug: 'python',
      scrollTitle: 'Python Basics',
      scrollLanguage: 'python',
      scrollAccentColor: '#10B981',
      totalSteps: 3,
      completedAt: '2026-06-18T08:00:00.000Z',
      username: 'rodacato',
      avatarUrl: 'https://avatars/rodacato.png',
    })
    expect(satoriMock).not.toHaveBeenCalled()
    expect(eqSpy).toHaveBeenCalledWith('scrolls.slug', 'python')
    expect(eqSpy).toHaveBeenCalledWith('sp.userId', USER_ID)
  })

  it('returns 404 when the completion is missing', async () => {
    selectQueue.push([])
    const res = await makeApp().request(`/share/scroll/python/${USER_ID}`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })

  it('returns 404 when the user has progress but has not finished every step', async () => {
    selectQueue.push([scrollRow({ completedSteps: ['s1', 's2'], totalSteps: 3 })])
    const res = await makeApp().request(`/share/scroll/python/${USER_ID}`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })

  it('returns 404 when the scroll has zero steps (incomplete by definition)', async () => {
    selectQueue.push([scrollRow({ completedSteps: [], totalSteps: 0 })])
    const res = await makeApp().request(`/share/scroll/python/${USER_ID}`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })

  it('treats a non-array completedSteps column as empty (404, not a crash)', async () => {
    // Defensive branch: completedSteps may come back null/non-array from the db.
    selectQueue.push([scrollRow({ completedSteps: null, totalSteps: 3 })])
    const res = await makeApp().request(`/share/scroll/python/${USER_ID}`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })

  it('builds the WHERE/JOIN from the slug and userId params', async () => {
    selectQueue.push([scrollRow()])
    await makeApp().request(`/share/scroll/python/${USER_ID}`)
    expect(eqSpy).toHaveBeenCalledWith('scrolls.slug', 'python')
    expect(eqSpy).toHaveBeenCalledWith('sp.userId', USER_ID)
    expect(eqSpy).toHaveBeenCalledWith('sp.scrollId', 'scrolls.id')
    expect(andSpy).toHaveBeenCalled()
  })
})
