import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './client'
import { playground } from './playground'
import { API_URL } from '../config'

function jsonResponse(body: unknown, init: { status?: number; statusText?: string } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    statusText: init.statusText,
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

function sseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c))
      controller.close()
    },
  })
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

async function collect(gen: AsyncGenerator<string>): Promise<string[]> {
  const out: string[] = []
  for await (const c of gen) out.push(c)
  return out
}

describe('playground.run', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('POSTs the run payload to /engawa/run with credentials included', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
      jsonResponse({ stdout: 'hi', stderr: '', exitCode: 0, runtimeMs: 5, timedOut: false }),
    )

    const out = await playground.run({ language: 'python', version: '3.12', code: 'print(1)' })

    const [url, init] = call(fetchSpy, 0)
    expect(url).toBe(u('/engawa/run'))
    expect(init?.method).toBe('POST')
    expect(init?.credentials).toBe('include')
    expect(JSON.parse(init?.body as string)).toEqual({
      language: 'python',
      version: '3.12',
      code: 'print(1)',
    })
    expect(out.stdout).toBe('hi')
  })

  it('surfaces a non-ok run as an ApiError with status and server error message', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
      jsonResponse({ error: 'rate_limited' }, { status: 429 }),
    )

    await expect(
      playground.run({ language: 'python', version: '3.12', code: 'x' }),
    ).rejects.toMatchObject({ status: 429, message: 'rate_limited' })
  })
})

describe('playground.askSensei (SSE)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('POSTs JSON to /playground/ask with event-stream Accept and bearer auth', async () => {
    localStorage.setItem('dojo_token', 'tok')
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => sseResponse(['event: done\ndata:\n\n']))

    await collect(playground.askSensei({ question: 'why?', code: 'x', language: 'py' }))

    const [url, init] = call(fetchSpy, 0)
    expect(url).toBe(u('/playground/ask'))
    expect(init?.method).toBe('POST')
    const headers = init?.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers.Accept).toBe('text/event-stream')
    expect(headers.Authorization).toBe('Bearer tok')
    expect(JSON.parse(init?.body as string)).toEqual({
      question: 'why?',
      code: 'x',
      language: 'py',
    })
  })

  it('yields token chunks in order and returns on done', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
      sseResponse([
        'event: token\ndata: The \n\n',
        'event: token\ndata: answer\n\n',
        'event: done\ndata:\n\n',
        'event: token\ndata: leaked\n\n',
      ]),
    )

    const out = await collect(playground.askSensei({ question: 'q' }))
    expect(out).toEqual(['The ', 'answer'])
  })

  it('throws ApiError(500) with the error-event payload', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
      sseResponse(['event: error\ndata: quota_exceeded\n\n']),
    )

    await expect(collect(playground.askSensei({ question: 'q' }))).rejects.toMatchObject({
      status: 500,
      message: 'quota_exceeded',
    })
  })

  it('throws ApiError using the JSON error body when the response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
      jsonResponse({ error: 'sensei_unavailable' }, { status: 503 }),
    )

    const gen = playground.askSensei({ question: 'q' })
    await expect(collect(gen)).rejects.toBeInstanceOf(ApiError)
    await expect(collect(playground.askSensei({ question: 'q' }))).rejects.toMatchObject({
      status: 503,
      message: 'sensei_unavailable',
    })
  })

  it('falls back to statusText when the non-ok body is not JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => 
      new Response('<html>oops</html>', { status: 502, statusText: 'Bad Gateway' }),
    )

    await expect(collect(playground.askSensei({ question: 'q' }))).rejects.toMatchObject({
      status: 502,
      message: 'Bad Gateway',
    })
  })
})
