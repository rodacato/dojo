import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { scrolls } from './scrolls'
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

// jsdom's location.href is a non-configurable accessor; swap the object to record assignments.
function stubLocation(): { assignedHrefs: string[]; restore: () => void } {
  const original = window.location
  const assignedHrefs: string[] = []
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...original,
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

describe('scrolls api client', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('getScrolls unwraps the { scrolls } envelope and disables auth redirect', async () => {
    const list = [{ slug: 'a' }, { slug: 'b' }]
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ scrolls: list }))

    const out = await scrolls.getScrolls()

    expect(call(fetchSpy, 0)[0]).toBe(u('/scrolls'))
    expect(out).toEqual(list)
  })

  it('getScrolls does NOT redirect on a 401 (anonymous catalog access)', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
      jsonResponse({ error: 'unauth' }, { status: 401 }),
    )
    const loc = stubLocation()

    try {
      await expect(scrolls.getScrolls()).rejects.toMatchObject({ status: 401 })
      expect(loc.assignedHrefs).toEqual([])
    } finally {
      loc.restore()
    }
  })

  it('getScroll unwraps the { scroll } envelope by slug', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ scroll: { slug: 'intro', title: 'Intro' } }))

    const out = await scrolls.getScroll('intro')

    expect(call(fetchSpy, 0)[0]).toBe(u('/scrolls/intro'))
    expect(out).toEqual({ slug: 'intro', title: 'Intro' })
  })

  it('executeStep POSTs the params verbatim', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ ok: true }))
    const params = { scrollSlug: 's', stepId: 'st', code: 'print(1)', language: 'py' }

    await scrolls.executeStep(params as never)

    const [url, init] = call(fetchSpy, 0)
    expect(url).toBe(u('/scrolls/execute'))
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual(params)
  })

  it('trackProgress omits anonymousSessionId when absent and includes it when present', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ ok: true }))

    await scrolls.trackProgress('sc1', 'sp1')
    expect(JSON.parse(call(fetchSpy, 0)[1]?.body as string)).toEqual({
      scrollId: 'sc1',
      stepId: 'sp1',
    })

    await scrolls.trackProgress('sc1', 'sp1', 'anon-9')
    expect(JSON.parse(call(fetchSpy, 1)[1]?.body as string)).toEqual({
      scrollId: 'sc1',
      stepId: 'sp1',
      anonymousSessionId: 'anon-9',
    })
  })

  it('getProgress URL-encodes the anonymous session id in the query', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({}))

    await scrolls.getProgress('sc1')
    expect(call(fetchSpy, 0)[0]).toBe(u('/scrolls/progress/sc1'))

    await scrolls.getProgress('sc1', 'a b/c')
    expect(call(fetchSpy, 1)[0]).toBe(u('/scrolls/progress/sc1?anonymousSessionId=a%20b%2Fc'))
  })

  it('getAllProgress unwraps { progress } and threads the anon id', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ progress: [{ scrollId: 'sc1', completed: 2 }] }))

    const out = await scrolls.getAllProgress('anon-1')

    expect(call(fetchSpy, 0)[0]).toBe(u('/scrolls/progress?anonymousSessionId=anon-1'))
    expect(out).toEqual([{ scrollId: 'sc1', completed: 2 }])
  })

  it('getStepSolution builds the nested step solution path with optional query', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({}))

    await scrolls.getStepSolution('intro', 'step-3', 'anon-2')
    expect(call(fetchSpy, 0)[0]).toBe(
      u('/scrolls/intro/steps/step-3/solution?anonymousSessionId=anon-2'),
    )
  })

  it('mergeAnonymousProgress POSTs the session id (auth redirect left on)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ ok: true }))

    await scrolls.mergeAnonymousProgress('anon-3')

    const [url, init] = call(fetchSpy, 0)
    expect(url).toBe(u('/scrolls/progress/merge'))
    expect(JSON.parse(init?.body as string)).toEqual({ anonymousSessionId: 'anon-3' })
  })

  describe('requestNudge', () => {
    const params = { scrollSlug: 's', stepId: 'st', userCode: 'x' }

    it('returns the nudge payload on success', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
        jsonResponse({ id: 'n1', nudge: 'try a loop', stepId: 'st' }),
      )

      const out = await scrolls.requestNudge(params)
      expect(out).toEqual({ id: 'n1', nudge: 'try a loop', stepId: 'st' })
    })

    it('swallows a 404 into { disabled: true } (feature flag off)', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
        jsonResponse({ error: 'not_found' }, { status: 404 }),
      )

      const out = await scrolls.requestNudge(params)
      expect(out).toEqual({ disabled: true })
    })

    it('re-throws non-404 errors instead of disabling', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
        jsonResponse({ error: 'server_error' }, { status: 500 }),
      )

      await expect(scrolls.requestNudge(params)).rejects.toMatchObject({ status: 500 })
    })
  })

  it('submitNudgeFeedback POSTs the up/down verdict to the feedback path', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ ok: true }))

    await scrolls.submitNudgeFeedback('n1', 'down')

    const [url, init] = call(fetchSpy, 0)
    expect(url).toBe(u('/scrolls/nudge/n1/feedback'))
    expect(JSON.parse(init?.body as string)).toEqual({ feedback: 'down' })
  })
})
