import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import type { ConversationTurn } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'

// ---------------------------------------------------------------------------
// Only the genuine external boundaries are mocked: global `fetch` (the HTTP
// call to the OpenAI-compatible provider) and `config` (so LLM_STREAM can be
// toggled per-test). The SSE parser AND the EvaluationStreamParser stay REAL —
// this suite exercises the actual chunk-buffering, [DONE] handling, malformed
// skipping and <evaluation> JSON extraction end-to-end.
// ---------------------------------------------------------------------------

const { mockConfig } = vi.hoisted(() => ({
  mockConfig: {
    LLM_STREAM: true,
    LLM_MODEL: 'test-model',
  },
}))

vi.mock('../../config', () => ({ config: mockConfig }))

import { OpenAIStreamAdapter } from './OpenAIStreamAdapter'
import { LLMParseError } from './AnthropicStreamAdapter'
import { LLMHttpError } from './llm-endpoint'

// A complete, valid model output: a bit of prose then the <evaluation> block.
const VALID_EVALUATION = JSON.stringify({
  verdict: 'passed_with_notes',
  analysis: 'Solid approach. You handled the empty case but missed the overflow guard.',
  topicsToReview: ['integer overflow', 'binary search invariants'],
  followUpQuestion: 'How would you guard against overflow on the midpoint?',
  isFinalEvaluation: false,
})

const FULL_OUTPUT = `Nice work so far.<evaluation>${VALID_EVALUATION}</evaluation>`

function sseLine(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`
}

// One OpenAI delta chunk carrying `content`.
function deltaChunk(content: string): unknown {
  return { choices: [{ index: 0, delta: { content }, finish_reason: null }] }
}

// Build a ReadableStream<Uint8Array> from arbitrary raw string segments. The
// SEGMENTS are emitted as separate reader.read() values, so callers control
// exactly where the byte boundaries fall (to exercise split-across-chunks).
function streamFromSegments(segments: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let i = 0
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i < segments.length) {
        controller.enqueue(encoder.encode(segments[i++]))
      } else {
        controller.close()
      }
    },
  })
}

function okStream(segments: string[]): Response {
  return new Response(streamFromSegments(segments), { status: 200 })
}

// Turn the full model output into N SSE `data:` chunks, splitting the text into
// `pieces` content deltas, terminated by [DONE].
function sseResponse(text: string, pieces = 1): Response {
  const step = Math.ceil(text.length / pieces)
  const segments: string[] = []
  for (let p = 0; p < text.length; p += step) {
    segments.push(sseLine(deltaChunk(text.slice(p, p + step))))
  }
  segments.push('data: [DONE]\n\n')
  return okStream(segments)
}

let fetchSpy: MockInstance<typeof fetch>

beforeEach(() => {
  mockConfig.LLM_STREAM = true
  mockConfig.LLM_MODEL = 'test-model'
  fetchSpy = vi.spyOn(globalThis, 'fetch')
})

afterEach(() => {
  fetchSpy.mockRestore()
})

async function collect(adapter: OpenAIStreamAdapter, history: ConversationTurn[] = []): Promise<EvaluationToken[]> {
  const tokens: EvaluationToken[] = []
  for await (const t of adapter.evaluate({
    ownerRole: 'staff',
    ownerContext: 'ctx',
    kataTitle: 'Binary Search',
    sessionBody: 'Implement binary search.',
    userResponse: 'I loop with lo/hi pointers.',
    history,
  })) {
    tokens.push(t)
  }
  return tokens
}

function adapter(): OpenAIStreamAdapter {
  return new OpenAIStreamAdapter('test-key', 'http://llm.local/')
}

describe('OpenAIStreamAdapter.evaluate (streaming)', () => {
  it('assembles SSE deltas into prose tokens and a final parsed evaluation result', async () => {
    fetchSpy.mockResolvedValue(sseResponse(FULL_OUTPUT, 1))

    const tokens = await collect(adapter())

    // Prose before the <evaluation> tag is forwarded; the eval block is not.
    const prose = tokens.filter((t) => !t.isFinal).map((t) => t.chunk).join('')
    expect(prose).toBe('Nice work so far.')

    const final = tokens.at(-1)!
    expect(final.isFinal).toBe(true)
    expect(final.chunk).toBe('')
    expect(final.result).toEqual({
      verdict: 'passed_with_notes',
      analysis: 'Solid approach. You handled the empty case but missed the overflow guard.',
      topicsToReview: ['integer overflow', 'binary search invariants'],
      followUpQuestion: 'How would you guard against overflow on the midpoint?',
      isFinalEvaluation: false,
    })
  })

  it('reassembles prose and evaluation JSON spread across many SSE delta chunks', async () => {
    // Deliberate boundaries: prose is split, the <evaluation> tag is split across
    // two deltas, and the JSON body is split mid-object.
    const half = Math.floor(VALID_EVALUATION.length / 2)
    const segments = [
      sseLine(deltaChunk('Nice ')),
      sseLine(deltaChunk('work so far.<eval')),
      sseLine(deltaChunk(`uation>${VALID_EVALUATION.slice(0, half)}`)),
      sseLine(deltaChunk(`${VALID_EVALUATION.slice(half)}</evaluation>`)),
      'data: [DONE]\n\n',
    ]
    fetchSpy.mockResolvedValue(okStream(segments))

    const tokens = await collect(adapter())

    const prose = tokens.filter((t) => !t.isFinal).map((t) => t.chunk).join('')
    expect(prose).toBe('Nice work so far.')
    expect(tokens.at(-1)!.result?.verdict).toBe('passed_with_notes')
    expect(tokens.at(-1)!.result?.analysis).toContain('overflow guard')
  })

  it('handles a single JSON object split across two raw network reads (SSE line boundary mid-object)', async () => {
    // The `data: {...}` line is delivered in two reader.read() values; the SSE
    // parser buffers the partial line until the newline arrives.
    const line = sseLine(deltaChunk(FULL_OUTPUT))
    const cut = Math.floor(line.length / 2)
    fetchSpy.mockResolvedValue(okStream([line.slice(0, cut), line.slice(cut), 'data: [DONE]\n\n']))

    const tokens = await collect(adapter())

    const prose = tokens.filter((t) => !t.isFinal).map((t) => t.chunk).join('')
    expect(prose).toBe('Nice work so far.')
    expect(tokens.at(-1)!.result?.verdict).toBe('passed_with_notes')
  })

  it('skips malformed and empty SSE data lines without aborting the stream', async () => {
    fetchSpy.mockResolvedValue(
      okStream([
        'data: not-json\n\n',
        'data: {bad json}\n\n',
        '\n',
        ': comment line\n',
        sseLine(deltaChunk(FULL_OUTPUT)),
        'data: [DONE]\n\n',
      ]),
    )

    const tokens = await collect(adapter())

    expect(tokens.filter((t) => !t.isFinal).map((t) => t.chunk).join('')).toBe('Nice work so far.')
    expect(tokens.at(-1)!.result?.verdict).toBe('passed_with_notes')
  })

  it('stops reading the stream at [DONE] — bytes after the terminator are never pulled', async () => {
    // The stream throws if pulled past [DONE]. The adapter must return from the
    // SSE loop on [DONE]; if it kept reading, the next pull would throw and the
    // evaluation would never finalize. This pins the `return` on [DONE], which a
    // post-[DONE] data chunk can't pin (the parser ignores trailing content).
    const encoder = new TextEncoder()
    const before = [sseLine(deltaChunk(FULL_OUTPUT)), 'data: [DONE]\n\n']
    let i = 0
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (i < before.length) {
          controller.enqueue(encoder.encode(before[i++]))
        } else {
          controller.error(new Error('stream pulled past [DONE]'))
        }
      },
    })
    fetchSpy.mockResolvedValue(new Response(stream, { status: 200 }))

    const tokens = await collect(adapter())

    expect(tokens.at(-1)!.result?.verdict).toBe('passed_with_notes')
  })

  it('throws LLMParseError when the stream ends without an <evaluation> block', async () => {
    fetchSpy.mockResolvedValue(sseResponse('Just prose, no verdict block here.', 1))

    await expect(collect(adapter())).rejects.toBeInstanceOf(LLMParseError)
  })

  it('throws LLMParseError when the evaluation JSON has an invalid verdict', async () => {
    const bad = `<evaluation>${JSON.stringify({
      verdict: 'definitely_passed',
      analysis: 'x',
      topicsToReview: [],
      followUpQuestion: null,
      isFinalEvaluation: false,
    })}</evaluation>`
    fetchSpy.mockResolvedValue(sseResponse(bad, 1))

    await expect(collect(adapter())).rejects.toBeInstanceOf(LLMParseError)
  })

  it('throws (not LLMParseError) on a non-200 response, surfacing the status and body', async () => {
    fetchSpy.mockResolvedValue(new Response('upstream exploded', { status: 502 }))

    await expect(collect(adapter())).rejects.toThrow(/502.*upstream exploded/s)
  })

  it('reads the message out of an OpenAI-shaped error body and keeps the status on the error', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'queue is full', type: 'rate_limit_error' } }), {
        status: 429,
      }),
    )

    const err = await collect(adapter()).catch((e: unknown) => e)

    expect(err).toBeInstanceOf(LLMHttpError)
    expect(err).toMatchObject({ status: 429, message: 'OpenAI-compatible API error 429: queue is full' })
  })

  it('surfaces an error event sent inside the stream instead of finishing as if complete', async () => {
    fetchSpy.mockResolvedValue(
      okStream([sseLine(deltaChunk('Nice work')), sseLine({ error: { message: 'cli killed' } })]),
    )

    await expect(collect(adapter())).rejects.toThrow('stream error: cli killed')
  })

  it('fails a stream that is cut before [DONE] even when a full verdict already arrived', async () => {
    fetchSpy.mockResolvedValue(okStream([sseLine(deltaChunk(FULL_OUTPUT))]))

    await expect(collect(adapter())).rejects.toThrow('ended before [DONE]')
  })

  it('bounds every request with a timeout signal', async () => {
    fetchSpy.mockResolvedValue(sseResponse(FULL_OUTPUT, 1))

    await collect(adapter())

    const init = fetchSpy.mock.calls[0]![1] as RequestInit
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('does not double /v1 when the base URL already ends with it', async () => {
    fetchSpy.mockResolvedValue(sseResponse(FULL_OUTPUT, 1))

    await collect(new OpenAIStreamAdapter('test-key', 'http://llm.local/v1/'))

    expect(fetchSpy.mock.calls[0]![0]).toBe('http://llm.local/v1/chat/completions')
  })

  it('POSTs to the configured baseURL with the model, stream flag and bearer auth', async () => {
    fetchSpy.mockResolvedValue(sseResponse(FULL_OUTPUT, 1))

    await collect(adapter())

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    // Trailing slash on the baseURL is normalized away by the constructor.
    expect(url).toBe('http://llm.local/v1/chat/completions')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key')
    const body = JSON.parse(init.body as string)
    expect(body.model).toBe('test-model')
    expect(body.stream).toBe(true)
    expect(body.messages[0].role).toBe('user')
  })
})

describe('OpenAIStreamAdapter.evaluate (non-streaming)', () => {
  beforeEach(() => {
    mockConfig.LLM_STREAM = false
  })

  it('parses a single non-streamed JSON response into the final evaluation', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: FULL_OUTPUT } }] }), {
        status: 200,
      }),
    )

    const tokens = await collect(adapter())

    expect(tokens.filter((t) => !t.isFinal).map((t) => t.chunk).join('')).toBe('Nice work so far.')
    expect(tokens.at(-1)!.result?.verdict).toBe('passed_with_notes')
    // Non-stream path must NOT request stream:true.
    const body = JSON.parse((fetchSpy.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.stream).toBeUndefined()
  })

  it('throws LLMParseError when the non-streamed content has no evaluation block', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'plain prose' } }] }), {
        status: 200,
      }),
    )

    await expect(collect(adapter())).rejects.toBeInstanceOf(LLMParseError)
  })
})

function jsonResponse(content: string | null, status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status })
}

const SESSION_PARAMS = { ownerRole: 'staff', ownerContext: 'ctx', kataDescription: 'Review a caching PR' }

async function drain(stream: AsyncIterable<string>): Promise<string> {
  let text = ''
  for await (const c of stream) text += c
  return text
}

describe('OpenAIStreamAdapter.generateSessionBody / nudge', () => {
  it('returns the message content and sends a bounded non-streaming request', async () => {
    fetchSpy.mockResolvedValue(jsonResponse('## PR body'))

    expect(await adapter().generateSessionBody(SESSION_PARAMS)).toBe('## PR body')

    const body = JSON.parse((fetchSpy.mock.calls[0]![1] as RequestInit).body as string)
    expect(body).toMatchObject({ model: 'test-model', max_tokens: 1024 })
    expect(body.stream).toBeUndefined()
  })

  it('rejects an empty completion instead of returning an empty session body', async () => {
    fetchSpy.mockResolvedValue(jsonResponse(null))

    await expect(adapter().generateSessionBody(SESSION_PARAMS)).rejects.toThrow('Unexpected response')
  })

  it('propagates the upstream status when generation is refused', async () => {
    fetchSpy.mockResolvedValue(new Response('{"error":{"message":"not logged in"}}', { status: 503 }))

    await expect(adapter().generateSessionBody(SESSION_PARAMS)).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining('not logged in'),
    })
  })

  it('trims the nudge text', async () => {
    fetchSpy.mockResolvedValue(jsonResponse('  look at the call to reduce \n'))

    const out = await adapter().nudge({ stepInstruction: 'sum', testCode: null, userCode: 'a.reduce' })

    expect(out).toBe('look at the call to reduce')
  })
})

describe('OpenAIStreamAdapter.generateSessionBodyStream', () => {
  it('yields each content delta in order', async () => {
    fetchSpy.mockResolvedValue(sseResponse('## PR body, streamed', 4))

    expect(await drain(adapter().generateSessionBodyStream(SESSION_PARAMS))).toBe('## PR body, streamed')
  })

  it('throws when the stream is cut, so a truncated body is never persisted as complete', async () => {
    fetchSpy.mockResolvedValue(okStream([sseLine(deltaChunk('## PR bo'))]))

    await expect(drain(adapter().generateSessionBodyStream(SESSION_PARAMS))).rejects.toThrow(
      'ended before [DONE]',
    )
  })
})

describe('OpenAIStreamAdapter.askSensei', () => {
  const ASK = { question: 'What is idempotency?' }

  it('streams the answer and resolves usage from the final chunk', async () => {
    fetchSpy.mockResolvedValue(
      okStream([
        sseLine(deltaChunk('An operation ')),
        sseLine(deltaChunk('safe to repeat.')),
        sseLine({ choices: [], usage: { prompt_tokens: 183, completion_tokens: 17 } }),
        'data: [DONE]\n\n',
      ]),
    )

    const { stream, usage } = adapter().askSensei(ASK)

    expect(await drain(stream)).toBe('An operation safe to repeat.')
    expect(await usage).toEqual({ inputTokens: 183, outputTokens: 17 })
    const body = JSON.parse((fetchSpy.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.stream_options).toEqual({ include_usage: true })
  })

  it('rejects the usage promise as well when the stream fails', async () => {
    fetchSpy.mockResolvedValue(okStream([sseLine(deltaChunk('partial'))]))

    const { stream, usage } = adapter().askSensei(ASK)
    const usageRejected = expect(usage).rejects.toThrow('ended before [DONE]')

    await expect(drain(stream)).rejects.toThrow('ended before [DONE]')
    await usageRejected
  })
})
