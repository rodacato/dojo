import { describe, expect, it, vi } from 'vitest'
import { Session } from '../../domain/practice/session'
import { SessionNotFoundError } from '../../domain/shared/errors'
import { ExerciseId, SessionId, UserId, VariationId } from '../../domain/shared/types'
import { InMemoryEventBus } from '../../infrastructure/events/InMemoryEventBus'
import type { EvaluationToken } from '../../domain/practice/values'
import { SubmitAttempt } from './SubmitAttempt'

const makeActiveSession = () =>
  new Session({
    id: SessionId('session-1'),
    userId: UserId('user-1'),
    exerciseId: ExerciseId('ex-1'),
    variationId: VariationId('var-1'),
    body: 'Review this code...',
    status: 'active',
    attempts: [],
    startedAt: new Date(),
    completedAt: null,
  })

const makeStubSessionRepo = (session: Session | null = null) => ({
  save: vi.fn().mockResolvedValue(undefined),
  updateBody: vi.fn(),
  delete: vi.fn(),
  findById: vi.fn().mockResolvedValue(session),
  findActiveByUserId: vi.fn(),
})

async function* fakeEvaluationStream(tokens: EvaluationToken[]): AsyncIterable<EvaluationToken> {
  for (const token of tokens) yield token
}

describe('SubmitAttempt', () => {
  it('streams evaluation tokens from LLM', async () => {
    const session = makeActiveSession()
    const sessionRepo = makeStubSessionRepo(session)
    const eventBus = new InMemoryEventBus()
    const streamTokens: EvaluationToken[] = [
      { chunk: 'Your approach ', isFinal: false, result: null },
      { chunk: 'shows solid understanding.', isFinal: false, result: null },
      {
        chunk: '',
        isFinal: true,
        result: {
          verdict: 'passed',
          analysis: 'Your approach shows solid understanding.',
          topicsToReview: [],
          followUpQuestion: null,
          isFinalEvaluation: true,
        },
      },
    ]

    const llm = {
      evaluate: vi.fn().mockReturnValue(fakeEvaluationStream(streamTokens)),
      generateSessionBody: vi.fn(),
      generateSessionBodyStream: vi.fn(),
      nudge: vi.fn(),
      askSensei: vi.fn(),
    }

    const useCase = new SubmitAttempt({ sessionRepo, llm, eventBus })
    const collected: EvaluationToken[] = []
    for await (const token of useCase.execute({
      sessionId: SessionId('session-1'),
      userResponse: 'Here is my solution...',
      ownerRole: 'Tech Lead',
      ownerContext: 'Startup context',
    })) {
      collected.push(token)
    }

    expect(collected).toHaveLength(3)
    expect(collected[2]!.isFinal).toBe(true)
    expect(collected[2]!.result?.verdict).toBe('passed')
  })

  it('saves attempt and publishes events after final token', async () => {
    const session = makeActiveSession()
    const sessionRepo = makeStubSessionRepo(session)
    const eventBus = new InMemoryEventBus()
    const published: string[] = []
    eventBus.subscribe('AttemptSubmitted', async (e) => { published.push(e.type) })
    eventBus.subscribe('SessionCompleted', async (e) => { published.push(e.type) })

    const streamTokens: EvaluationToken[] = [
      {
        chunk: 'Good work.',
        isFinal: true,
        result: {
          verdict: 'passed',
          analysis: 'Good work.',
          topicsToReview: [],
          followUpQuestion: null,
          isFinalEvaluation: true,
        },
      },
    ]

    const llm = {
      evaluate: vi.fn().mockReturnValue(fakeEvaluationStream(streamTokens)),
      generateSessionBody: vi.fn(),
      generateSessionBodyStream: vi.fn(),
      nudge: vi.fn(),
      askSensei: vi.fn(),
    }

    const useCase = new SubmitAttempt({ sessionRepo, llm, eventBus })
    // Consume the entire stream
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of useCase.execute({
      sessionId: SessionId('session-1'),
      userResponse: 'My solution',
      ownerRole: 'Tech Lead',
      ownerContext: 'Context',
    })) {
      // consume
    }

    expect(sessionRepo.save).toHaveBeenCalled()
    expect(published).toContain('AttemptSubmitted')
    expect(published).toContain('SessionCompleted')
  })

  it('throws SessionNotFoundError when session does not exist', async () => {
    const sessionRepo = makeStubSessionRepo(null)
    const eventBus = new InMemoryEventBus()
    const llm = { evaluate: vi.fn(), generateSessionBody: vi.fn(), generateSessionBodyStream: vi.fn(), nudge: vi.fn(), askSensei: vi.fn() }

    const useCase = new SubmitAttempt({ sessionRepo, llm, eventBus })

    const stream = useCase.execute({
      sessionId: SessionId('nonexistent'),
      userResponse: 'My solution',
      ownerRole: 'Tech Lead',
      ownerContext: 'Context',
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    await expect(async () => { for await (const _ of stream) { /* consume */ } }).rejects.toThrow(SessionNotFoundError)
  })
})
