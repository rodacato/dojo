import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ConversationTurn } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'

// ---------------------------------------------------------------------------
// Boundary mock: the @anthropic-ai/sdk client. `messages.stream()` is the real
// external surface — we feed it a fake async-iterable of SDK stream events so
// the adapter's event-filtering (content_block_delta / text_delta) and the
// REAL EvaluationStreamParser run end-to-end. The parser and LLMParseError are
// NOT mocked — this asserts the actual <evaluation> extraction.
// ---------------------------------------------------------------------------

const { mockConfig, streamImpl, createImpl } = vi.hoisted(() => ({
  mockConfig: { LLM_STREAM: true, LLM_MODEL: 'claude-test', LLM_BASE_URL: undefined as string | undefined },
  streamImpl: vi.fn(),
  createImpl: vi.fn(),
}))

vi.mock('../../config', () => ({ config: mockConfig }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { stream: streamImpl, create: createImpl }
  },
}))

import { AnthropicStreamAdapter, LLMParseError } from './AnthropicStreamAdapter'

const VALID_EVALUATION = JSON.stringify({
  verdict: 'passed',
  analysis: 'Clean invariants, correct boundary handling on the empty array.',
  topicsToReview: ['edge cases'],
  followUpQuestion: null,
  isFinalEvaluation: true,
})

const FULL_OUTPUT = `Good answer.<evaluation>${VALID_EVALUATION}</evaluation>`

// Build an async-iterable of Anthropic stream events from text fragments. Each
// fragment becomes a content_block_delta/text_delta event. A non-text event is
// interleaved to prove the adapter ignores it (only text_delta is consumed).
function eventStream(textPieces: string[]): AsyncIterable<unknown> {
  const events: unknown[] = [{ type: 'message_start', message: { usage: { input_tokens: 10 } } }]
  for (const text of textPieces) {
    events.push({ type: 'ping' })
    events.push({ type: 'content_block_delta', delta: { type: 'text_delta', text } })
  }
  events.push({ type: 'message_delta', usage: { output_tokens: 20 } })
  return {
    async *[Symbol.asyncIterator]() {
      for (const e of events) yield e
    },
  }
}

async function collect(history: ConversationTurn[] = []): Promise<EvaluationToken[]> {
  const adapter = new AnthropicStreamAdapter('test-key')
  const tokens: EvaluationToken[] = []
  for await (const t of adapter.evaluate({
    ownerRole: 'staff',
    ownerContext: 'ctx',
    kataTitle: 'Binary Search',
    sessionBody: 'Implement binary search.',
    userResponse: 'lo/hi loop',
    history,
  })) {
    tokens.push(t)
  }
  return tokens
}

beforeEach(() => {
  vi.clearAllMocks()
  mockConfig.LLM_STREAM = true
  mockConfig.LLM_MODEL = 'claude-test'
  mockConfig.LLM_BASE_URL = undefined
})

describe('AnthropicStreamAdapter.evaluate (streaming)', () => {
  it('assembles text_delta events into prose tokens and a final parsed evaluation result', async () => {
    streamImpl.mockReturnValue(eventStream([FULL_OUTPUT]))

    const tokens = await collect()

    const prose = tokens.filter((t) => !t.isFinal).map((t) => t.chunk).join('')
    expect(prose).toBe('Good answer.')

    const final = tokens.at(-1)!
    expect(final.isFinal).toBe(true)
    expect(final.chunk).toBe('')
    expect(final.result).toEqual({
      verdict: 'passed',
      analysis: 'Clean invariants, correct boundary handling on the empty array.',
      topicsToReview: ['edge cases'],
      followUpQuestion: null,
      isFinalEvaluation: true,
    })
  })

  it('reassembles prose and evaluation JSON split across text_delta events', async () => {
    // Deliberate boundaries: prose split, JSON split mid-object across events.
    // The <evaluation> open tag lands whole in one delta — the parser stitches
    // the JSON across events but needs the open tag intact in a single chunk.
    const half = Math.floor(VALID_EVALUATION.length / 2)
    streamImpl.mockReturnValue(
      eventStream([
        'Good ',
        'answer.',
        `<evaluation>${VALID_EVALUATION.slice(0, half)}`,
        `${VALID_EVALUATION.slice(half)}</evaluation>`,
      ]),
    )

    const tokens = await collect()

    expect(tokens.filter((t) => !t.isFinal).map((t) => t.chunk).join('')).toBe('Good answer.')
    expect(tokens.at(-1)!.result?.verdict).toBe('passed')
    expect(tokens.at(-1)!.result?.analysis).toContain('boundary handling')
  })

  it('ignores non-text events (message_start, ping, message_delta) when building the result', async () => {
    // eventStream already interleaves ping + message_start/_delta; a stream of
    // ONLY those (no text) must end without an <evaluation> block → parse error.
    streamImpl.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        yield { type: 'message_start', message: { usage: { input_tokens: 1 } } }
        yield { type: 'ping' }
        yield { type: 'message_delta', usage: { output_tokens: 1 } }
      },
    })

    await expect(collect()).rejects.toBeInstanceOf(LLMParseError)
  })

  it('throws LLMParseError when the stream ends without an <evaluation> block', async () => {
    streamImpl.mockReturnValue(eventStream(['Only prose, no verdict.']))

    await expect(collect()).rejects.toBeInstanceOf(LLMParseError)
  })

  it('throws LLMParseError when the evaluation JSON is malformed', async () => {
    streamImpl.mockReturnValue(eventStream(['x<evaluation>{not valid json</evaluation>']))

    await expect(collect()).rejects.toBeInstanceOf(LLMParseError)
  })

  it('throws LLMParseError when the verdict value is not an allowed verdict', async () => {
    const bad = `<evaluation>${JSON.stringify({
      verdict: 'maybe',
      analysis: 'x',
      topicsToReview: [],
      followUpQuestion: null,
      isFinalEvaluation: true,
    })}</evaluation>`
    streamImpl.mockReturnValue(eventStream([bad]))

    await expect(collect()).rejects.toBeInstanceOf(LLMParseError)
  })

  it('propagates an error thrown mid-stream by the SDK iterator', async () => {
    streamImpl.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'partial' } }
        throw new Error('connection reset')
      },
    })

    await expect(collect()).rejects.toThrow('connection reset')
  })

  it('passes the configured model and built user message to messages.stream', async () => {
    streamImpl.mockReturnValue(eventStream([FULL_OUTPUT]))

    await collect()

    expect(streamImpl).toHaveBeenCalledTimes(1)
    const arg = streamImpl.mock.calls[0]![0] as { model: string; messages: { role: string }[] }
    expect(arg.model).toBe('claude-test')
    expect(arg.messages[0].role).toBe('user')
  })

  it('reconstructs the follow-up conversation (user/assistant/user) from history', async () => {
    streamImpl.mockReturnValue(eventStream([FULL_OUTPUT]))
    const history: ConversationTurn[] = [
      {
        userResponse: 'first answer',
        llmResponse: 'prose "followUpQuestion": "Why O(log n)?" more',
      },
    ]

    await collect(history)

    const arg = streamImpl.mock.calls[0]![0] as { messages: { role: string; content: string }[] }
    expect(arg.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user'])
    // The first user turn is rebuilt from history[0].userResponse, not the new one.
    expect(arg.messages[1].content).toContain('followUpQuestion')
    // The extracted follow-up question is threaded into the final user prompt.
    expect(arg.messages[2].content).toContain('Why O(log n)?')
  })
})

describe('AnthropicStreamAdapter.evaluate (non-streaming)', () => {
  beforeEach(() => {
    mockConfig.LLM_STREAM = false
  })

  it('parses the single text content block into the final evaluation', async () => {
    createImpl.mockResolvedValue({ content: [{ type: 'text', text: FULL_OUTPUT }] })

    const tokens = await collect()

    expect(tokens.filter((t) => !t.isFinal).map((t) => t.chunk).join('')).toBe('Good answer.')
    expect(tokens.at(-1)!.result?.verdict).toBe('passed')
    expect(streamImpl).not.toHaveBeenCalled()
  })

  it('treats a non-text first content block as empty text → LLMParseError', async () => {
    createImpl.mockResolvedValue({ content: [{ type: 'tool_use', id: 't', name: 'x', input: {} }] })

    await expect(collect()).rejects.toBeInstanceOf(LLMParseError)
  })
})
