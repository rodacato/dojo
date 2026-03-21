import { SessionAlreadyCompletedError } from '../shared/errors'
import type { DomainEvent } from '../shared/events'
import { SessionId } from '../shared/types'
import type { ExerciseId, UserId, VariationId } from '../shared/types'
import type { Attempt } from './attempt'
import type { AttemptSubmitted, SessionCompleted, SessionCreated, SessionFailed } from './events'
import type { SessionStatus, Verdict } from './values'

export interface SessionProps {
  id: SessionId
  userId: UserId
  exerciseId: ExerciseId
  variationId: VariationId
  body: string
  status: SessionStatus
  attempts: Attempt[]
  startedAt: Date
  completedAt: Date | null
}

export class Session {
  readonly id: SessionId
  readonly userId: UserId
  readonly exerciseId: ExerciseId
  readonly variationId: VariationId
  readonly body: string
  private _status: SessionStatus
  private _attempts: Attempt[]
  readonly startedAt: Date
  private _completedAt: Date | null
  private _pendingEvents: DomainEvent[] = []

  constructor(props: SessionProps) {
    this.id = props.id
    this.userId = props.userId
    this.exerciseId = props.exerciseId
    this.variationId = props.variationId
    this.body = props.body
    this._status = props.status
    this._attempts = [...props.attempts]
    this.startedAt = props.startedAt
    this._completedAt = props.completedAt
  }

  get status(): SessionStatus {
    return this._status
  }

  get attempts(): Attempt[] {
    return [...this._attempts]
  }

  get completedAt(): Date | null {
    return this._completedAt
  }

  static createPreparing(params: {
    userId: UserId
    exerciseId: ExerciseId
    variationId: VariationId
  }): Session {
    const session = new Session({
      id: SessionId(crypto.randomUUID()),
      userId: params.userId,
      exerciseId: params.exerciseId,
      variationId: params.variationId,
      body: '',
      status: 'preparing',
      attempts: [],
      startedAt: new Date(),
      completedAt: null,
    })

    const event: SessionCreated = {
      type: 'SessionCreated',
      aggregateId: session.id,
      occurredAt: new Date(),
      userId: params.userId,
      exerciseId: params.exerciseId,
      variationId: params.variationId,
    }
    session._pendingEvents.push(event)

    return session
  }

  static create(params: {
    userId: UserId
    exerciseId: ExerciseId
    variationId: VariationId
    body: string
  }): Session {
    const session = new Session({
      id: SessionId(crypto.randomUUID()),
      userId: params.userId,
      exerciseId: params.exerciseId,
      variationId: params.variationId,
      body: params.body,
      status: 'active',
      attempts: [],
      startedAt: new Date(),
      completedAt: null,
    })

    const event: SessionCreated = {
      type: 'SessionCreated',
      aggregateId: session.id,
      occurredAt: new Date(),
      userId: params.userId,
      exerciseId: params.exerciseId,
      variationId: params.variationId,
    }
    session._pendingEvents.push(event)

    return session
  }

  addAttempt(attempt: Attempt): void {
    if (this._status !== 'active') {
      throw new SessionAlreadyCompletedError(this.id)
    }

    this._attempts.push(attempt)

    const event: AttemptSubmitted = {
      type: 'AttemptSubmitted',
      aggregateId: this.id,
      occurredAt: new Date(),
      attemptId: attempt.id,
      isFinalEvaluation: attempt.isFinalEvaluation,
    }
    this._pendingEvents.push(event)

    if (attempt.isFinalEvaluation && attempt.evaluationResult) {
      this._complete(attempt.evaluationResult.verdict, attempt.evaluationResult.topicsToReview)
    }
  }

  private _complete(verdict: Verdict, topicsToReview: string[]): void {
    this._status = verdict === 'needs_work' ? 'failed' : 'completed'
    this._completedAt = new Date()

    if (this._status === 'completed') {
      const event: SessionCompleted = {
        type: 'SessionCompleted',
        aggregateId: this.id,
        occurredAt: new Date(),
        userId: this.userId,
        verdict,
        topicsToReview,
      }
      this._pendingEvents.push(event)
    } else {
      const event: SessionFailed = {
        type: 'SessionFailed',
        aggregateId: this.id,
        occurredAt: new Date(),
        userId: this.userId,
      }
      this._pendingEvents.push(event)
    }
  }

  pullEvents(): DomainEvent[] {
    const events = [...this._pendingEvents]
    this._pendingEvents = []
    return events
  }
}
