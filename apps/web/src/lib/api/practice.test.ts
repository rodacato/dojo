import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './client'
import { practice } from './practice'
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

// Builds a Response whose body streams the given chunks as a text/event-stream.
function sseResponse(chunks: string[], init: { status?: number } = {}): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c))
      controller.close()
    },
  })
  return new Response(stream, {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

async function collect(gen: AsyncGenerator<string>): Promise<string[]> {
  const out: string[] = []
  for await (const c of gen) out.push(c)
  return out
}

describe('practice api client', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('getDashboard issues a GET to /dashboard and returns the parsed body', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ streak: 3 }))

    const out = await practice.getDashboard()

    expect(call(fetchSpy, 0)[0]).toBe(u('/dashboard'))
    expect(out).toEqual({ streak: 3 })
  })

  it('getKatas only appends the params that are present', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse([]))

    await practice.getKatas({ mood: 'focused' })
    expect(call(fetchSpy, 0)[0]).toBe(u('/katas?mood=focused'))

    await practice.getKatas({ maxDuration: 15 })
    expect(call(fetchSpy, 1)[0]).toBe(u('/katas?maxDuration=15'))

    await practice.getKatas({ mood: 'calm', maxDuration: 30 })
    expect(call(fetchSpy, 2)[0]).toBe(u('/katas?mood=calm&maxDuration=30'))

    await practice.getKatas({})
    expect(call(fetchSpy, 3)[0]).toBe(u('/katas?'))
  })

  it('startSession POSTs the kataId as a JSON body', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ sessionId: 's1' }))

    await practice.startSession('kata-9')

    const [url, init] = call(fetchSpy, 0)
    expect(url).toBe(u('/sessions'))
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{"kataId":"kata-9"}')
  })

  it('getSession interpolates the id into the path', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ id: 's1' }))

    await practice.getSession('s1')
    expect(call(fetchSpy, 0)[0]).toBe(u('/sessions/s1'))
  })

  it('submitAttempt POSTs the user response to the attempts path', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ verdict: 'pass' }))

    await practice.submitAttempt('s1', 'my answer')

    const [url, init] = call(fetchSpy, 0)
    expect(url).toBe(u('/sessions/s1/attempts'))
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{"userResponse":"my answer"}')
  })

  it('retryEvaluation POSTs with no body to the retry path', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ verdict: 'pass' }))

    await practice.retryEvaluation('s1')

    const [url, init] = call(fetchSpy, 0)
    expect(url).toBe(u('/sessions/s1/retry-evaluation'))
    expect(init?.method).toBe('POST')
    expect(init?.body).toBeUndefined()
  })

  it('submitFeedback serializes the full feedback shape', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ ok: true }))

    await practice.submitFeedback('s1', {
      clarity: 'clear',
      timing: null,
      evaluation: 'fair',
      note: 'good',
    })

    const [url, init] = call(fetchSpy, 0)
    expect(url).toBe(u('/sessions/s1/feedback'))
    expect(JSON.parse(init?.body as string)).toEqual({
      clarity: 'clear',
      timing: null,
      evaluation: 'fair',
      note: 'good',
    })
  })

  it('getHistory defaults to page 1 and threads the page param', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ sessions: [], total: 0, page: 1, totalPages: 0 }))

    await practice.getHistory()
    expect(call(fetchSpy, 0)[0]).toBe(u('/history?page=1'))

    await practice.getHistory(4)
    expect(call(fetchSpy, 1)[0]).toBe(u('/history?page=4'))
  })

  describe('streamSessionBody (SSE)', () => {
    it('requests the body-stream path with an event-stream Accept header and bearer', async () => {
      localStorage.setItem('dojo_token', 'tok')
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async () => sseResponse(['event: done\ndata:\n\n']))

      await collect(practice.streamSessionBody('s1'))

      const [url, init] = call(fetchSpy, 0)
      expect(url).toBe(u('/sessions/s1/body-stream'))
      const headers = init?.headers as Record<string, string>
      expect(headers.Accept).toBe('text/event-stream')
      expect(headers.Authorization).toBe('Bearer tok')
    })

    it('yields the data of each token event in order and stops on done', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
        sseResponse([
          'event: token\ndata: Hello\n\n',
          'event: token\ndata:  world\n\n',
          'event: done\ndata:\n\n',
          'event: token\ndata: AFTER DONE\n\n',
        ]),
      )

      const out = await collect(practice.streamSessionBody('s1'))
      expect(out).toEqual(['Hello', ' world'])
    })

    it('joins multi-line data frames with newlines', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
        sseResponse(['event: token\ndata: line1\ndata: line2\n\n', 'event: done\ndata:\n\n']),
      )

      const out = await collect(practice.streamSessionBody('s1'))
      expect(out).toEqual(['line1\nline2'])
    })

    it('reassembles frames split across read chunks and tolerates CRLF', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
        sseResponse(['event: token\r\nda', 'ta: chunked\r\n', '\r\n', 'event: done\r\ndata:\r\n\r\n']),
      )

      const out = await collect(practice.streamSessionBody('s1'))
      expect(out).toEqual(['chunked'])
    })

    it('throws ApiError(500) when an error event arrives mid-stream', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
        sseResponse(['event: token\ndata: partial\n\n', 'event: error\ndata: quota_exceeded\n\n']),
      )

      const gen = practice.streamSessionBody('s1')
      await expect(collect(gen)).rejects.toMatchObject({
        status: 500,
        message: 'quota_exceeded',
      })
    })

    it('throws ApiError carrying the HTTP status when the stream response is not ok', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
        new Response(null, { status: 503, statusText: 'Service Unavailable' }),
      )

      const gen = practice.streamSessionBody('s1')
      await expect(collect(gen)).rejects.toBeInstanceOf(ApiError)
      await expect(collect(practice.streamSessionBody('s1'))).rejects.toMatchObject({
        status: 503,
      })
    })

    it('ignores comment lines and unknown events', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
        sseResponse([
          ': keep-alive\n\n',
          'event: ping\ndata: ignore-me\n\n',
          'event: token\ndata: real\n\n',
          'event: done\ndata:\n\n',
        ]),
      )

      const out = await collect(practice.streamSessionBody('s1'))
      expect(out).toEqual(['real'])
    })
  })
})
