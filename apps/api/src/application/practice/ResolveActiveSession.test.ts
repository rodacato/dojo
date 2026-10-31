import { describe, expect, it, vi } from 'vitest'
import { Attempt } from '../../domain/practice/attempt'
import { Session } from '../../domain/practice/session'
import { AttemptId, KataId, SessionId, UserId, VariationId } from '../../domain/shared/types'
import type { KataRepositoryPort } from '../../domain/content/ports'
import type { SessionRepositoryPort } from '../../domain/practice/ports'
import { ResolveActiveSession } from './ResolveActiveSession'

const DURATION_MINUTES = 5
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000)

const makeSession = (startedAt: Date, attempts: Attempt[] = []) =>
  new Session({
    id: SessionId('session-1'),
    userId: UserId('user-1'),
    kataId: KataId('kata-1'),
    variationId: VariationId('var-1'),
    body: 'Review this code...',
    status: 'active',
    attempts,
    startedAt,
    completedAt: null,
  })

function resolve(session: Session | null) {
  const save = vi.fn()
  const useCase = new ResolveActiveSession({
    kataRepo: { findById: async () => ({ durationMinutes: DURATION_MINUTES }) } as unknown as KataRepositoryPort,
    sessionRepo: { findActiveByUserId: async () => session, save } as unknown as SessionRepositoryPort,
  })
  return { save, result: useCase.execute(UserId('user-1')) }
}

describe('ResolveActiveSession', () => {
  it('returns nothing when the learner has no active session', async () => {
    expect(await resolve(null).result).toBeNull()
  })

  it('keeps a session inside the 10% grace window active', async () => {
    const session = makeSession(minutesAgo(DURATION_MINUTES + 0.4))

    const { result, save } = resolve(session)

    expect(await result).toBe(session.id)
    expect(session.status).toBe('active')
    expect(save).not.toHaveBeenCalled()
  })

  it('fails a session that ran past the grace window unanswered', async () => {
    const session = makeSession(minutesAgo(DURATION_MINUTES + 1))

    const { result, save } = resolve(session)

    expect(await result).toBeNull()
    expect(session.status).toBe('failed')
    expect(session.completedAt).not.toBeNull()
    expect(save).toHaveBeenCalledWith(session)
  })

  it('completes an overdue session that already has a final evaluation', async () => {
    const finalAttempt = new Attempt({
      id: AttemptId('attempt-1'),
      sessionId: SessionId('session-1'),
      userResponse: 'answer',
      evaluationResult: {
        verdict: 'passed',
        analysis: '',
        topicsToReview: [],
        followUpQuestion: null,
        isFinalEvaluation: true,
      },
      isFinalEvaluation: true,
      submittedAt: new Date(),
    })
    const session = makeSession(minutesAgo(DURATION_MINUTES + 1), [finalAttempt])

    await resolve(session).result

    expect(session.status).toBe('completed')
  })
})
