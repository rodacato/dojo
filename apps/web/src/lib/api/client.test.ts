import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request } from './client'
import { API_URL } from '../config'

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  const status = init.status ?? 200
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

interface FetchSpy {
  mock: { calls: Array<[input: RequestInfo | URL, init?: RequestInit] | undefined> }
}
function call(spy: FetchSpy, n = 0): [input: RequestInfo | URL, init?: RequestInit] {
  const c = spy.mock.calls[n]
  if (!c) throw new Error(`fetch was not called ${n + 1} time(s)`)
  return c
}

const u = (path: string) => `${API_URL}${path}`

// jsdom's location.href is a non-configurable accessor that vitest cannot spy.
// Swap window.location for an object that records href assignments instead.
function stubLocation(origin: string): { assignedHrefs: string[]; restore: () => void } {
  const original = window.location
  const assignedHrefs: string[] = []
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...original,
      origin,
      set href(value: string) {
        assignedHrefs.push(value)
      },
    },
  })
  return {
    assignedHrefs,
    restore: () =>
      Object.defineProperty(window, 'location', { configurable: true, value: original }),
  }
}

describe('request (client)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds the URL from API_URL + path and defaults to a JSON content type', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ ok: true }))

    await request('/dashboard')

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = call(fetchSpy)
    // API_URL is '' under test, so the path passes through verbatim.
    expect(url).toBe(u('/dashboard'))
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json',
    )
  })

  it('omits the Authorization header when no token is stored', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({}))

    await request('/dashboard')

    const init = call(fetchSpy)[1]
    expect((init?.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('attaches a bearer Authorization header when a token is stored', async () => {
    localStorage.setItem('dojo_token', 'tok.123')
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({}))

    await request('/dashboard')

    const init = call(fetchSpy)[1]
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      'Bearer tok.123',
    )
  })

  it('forwards method and body and merges caller headers', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({}))

    await request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ kataId: 'k1' }),
      headers: { 'X-Custom': 'yes' },
    })

    const init = call(fetchSpy)[1]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{"kataId":"k1"}')
    expect((init?.headers as Record<string, string>)['X-Custom']).toBe('yes')
  })

  it('parses and returns the JSON body on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
      jsonResponse({ value: 42, nested: { a: 1 } }),
    )

    const out = await request<{ value: number; nested: { a: number } }>('/x')
    expect(out).toEqual({ value: 42, nested: { a: 1 } })
  })

  it('throws ApiError carrying the status and body.error on a non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
      jsonResponse({ error: 'kata_not_found' }, { status: 404 }),
    )

    await expect(request('/katas/x')).rejects.toMatchObject({
      status: 404,
      message: 'kata_not_found',
    })
    await expect(request('/katas/x')).rejects.toBeInstanceOf(ApiError)
  })

  it('falls back to statusText when an error response has no JSON error field', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
      new Response('not json', { status: 500, statusText: 'Internal Server Error' }),
    )

    await expect(request('/x')).rejects.toMatchObject({
      status: 500,
      message: 'Internal Server Error',
    })
  })

  it('redirects and clears the token on 401 by default (redirectOnAuth on)', async () => {
    localStorage.setItem('dojo_token', 'expired')
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
      jsonResponse({ error: 'expired' }, { status: 401 }),
    )
    const loc = stubLocation('https://dojo.test')

    try {
      await expect(request('/dashboard')).rejects.toThrow('Unauthenticated')
      expect(localStorage.getItem('dojo_token')).toBeNull()
      expect(loc.assignedHrefs).toContain('https://dojo.test/?error=session_expired')
    } finally {
      loc.restore()
    }
  })

  it('throws ApiError(401) instead of redirecting when redirectOnAuth is false', async () => {
    localStorage.setItem('dojo_token', 'still-here')
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
      jsonResponse({ error: 'private_scroll' }, { status: 401 }),
    )
    const loc = stubLocation('https://dojo.test')

    try {
      await expect(request('/scrolls/x', { redirectOnAuth: false })).rejects.toMatchObject({
        status: 401,
        message: 'private_scroll',
      })
      expect(loc.assignedHrefs).toEqual([])
      // token must survive — no clearToken on a non-redirect 401
      expect(localStorage.getItem('dojo_token')).toBe('still-here')
    } finally {
      loc.restore()
    }
  })
})

describe('ApiError', () => {
  it('is an Error subclass exposing status and message', () => {
    const err = new ApiError(429, 'rate_limited')
    expect(err).toBeInstanceOf(Error)
    expect(err.status).toBe(429)
    expect(err.message).toBe('rate_limited')
  })
})
