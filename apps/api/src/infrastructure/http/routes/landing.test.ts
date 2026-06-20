import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'

const REPO_URL = 'https://api.github.com/repos/rodacato/dojo'

function githubBody(over: Record<string, unknown> = {}) {
  return {
    stargazers_count: 128,
    forks_count: 17,
    language: 'TypeScript',
    ...over,
  }
}

function okResponse(body: Record<string, unknown>) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response
}

function errorResponse(status: number) {
  return {
    ok: false,
    status,
    json: async () => ({}),
  } as unknown as Response
}

// The route caches at module scope (cache + inflight) and hits global fetch.
// Reset the module registry before each test so every test starts with an empty
// cache, then re-import landingRoutes and mount it on a bare Hono app — the same
// isolated-mount idiom as dashboard.test.ts. Mounting bare (instead of going
// through createRouter) avoids the global rate-limiter/CORS middleware, which
// strips the route's Cache-Control header and would mask the real behavior.
async function loadApp() {
  const { landingRoutes } = await import('./landing')
  const app = new Hono()
  app.route('/', landingRoutes)
  return app
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetModules()
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GET /landing/repo-stats', () => {
  it('returns upstream stats with a public cache header on success', async () => {
    fetchMock.mockResolvedValueOnce(okResponse(githubBody()))

    const app = await loadApp()
    const res = await app.request('/landing/repo-stats')

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=600')
    expect(await res.json()).toEqual({ stars: 128, forks: 17, language: 'TypeScript' })
  })

  it('requests the dojo repo from the GitHub API with the json accept header', async () => {
    fetchMock.mockResolvedValueOnce(okResponse(githubBody()))

    const app = await loadApp()
    await app.request('/landing/repo-stats')

    expect(fetchMock).toHaveBeenCalledWith(REPO_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    })
  })

  it('coerces stargazers_count / forks_count to numbers and trusts language', async () => {
    fetchMock.mockResolvedValueOnce(
      okResponse(githubBody({ stargazers_count: '42', forks_count: '9', language: 'Rust' })),
    )

    const app = await loadApp()
    const res = await app.request('/landing/repo-stats')
    const body = (await res.json()) as { stars: number; forks: number; language: string }

    expect(body).toEqual({ stars: 42, forks: 9, language: 'Rust' })
    expect(typeof body.stars).toBe('number')
    expect(typeof body.forks).toBe('number')
  })

  it('defaults missing fields (0 stars, 0 forks, TypeScript language)', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({}))

    const app = await loadApp()
    const res = await app.request('/landing/repo-stats')

    expect(await res.json()).toEqual({ stars: 0, forks: 0, language: 'TypeScript' })
  })

  it('returns the fallback shape with status 200 when GitHub responds non-ok', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(503))

    const app = await loadApp()
    const res = await app.request('/landing/repo-stats')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ stars: 0, forks: 0, language: 'TypeScript' })
    // Fallback path must NOT set the public cache header (it only fires on success).
    expect(res.headers.get('Cache-Control')).toBeNull()
  })

  it('returns the fallback shape when fetch itself rejects', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'))

    const app = await loadApp()
    const res = await app.request('/landing/repo-stats')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ stars: 0, forks: 0, language: 'TypeScript' })
    // Fallback path must NOT set the public cache header (it only fires on success).
    expect(res.headers.get('Cache-Control')).toBeNull()
  })

  it('serves the cached value on the second call without re-fetching upstream', async () => {
    fetchMock.mockResolvedValueOnce(okResponse(githubBody({ stargazers_count: 200 })))

    const app = await loadApp()
    const first = await app.request('/landing/repo-stats')
    expect((await first.json()) as unknown).toMatchObject({ stars: 200 })

    const second = await app.request('/landing/repo-stats')
    expect((await second.json()) as unknown).toMatchObject({ stars: 200 })

    // Cache hit inside the TTL window — upstream is hit exactly once.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('coalesces concurrent requests into a single upstream fetch (inflight)', async () => {
    let resolveUpstream: (r: Response) => void = () => undefined
    const upstream = new Promise<Response>((resolve) => {
      resolveUpstream = resolve
    })
    fetchMock.mockReturnValueOnce(upstream)

    const app = await loadApp()
    const p1 = app.request('/landing/repo-stats')
    const p2 = app.request('/landing/repo-stats')

    // Let both handlers reach getRepoStats and share the single inflight promise
    // before the upstream resolves.
    await Promise.resolve()
    resolveUpstream(okResponse(githubBody({ stargazers_count: 5 })))

    const [r1, r2] = await Promise.all([p1, p2])
    expect((await r1.json()) as unknown).toMatchObject({ stars: 5 })
    expect((await r2.json()) as unknown).toMatchObject({ stars: 5 })

    // Both requests share the single inflight promise.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('serves stale cache when a refetch fails after the TTL has elapsed', async () => {
    // Drive Date.now past the 10-minute TTL so the freshness guard lets a
    // second request fall through to a new upstream fetch.
    const t0 = 1_000_000
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(t0)

    // First call primes the cache with good data.
    fetchMock.mockResolvedValueOnce(okResponse(githubBody({ stargazers_count: 77 })))
    const app = await loadApp()
    const primed = await app.request('/landing/repo-stats')
    expect((await primed.json()) as unknown).toMatchObject({ stars: 77 })

    // Advance beyond TTL (10 min) and make the refetch fail. The catch in
    // getRepoStats should return the stale cached value rather than throwing.
    nowSpy.mockReturnValue(t0 + 11 * 60 * 1000)
    fetchMock.mockRejectedValueOnce(new Error('upstream flaked'))

    const stale = await app.request('/landing/repo-stats')
    expect(stale.status).toBe(200)
    expect((await stale.json()) as unknown).toMatchObject({ stars: 77 })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    nowSpy.mockRestore()
  })

  it('refreshes the cache when the TTL has elapsed and the refetch succeeds', async () => {
    const t0 = 2_000_000
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(t0)

    fetchMock.mockResolvedValueOnce(okResponse(githubBody({ stargazers_count: 1 })))
    const app = await loadApp()
    const first = await app.request('/landing/repo-stats')
    expect((await first.json()) as unknown).toMatchObject({ stars: 1 })

    nowSpy.mockReturnValue(t0 + 11 * 60 * 1000)
    fetchMock.mockResolvedValueOnce(okResponse(githubBody({ stargazers_count: 999 })))

    const refreshed = await app.request('/landing/repo-stats')
    expect((await refreshed.json()) as unknown).toMatchObject({ stars: 999 })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    nowSpy.mockRestore()
  })
})
