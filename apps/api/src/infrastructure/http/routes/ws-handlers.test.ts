import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Session } from '../../../domain/practice/session'
import { ExerciseId, SessionId, UserId, VariationId } from '../../../domain/shared/types'
import type { EvaluationResult } from '../../../domain/practice/values'
import type { WSInstance } from './ws-handlers'

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock('../../container', () => ({
  useCases: {
    getSession: { execute: vi.fn() },
    submitAttempt: { execute: vi.fn() },
    getExerciseById: { execute: vi.fn() },
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
import { useCases } from '../../container'
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
    exerciseId: ExerciseId('ex-1'),
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
