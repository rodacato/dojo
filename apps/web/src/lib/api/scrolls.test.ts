import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { scrolls } from './scrolls'
import { ApiError } from './client'
import { API_URL } from '../config'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

const manifest = {
  id: 'pattern-circuit',
  version: '0.1.0',
  protocol: 0 as const,
  entry: 'https://scrolls.example.com/',
  locales: ['en'],
  title: { en: 'Pattern Circuit' },
  description: { en: 'Patterns' },
  programmingLanguages: ['ruby'],
  units: [{ id: 'u1' }],
  capabilities: [],
}

function lastCall(spy: { mock: { calls: unknown[][] } }): [string, RequestInit] {
  const call = spy.mock.calls.at(-1)
  if (!call) throw new Error('fetch was not called')
  return [call[0] as string, (call[1] ?? {}) as RequestInit]
}

describe('scrolls api client', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('getScrolls GETs /scrolls', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse([{ id: 's1' }]))
    await expect(scrolls.getScrolls()).resolves.toEqual([{ id: 's1' }])
    expect(lastCall(spy)[0]).toBe(`${API_URL}/scrolls`)
  })

  it('getScroll encodes the slug', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ id: 's1' }))
    await scrolls.getScroll('a/b')
    expect(lastCall(spy)[0]).toBe(`${API_URL}/scrolls/a%2Fb`)
  })

  it('getScroll surfaces a 401 as an ApiError instead of redirecting', async () => {
    localStorage.setItem('dojo_token', 'stale')
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ error: 'login required' }, 401))
    await expect(scrolls.getScroll('private-one')).rejects.toMatchObject({ status: 401 })
    await expect(scrolls.getScroll('private-one')).rejects.toBeInstanceOf(ApiError)
    expect(localStorage.getItem('dojo_token')).toBe('stale')
  })

  it('getScroll surfaces a 404 as an ApiError', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ error: 'not found' }, 404))
    await expect(scrolls.getScroll('nope')).rejects.toMatchObject({ status: 404, message: 'not found' })
  })

  it('getAdminScrolls GETs /admin/scrolls', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse([]))
    await scrolls.getAdminScrolls()
    expect(lastCall(spy)[0]).toBe(`${API_URL}/admin/scrolls`)
  })

  it('registerScroll POSTs the input as JSON', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ id: 's1' }, 201))
    const input = { slug: 'pattern-circuit', manifest, status: 'draft' as const, visibility: 'public' as const }
    await scrolls.registerScroll(input)
    const [url, init] = lastCall(spy)
    expect(url).toBe(`${API_URL}/admin/scrolls`)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(input)
  })

  it('registerScroll surfaces the server rejection message', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ error: 'origin not allowed' }, 422))
    await expect(
      scrolls.registerScroll({ slug: 'x', manifest, status: 'draft', visibility: 'public' }),
    ).rejects.toMatchObject({ status: 422, message: 'origin not allowed' })
  })

  it('updateScroll PATCHes the id with the patch', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ id: 's1' }))
    await scrolls.updateScroll('s1', { status: 'published' })
    const [url, init] = lastCall(spy)
    expect(url).toBe(`${API_URL}/admin/scrolls/s1`)
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ status: 'published' })
  })

  it('deleteScroll DELETEs and resolves on 204', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(null, { status: 204 }))
    await expect(scrolls.deleteScroll('s1')).resolves.toBeUndefined()
    const [url, init] = lastCall(spy)
    expect(url).toBe(`${API_URL}/admin/scrolls/s1`)
    expect(init.method).toBe('DELETE')
  })
})
