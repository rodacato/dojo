import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Session } from '../../../domain/practice/session'
import { KataId, SessionId, UserId, VariationId } from '../../../domain/shared/types'
import type { EvaluationResult } from '../../../domain/practice/values'
import type { WSInstance } from './ws-handlers'

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock('../../container', () => ({
  useCases: {
    getSession: { execute: vi.fn() },
    submitAttempt: { execute: vi.fn() },
    getKataById: { execute: vi.fn() },
  },
  executionQueue: { enqueue: vi.fn() },
}))

vi.mock('./pending-attempts', () => ({
  pendingAttempts: new Map(),
}))

vi.mock('../../persistence/drizzle/client', () => ({
  db: { insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn() }) }) },
}))

// Must import AFTER vi.mock declarations
import { handleSubmit, handleReconnect, streamCache } from './ws-handlers'
import { useCases, executionQueue } from '../../container'
import { db } from '../../persistence/drizzle/client'
import { pendingAttempts } from './pending-attempts'

// ── Helpers ───────────────────────────────────────────────────────────────────
function mockWs(): WSInstance & { messages: string[] } {
  const messages: string[] = []
  return {
    send: vi.fn((data: string) => messages.push(data)),
    close: vi.fn(),
    messages,
  }
}

function parsed(ws: ReturnType<typeof mockWs>): Array<{ type: string; code?: string }> {
  return ws.messages.map((m) => JSON.parse(m))
}

function makeSession(overrides: { attempts?: unknown[] } = {}) {
  return new Session({
    id: SessionId('session-1'),
    userId: UserId('user-1'),
    kataId: KataId('ex-1'),
    variationId: VariationId('var-1'),
    body: 'Review this code...',
    status: 'active',
    attempts: (overrides.attempts ?? []) as never[],
    startedAt: new Date(),
    completedAt: null,
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('handleSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pendingAttempts.clear()
    streamCache.clear()
  })

  it('returns ATTEMPT_NOT_FOUND for unknown attemptId', async () => {
    const ws = mockWs()

    await handleSubmit(ws, 'unknown-attempt', 'session-1', 'user-1')

    expect(parsed(ws)).toEqual([{ type: 'error', code: 'ATTEMPT_NOT_FOUND' }])
  })

  it('returns SESSION_NOT_FOUND when session does not exist', async () => {
    const ws = mockWs()
    pendingAttempts.set('attempt-1', { sessionId: 'session-1', userResponse: 'my code' })
    vi.mocked(useCases.getSession.execute).mockResolvedValue(null)

    await handleSubmit(ws, 'attempt-1', 'session-1', 'user-1')

    expect(parsed(ws)).toEqual([{ type: 'error', code: 'SESSION_NOT_FOUND' }])
  })

  it('returns ATTEMPT_LIMIT_REACHED when session has 2+ attempts', async () => {
    const ws = mockWs()
    pendingAttempts.set('attempt-1', { sessionId: 'session-1', userResponse: 'my code' })
    const session = makeSession({
      attempts: [
        { id: 'a1', userResponse: 'r1', llmResponse: 'l1', isFinalEvaluation: false, submittedAt: new Date() },
        { id: 'a2', userResponse: 'r2', llmResponse: 'l2', isFinalEvaluation: true, submittedAt: new Date() },
      ],
    })
    vi.mocked(useCases.getSession.execute).mockResolvedValue(session)

    await handleSubmit(ws, 'attempt-1', 'session-1', 'user-1')

    expect(parsed(ws)).toEqual([{ type: 'error', code: 'ATTEMPT_LIMIT_REACHED' }])
  })
})

// ── submit happy path + execution + stream-error ───────────────────────────────
const PASS_RESULT: EvaluationResult = {
  verdict: 'passed',
  analysis: 'Clean.',
  topicsToReview: [],
  followUpQuestion: null,
  isFinalEvaluation: true,
}

function makeKata(overrides: Record<string, unknown> = {}) {
  return {
    id: KataId('ex-1'),
    title: 'Reverse a string',
    category: 'algorithms',
    type: 'code',
    languages: ['javascript'],
    testCode: undefined,
    variations: [{ id: 'var-1', ownerRole: 'reviewer', ownerContext: 'tabs-vs-spaces' }],
    ...overrides,
  }
}

async function* stream(...tokens: Array<{ chunk?: string; isFinal?: boolean; result?: EvaluationResult }>) {
  for (const t of tokens) yield t
}

function primeSubmit(opts: { kata?: Record<string, unknown> } = {}) {
  pendingAttempts.set('attempt-1', { sessionId: 'session-1', userResponse: 'const x = 1' })
  vi.mocked(useCases.getSession.execute).mockResolvedValue(makeSession())
  vi.mocked(useCases.getKataById.execute).mockResolvedValue(makeKata(opts.kata) as never)
}

describe('handleSubmit — streaming happy path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pendingAttempts.clear()
    streamCache.clear()
  })

  it('streams tokens then evaluation+complete and closes on a final result', async () => {
    const ws = mockWs()
    primeSubmit()
    vi.mocked(useCases.submitAttempt.execute).mockReturnValue(
      stream({ chunk: 'Look' }, { chunk: 's good' }, { isFinal: true, result: PASS_RESULT }) as never,
    )

    await handleSubmit(ws, 'attempt-1', 'session-1', 'user-1')

    expect(parsed(ws)).toEqual([
      { type: 'token', content: 'Look' },
      { type: 'token', content: 's good' },
      { type: 'evaluation', result: PASS_RESULT },
      { type: 'complete', isFinal: true },
    ])
    expect(ws.close).toHaveBeenCalledWith(1000, 'Evaluation complete')
  })

  it('does NOT close the socket when the evaluation is non-final (follow-up coming)', async () => {
    const ws = mockWs()
    primeSubmit()
    const nonFinal: EvaluationResult = { ...PASS_RESULT, verdict: 'needs_work', isFinalEvaluation: false }
    vi.mocked(useCases.submitAttempt.execute).mockReturnValue(
      stream({ chunk: 'hmm' }, { isFinal: true, result: nonFinal }) as never,
    )

    await handleSubmit(ws, 'attempt-1', 'session-1', 'user-1')

    expect(parsed(ws).at(-1)).toEqual({ type: 'complete', isFinal: false })
    expect(ws.close).not.toHaveBeenCalled()
  })

  it('populates the stream cache so a reconnect can replay tokens + result', async () => {
    const ws = mockWs()
    primeSubmit()
    vi.mocked(useCases.submitAttempt.execute).mockReturnValue(
      stream({ chunk: 'a' }, { chunk: 'b' }, { isFinal: true, result: PASS_RESULT }) as never,
    )

    await handleSubmit(ws, 'attempt-1', 'session-1', 'user-1')

    const cache = streamCache.get('attempt-1')
    expect(cache?.tokens).toEqual(['a', 'b'])
    expect(cache?.result).toEqual(PASS_RESULT)
    expect(cache?.complete).toBe(true)
    expect(cache?.isFinal).toBe(true)
  })

  it('forwards the variation owner role/context and kata title to the LLM use case', async () => {
    const ws = mockWs()
    primeSubmit()
    vi.mocked(useCases.submitAttempt.execute).mockReturnValue(stream() as never)

    await handleSubmit(ws, 'attempt-1', 'session-1', 'user-1')

    expect(useCases.submitAttempt.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userResponse: 'const x = 1',
        ownerRole: 'reviewer',
        ownerContext: 'tabs-vs-spaces',
        kataTitle: 'Reverse a string',
        category: 'algorithms',
      }),
    )
  })

  it('consumes the pending attempt so a duplicate submit is rejected as ATTEMPT_NOT_FOUND', async () => {
    const ws1 = mockWs()
    primeSubmit()
    vi.mocked(useCases.submitAttempt.execute).mockReturnValue(stream() as never)
    await handleSubmit(ws1, 'attempt-1', 'session-1', 'user-1')

    const ws2 = mockWs()
    await handleSubmit(ws2, 'attempt-1', 'session-1', 'user-1')
    expect(parsed(ws2)).toEqual([{ type: 'error', code: 'ATTEMPT_NOT_FOUND' }])
  })
})

describe('handleSubmit — code execution path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pendingAttempts.clear()
    streamCache.clear()
  })

  it('runs the test code and emits executing + execution_result before streaming', async () => {
    const ws = mockWs()
    primeSubmit({ kata: { testCode: 'assert(...)' } })
    const execResult = { exitCode: 0, stdout: 'ok', stderr: '', timedOut: false, executionTimeMs: 12 }
    vi.mocked(executionQueue.enqueue).mockResolvedValue(execResult as never)
    vi.mocked(useCases.submitAttempt.execute).mockReturnValue(stream() as never)

    await handleSubmit(ws, 'attempt-1', 'session-1', 'user-1')

    const types = parsed(ws).map((m) => m.type)
    expect(types.slice(0, 2)).toEqual(['executing', 'execution_result'])
    expect(executionQueue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'javascript', code: 'const x = 1', testCode: 'assert(...)' }),
    )
  })

  it('passes an "all tests passed" context to the sensei on exit code 0', async () => {
    const ws = mockWs()
    primeSubmit({ kata: { testCode: 'assert(...)' } })
    vi.mocked(executionQueue.enqueue).mockResolvedValue(
      { exitCode: 0, stdout: 'ok', stderr: '', timedOut: false, executionTimeMs: 5 } as never,
    )
    vi.mocked(useCases.submitAttempt.execute).mockReturnValue(stream() as never)

    await handleSubmit(ws, 'attempt-1', 'session-1', 'user-1')

    const ctx = vi.mocked(useCases.submitAttempt.execute).mock.calls[0]?.[0]?.executionContext ?? ''
    expect(ctx).toContain('All tests passed')
  })

  it('passes a "failed tests" context when exit code is non-zero', async () => {
    const ws = mockWs()
    primeSubmit({ kata: { testCode: 'assert(...)' } })
    vi.mocked(executionQueue.enqueue).mockResolvedValue(
      { exitCode: 1, stdout: 'expected 2 got 3', stderr: '', timedOut: false, executionTimeMs: 5 } as never,
    )
    vi.mocked(useCases.submitAttempt.execute).mockReturnValue(stream() as never)

    await handleSubmit(ws, 'attempt-1', 'session-1', 'user-1')

    const ctx = vi.mocked(useCases.submitAttempt.execute).mock.calls[0]?.[0]?.executionContext ?? ''
    expect(ctx).toContain('Some tests failed')
  })

  it('continues to the LLM stream even when code execution throws', async () => {
    const ws = mockWs()
    primeSubmit({ kata: { testCode: 'assert(...)' } })
    vi.mocked(executionQueue.enqueue).mockRejectedValue(new Error('piston down'))
    vi.mocked(useCases.submitAttempt.execute).mockReturnValue(
      stream({ isFinal: true, result: PASS_RESULT }) as never,
    )
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await handleSubmit(ws, 'attempt-1', 'session-1', 'user-1')

    expect(useCases.submitAttempt.execute).toHaveBeenCalledTimes(1)
    const ctx = vi.mocked(useCases.submitAttempt.execute).mock.calls[0]?.[0]?.executionContext
    expect(ctx).toBeUndefined()
    warn.mockRestore()
  })
})

describe('handleSubmit — LLM stream error', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pendingAttempts.clear()
    streamCache.clear()
  })

  it('persists the partial attempt and emits LLM_STREAM_ERROR when the stream throws', async () => {
    const ws = mockWs()
    primeSubmit()
    async function* boom() {
      yield { chunk: 'partial ' }
      throw new Error('upstream gone')
    }
    vi.mocked(useCases.submitAttempt.execute).mockReturnValue(boom() as never)
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await handleSubmit(ws, 'attempt-1', 'session-1', 'user-1')

    const msgs = parsed(ws)
    expect(msgs).toContainEqual({ type: 'token', content: 'partial ' })
    expect(msgs.at(-1)).toEqual({ type: 'error', code: 'LLM_STREAM_ERROR' })
    // The attempt is persisted so a retry can find it.
    expect(db.insert).toHaveBeenCalledTimes(1)
    err.mockRestore()
  })
})

describe('handleReconnect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    streamCache.clear()
  })

  it('returns ATTEMPT_NOT_FOUND when cache miss', () => {
    const ws = mockWs()

    handleReconnect(ws, 'unknown-attempt')

    expect(parsed(ws)).toEqual([{ type: 'error', code: 'ATTEMPT_NOT_FOUND' }])
  })

  it('replays cached tokens', () => {
    const ws = mockWs()
    streamCache.set('attempt-1', {
      tokens: ['hello', ' world'],
      result: null,
      complete: false,
      isFinal: false,
    })

    handleReconnect(ws, 'attempt-1')

    expect(parsed(ws)).toEqual([
      { type: 'token', content: 'hello' },
      { type: 'token', content: ' world' },
    ])
  })

  it('sends complete if cache is already complete', () => {
    const ws = mockWs()
    const result: EvaluationResult = {
      verdict: 'passed',
      analysis: 'Good job',
      topicsToReview: [],
      followUpQuestion: null,
      isFinalEvaluation: true,
    }
    streamCache.set('attempt-1', {
      tokens: ['token1'],
      result,
      complete: true,
      isFinal: true,
    })

    handleReconnect(ws, 'attempt-1')

    const msgs = parsed(ws)
    expect(msgs).toEqual([
      { type: 'token', content: 'token1' },
      { type: 'evaluation', result },
      { type: 'complete', isFinal: true },
    ])
    expect(ws.close).toHaveBeenCalledWith(1000, 'Evaluation complete')
  })
})
