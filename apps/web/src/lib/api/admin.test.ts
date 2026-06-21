import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { admin } from './admin'
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

describe('admin api client', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('getAdminKatas GETs /admin/katas and returns the parsed list', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse([{ id: 'k1' }]))

    const out = await admin.getAdminKatas()
    expect(call(fetchSpy, 0)[0]).toBe(u('/admin/katas'))
    expect(out).toEqual([{ id: 'k1' }])
  })

  it('getAdminKata interpolates the id', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ id: 'k1' }))
    await admin.getAdminKata('k1')
    expect(call(fetchSpy, 0)[0]).toBe(u('/admin/katas/k1'))
  })

  it('updateKata PUTs the payload to the kata path', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ ok: true }))
    const data = {
      title: 'T',
      description: 'D',
      duration: 10,
      difficulty: 'easy',
      type: 'concept',
      languages: ['py'],
      tags: ['t'],
      topics: ['x'],
      variations: [{ ownerRole: 'r', ownerContext: 'c' }],
    }

    await admin.updateKata('k1', data)

    const [url, init] = call(fetchSpy, 0)
    expect(url).toBe(u('/admin/katas/k1'))
    expect(init?.method).toBe('PUT')
    expect(JSON.parse(init?.body as string)).toEqual(data)
  })

  it('createKata POSTs to /admin/katas and returns the new id', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ id: 'new' }))

    const out = await admin.createKata({
      title: 'T',
      description: 'D',
      duration: 5,
      difficulty: 'easy',
      type: 'concept',
      languages: [],
      tags: [],
      topics: [],
      variations: [],
    })

    const [url, init] = call(fetchSpy, 0)
    expect(url).toBe(u('/admin/katas'))
    expect(init?.method).toBe('POST')
    expect(out).toEqual({ id: 'new' })
  })

  it('archiveKata POSTs to the archive sub-path', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ ok: true }))
    await admin.archiveKata('k1')
    const [url, init] = call(fetchSpy, 0)
    expect(url).toBe(u('/admin/katas/k1/archive'))
    expect(init?.method).toBe('POST')
  })

  it('updateScroll PATCHes only the provided patch fields', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ id: 'sc1', isPublic: true, status: 'published' }))

    await admin.updateScroll('sc1', { isPublic: true })

    const [url, init] = call(fetchSpy, 0)
    expect(url).toBe(u('/admin/scrolls/sc1'))
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(init?.body as string)).toEqual({ isPublic: true })
  })

  it('createInvitation POSTs the email (or undefined) and returns the invite', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
      jsonResponse({ id: 'i1', token: 't', url: 'u', expiresAt: 'e', emailSent: true }),
    )

    await admin.createInvitation('a@b.com')
    expect(call(fetchSpy, 0)[0]).toBe(u('/admin/invitations'))
    expect(JSON.parse(call(fetchSpy, 0)[1]?.body as string)).toEqual({ email: 'a@b.com' })

    await admin.createInvitation()
    expect(JSON.parse(call(fetchSpy, 1)[1]?.body as string)).toEqual({})
  })

  it('seedScrolls / wipeScrollContent / reprovisionPiston hit their POST endpoints', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ ok: true }))

    await admin.seedScrolls()
    await admin.wipeScrollContent('sc1')
    await admin.reprovisionPiston()

    expect(fetchSpy.mock.calls.map((c) => [c[0], c[1]?.method])).toEqual([
      [u('/admin/scrolls/seed'), 'POST'],
      [u('/admin/scrolls/sc1/wipe'), 'POST'],
      [u('/admin/piston/reprovision'), 'POST'],
    ])
  })

  describe('getErrors query building', () => {
    it('issues a bare path when no filters are passed', async () => {
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async () => jsonResponse({ total: 0, limit: 0, offset: 0, rows: [] }))

      await admin.getErrors()
      expect(call(fetchSpy, 0)[0]).toBe(u('/admin/errors'))
    })

    it('includes status=0 and offset=0 because it checks for undefined, not falsiness', async () => {
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async () => jsonResponse({ total: 0, limit: 0, offset: 0, rows: [] }))

      await admin.getErrors({ source: 'api', status: 0, limit: 50, offset: 0 })
      expect(call(fetchSpy, 0)[0]).toBe(
        u('/admin/errors?source=api&status=0&limit=50&offset=0'),
      )
    })
  })
})
