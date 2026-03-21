import { describe, expect, it } from 'vitest'
import { SessionAlreadyCompletedError } from '../shared/errors'
import { ExerciseId, SessionId, UserId, VariationId } from '../shared/types'
import { Attempt } from './attempt'
import { Session } from './session'
import type { EvaluationResult } from './values'

const makeEvalResult = (verdict: EvaluationResult['verdict']): EvaluationResult => ({
  verdict,
  analysis: 'Test analysis',
  topicsToReview: ['topic-a'],
  followUpQuestion: null,
  isFinalEvaluation: true,
})

const makeAttempt = (isFinal: boolean, verdict: EvaluationResult['verdict'] = 'passed') =>
  Attempt.create({
    sessionId: SessionId('session-1'),
    userResponse: 'My answer',
    evaluationResult: makeEvalResult(verdict),
    isFinalEvaluation: isFinal,
  })

const makeSession = () =>
  Session.create({
    userId: UserId('user-1'),
    exerciseId: ExerciseId('exercise-1'),
    variationId: VariationId('variation-1'),
    body: 'You are a code reviewer...',
  })

describe('Session', () => {
  it('create() sets status to active and emits SessionCreated', () => {
    const session = makeSession()
    expect(session.status).toBe('active')

    const events = session.pullEvents()
    expect(events).toHaveLength(1)
    expect(events[0]?.type).toBe('SessionCreated')
  })

  it('addAttempt() on active session succeeds and emits AttemptSubmitted', () => {
    const session = makeSession()
    session.pullEvents() // clear SessionCreated

    const attempt = makeAttempt(false)
    session.addAttempt(attempt)

    const events = session.pullEvents()
    expect(events).toHaveLength(1)
    expect(events[0]?.type).toBe('AttemptSubmitted')
  })

  it('addAttempt() on completed session throws SessionAlreadyCompletedError', () => {
    const session = makeSession()
    session.pullEvents()

    session.addAttempt(makeAttempt(true, 'passed'))
    session.pullEvents()

    expect(() => session.addAttempt(makeAttempt(false))).toThrow(SessionAlreadyCompletedError)
  })

  it('final attempt with passed verdict transitions to completed and emits SessionCompleted', () => {
    const session = makeSession()
    session.pullEvents()

    session.addAttempt(makeAttempt(true, 'passed'))

    expect(session.status).toBe('completed')
    const events = session.pullEvents()
    const types = events.map((e) => e.type)
    expect(types).toContain('AttemptSubmitted')
    expect(types).toContain('SessionCompleted')
  })

  it('final attempt with passed_with_notes verdict transitions to completed', () => {
    const session = makeSession()
    session.pullEvents()

    session.addAttempt(makeAttempt(true, 'passed_with_notes'))

    expect(session.status).toBe('completed')
  })

  it('final attempt with needs_work verdict transitions to failed and emits SessionFailed', () => {
    const session = makeSession()
    session.pullEvents()

    session.addAttempt(makeAttempt(true, 'needs_work'))

    expect(session.status).toBe('failed')
    const events = session.pullEvents()
    const types = events.map((e) => e.type)
    expect(types).toContain('SessionFailed')
  })

  it('pullEvents() clears the pending events array', () => {
    const session = makeSession()
    const first = session.pullEvents()
    expect(first).toHaveLength(1)

    const second = session.pullEvents()
    expect(second).toHaveLength(0)
  })
})
