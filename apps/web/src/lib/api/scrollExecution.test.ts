import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { scrollExecution } from './scrollExecution'
import { API_URL } from '../config'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const body = { language: 'ruby', files: [{ name: 'main.rb', content: 'puts 1' }] }

describe('scroll execution api client', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('reads the instance status', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ enabled: true }))
    await expect(scrollExecution.getScrollExecutionStatus()).resolves.toEqual({ enabled: true })
    expect(spy.mock.calls[0]?.[0]).toBe(`${API_URL}/scrolls/execution/status`)
  })

  it('POSTs the request to the scroll execute endpoint with the session token', async () => {
    localStorage.setItem('dojo_token', 'tok')
    const outcome = { kind: 'ok', exitCode: 0, stdout: '1\n', stderr: '', durationMs: 3 }
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse(outcome))

    await expect(scrollExecution.executeScrollCode('my scroll', body)).resolves.toEqual(outcome)

    const [url, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${API_URL}/scrolls/my%20scroll/execute`)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(body)
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer tok')
  })

  it('surfaces a 401 and a 429 as ApiErrors without clearing the token', async () => {
    localStorage.setItem('dojo_token', 'tok')
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ error: 'Session expired' }, 401))
    await expect(scrollExecution.executeScrollCode('s', body)).rejects.toMatchObject({ status: 401 })
    expect(localStorage.getItem('dojo_token')).toBe('tok')

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ error: 'rate_limited' }, 429))
    await expect(scrollExecution.executeScrollCode('s', body)).rejects.toMatchObject({ status: 429 })
  })
})
