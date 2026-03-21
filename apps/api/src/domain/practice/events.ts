import type { DomainEvent } from '../shared/events'
import type { AttemptId, ExerciseId, UserId, VariationId } from '../shared/types'
import type { Verdict } from './values'

export interface SessionCreated extends DomainEvent {
  readonly type: 'SessionCreated'
  readonly aggregateId: string // SessionId
  readonly userId: UserId
  readonly exerciseId: ExerciseId
  readonly variationId: VariationId
}

export interface AttemptSubmitted extends DomainEvent {
  readonly type: 'AttemptSubmitted'
  readonly aggregateId: string // SessionId
  readonly attemptId: AttemptId
  readonly isFinalEvaluation: boolean
}

export interface SessionCompleted extends DomainEvent {
  readonly type: 'SessionCompleted'
  readonly aggregateId: string // SessionId
  readonly userId: UserId
  readonly verdict: Verdict
  readonly topicsToReview: string[]
}

export interface SessionFailed extends DomainEvent {
  readonly type: 'SessionFailed'
  readonly aggregateId: string // SessionId
  readonly userId: UserId
}
