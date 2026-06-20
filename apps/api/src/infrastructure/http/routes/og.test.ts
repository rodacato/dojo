import { describe, expect, it, vi, beforeEach } from 'vitest'

// vi.hoisted runs before the mock factories so they can close over these
// bindings without "Cannot access X before initialization".
const { db, selectQueue, findFirst } = vi.hoisted(() => {
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

  const findFirst = vi.fn()

  return {
    selectQueue,
    findFirst,
    db: {
      select: vi.fn(() => chainable(selectQueue.shift() ?? [])),
      query: {
        users: { findFirst },
      },
    },
  }
})

vi.mock('../../persistence/drizzle/client', () => ({ db }))

vi.mock('../../persistence/drizzle/schema', () => ({
  sessions: {},
  katas: {},
  attempts: {},
  users: {},
}))

// Import AFTER the mocks so the route grabs the mocked deps.
import { ogRoutes } from './og'
import { Hono } from 'hono'

const WEB_URL = 'http://localhost:5173'
const CRAWLER_UA = 'facebookexternalhit/1.1'
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'

function makeApp() {
  const app = new Hono()
  app.route('/', ogRoutes)
  return app
}

beforeEach(() => {
  vi.clearAllMocks()
  selectQueue.length = 0
  findFirst.mockReset()
})

describe('GET /og/kata/:sessionId', () => {
  it('redirects a normal browser straight to the result page (no DB hit)', async () => {
    const app = makeApp()
    const res = await app.request('/og/kata/sess-1', {
      headers: { 'user-agent': BROWSER_UA },
    })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(`${WEB_URL}/kata/sess-1/result`)
    expect(db.select).not.toHaveBeenCalled()
  })

  it('redirects when no user-agent header is present (treated as non-crawler)', async () => {
    const app = makeApp()
    const res = await app.request('/og/kata/sess-2')

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(`${WEB_URL}/kata/sess-2/result`)
    expect(db.select).not.toHaveBeenCalled()
  })

  it('redirects a crawler to the result page when the session is not found', async () => {
    selectQueue.push([]) // empty result → no row
    const app = makeApp()
    const res = await app.request('/og/kata/missing', {
      headers: { 'user-agent': CRAWLER_UA },
    })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(`${WEB_URL}/kata/missing/result`)
    expect(db.select).toHaveBeenCalledTimes(1)
  })

  it('returns OG HTML with verdict/title/image for a crawler when the session exists', async () => {
    selectQueue.push([
      {
        kataTitle: 'Binary Search',
        kataType: 'CODE',
        username: 'rodacato',
        verdict: 'PASSED_WITH_NOTES',
      },
    ])
    const app = makeApp()
    const res = await app.request('/og/kata/sess-7', {
      headers: { 'user-agent': CRAWLER_UA },
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')

    const html = await res.text()
    // verdict underscores replaced with spaces in the title
    expect(html).toContain('<title>PASSED WITH NOTES — Binary Search | dojo_</title>')
    expect(html).toContain(
      '<meta property="og:title" content="PASSED WITH NOTES — Binary Search | dojo_">',
    )
    expect(html).toContain(
      '<meta property="og:description" content="@rodacato completed a CODE kata in the dojo.">',
    )
    expect(html).toContain(`<meta property="og:url" content="${WEB_URL}/kata/sess-7/result">`)
    // image meta is emitted because image is set
    expect(html).toContain('/share/sess-7.png">')
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">')
  })

  it('falls back to COMPLETED when the session has no verdict', async () => {
    selectQueue.push([
      {
        kataTitle: 'Two Sum',
        kataType: 'CONCEPT',
        username: 'neo',
        verdict: null,
      },
    ])
    const app = makeApp()
    const res = await app.request('/og/kata/sess-9', {
      headers: { 'user-agent': CRAWLER_UA },
    })

    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('<title>COMPLETED — Two Sum | dojo_</title>')
  })

  it('escapes HTML-unsafe characters in the kata title and username', async () => {
    selectQueue.push([
      {
        kataTitle: 'A <b>"&" </b> kata',
        kataType: 'CODE',
        username: 'a&b',
        verdict: null,
      },
    ])
    const app = makeApp()
    const res = await app.request('/og/kata/sess-x', {
      headers: { 'user-agent': CRAWLER_UA },
    })

    const html = await res.text()
    expect(html).toContain('&lt;b&gt;&quot;&amp;&quot; &lt;/b&gt;')
    expect(html).not.toContain('<b>"&"')
  })
})

describe('GET /og/u/:username', () => {
  it('redirects a normal browser straight to the profile page (no DB hit)', async () => {
    const app = makeApp()
    const res = await app.request('/og/u/rodacato', {
      headers: { 'user-agent': BROWSER_UA },
    })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(`${WEB_URL}/u/rodacato`)
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('redirects a crawler to the profile page when the user is not found', async () => {
    findFirst.mockResolvedValue(undefined)
    const app = makeApp()
    const res = await app.request('/og/u/ghost', {
      headers: { 'user-agent': CRAWLER_UA },
    })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(`${WEB_URL}/u/ghost`)
    expect(findFirst).toHaveBeenCalledTimes(1)
  })

  it('returns OG HTML for a crawler when the user exists (no image meta)', async () => {
    findFirst.mockResolvedValue({ username: 'rodacato' })
    const app = makeApp()
    const res = await app.request('/og/u/rodacato', {
      headers: { 'user-agent': CRAWLER_UA },
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')

    const html = await res.text()
    expect(html).toContain('<title>@rodacato | dojo_</title>')
    expect(html).toContain('<meta property="og:title" content="@rodacato | dojo_">')
    expect(html).toContain(`<meta property="og:url" content="${WEB_URL}/u/rodacato">`)
    // profile OG has no image → twitter:card image meta must be absent
    expect(html).not.toContain('og:image')
    expect(html).not.toContain('twitter:card')
  })
})
