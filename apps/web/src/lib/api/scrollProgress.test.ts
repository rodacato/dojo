import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { scrollProgress } from './scrollProgress'
import { ApiError } from './client'
import { API_URL } from '../config'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function lastCall(spy: { mock: { calls: unknown[][] } }): [string, RequestInit & { headers: Record<string, string> }] {
  const call = spy.mock.calls.at(-1)
  if (!call) throw new Error('fetch was not called')
  return [call[0] as string, call[1] as RequestInit & { headers: Record<string, string> }]
}

describe('scroll progress api client', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('reads progress for an anonymous visitor with the anonymous id header', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => json({ userRef: 'r' }))
    await scrollProgress.getScrollProgress('pattern circuit', 'anon-1')

    const [url, init] = lastCall(spy)
    expect(url).toBe(`${API_URL}/scrolls/pattern%20circuit/progress`)
    expect(init.headers['X-Anonymous-Id']).toBe('anon-1')
  })

  it('sends no anonymous id for a signed-in user', async () => {
    localStorage.setItem('dojo_token', 'tok')
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => json({ userRef: 'r' }))
    await scrollProgress.getScrollProgress('pc', null)
    expect(lastCall(spy)[1].headers['X-Anonymous-Id']).toBeUndefined()
  })

  it('posts the report as JSON', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => json({ userRef: 'r' }))
    await scrollProgress.recordScrollProgress('pc', { type: 'complete', unitId: 'u1' }, null)

    const [url, init] = lastCall(spy)
    expect(url).toBe(`${API_URL}/scrolls/pc/progress`)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ type: 'complete', unitId: 'u1' })
  })

  it('posts the merge with the anonymous id and accepts an empty answer', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(null, { status: 204 }))
    await expect(scrollProgress.mergeScrollProgress('anon-1')).resolves.toBeUndefined()

    const [url, init] = lastCall(spy)
    expect(url).toBe(`${API_URL}/scrolls/progress/merge`)
    expect(init.headers['X-Anonymous-Id']).toBe('anon-1')
  })

  it('throws ApiError on a rejection', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => json({ error: 'nope' }, 422))
    await expect(scrollProgress.getScrollProgress('pc', null)).rejects.toMatchObject(new ApiError(422, 'nope'))
  })
})
