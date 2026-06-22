import { afterEach, describe, expect, it, vi } from 'vitest'
import { profile } from './profile'
import { API_URL } from '../config'

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
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

describe('profile api client', () => {
  afterEach(() => vi.restoreAllMocks())

  it('getPublicProfile GETs the handle path and returns the parsed profile', async () => {
    const data = { username: 'rodacato', belt: 'black' }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse(data))

    const out = await profile.getPublicProfile('rodacato')

    expect(call(fetchSpy, 0)[0]).toBe(u('/u/rodacato'))
    expect(out).toEqual(data)
  })

  it('getBelts returns the { belt, milestones } payload', async () => {
    const payload = { belt: { name: 'white' }, milestones: [{ slug: 'first' }] }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse(payload))

    const out = await profile.getBelts()

    expect(call(fetchSpy, 0)[0]).toBe(u('/belts'))
    expect(out).toEqual(payload)
  })

  it('getPreferences returns the preferences object', async () => {
    const prefs = {
      reminderEnabled: true,
      reminderHour: 9,
      email: 'a@b.c',
      level: 'mid',
      interests: ['sql'],
      randomness: 0.3,
      goalWeeklyTarget: 5,
    }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse(prefs))

    const out = await profile.getPreferences()

    expect(call(fetchSpy, 0)[0]).toBe(u('/preferences'))
    expect(out).toEqual(prefs)
  })

  it('updatePreferences PUTs the prefs as the JSON body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ ok: true }))
    const prefs = { reminderEnabled: false, reminderHour: 20, interests: ['ruby'] }

    const out = await profile.updatePreferences(prefs)

    const [url, init] = call(fetchSpy, 0)
    expect(url).toBe(u('/preferences'))
    expect(init?.method).toBe('PUT')
    expect(JSON.parse(init?.body as string)).toEqual(prefs)
    expect(out).toEqual({ ok: true })
  })

  it('requestAccess POSTs the handle and reason', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ ok: true }))

    await profile.requestAccess('octocat', 'want in')

    const [url, init] = call(fetchSpy, 0)
    expect(url).toBe(u('/access-requests'))
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({ githubHandle: 'octocat', reason: 'want in' })
  })

  it('requestAccess omits reason when not given (undefined drops from JSON)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ ok: true }))

    await profile.requestAccess('octocat')

    const body = JSON.parse(call(fetchSpy, 0)[1]?.body as string)
    expect(body).toEqual({ githubHandle: 'octocat' })
    expect('reason' in body).toBe(false)
  })

  it('getRepoStats returns the stars/forks/language payload', async () => {
    const stats = { stars: 42, forks: 7, language: 'TypeScript' }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse(stats))

    const out = await profile.getRepoStats()

    expect(call(fetchSpy, 0)[0]).toBe(u('/landing/repo-stats'))
    expect(out).toEqual(stats)
  })
})
