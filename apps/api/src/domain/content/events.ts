import type { DomainEvent } from '../shared/events'
import type { ExerciseId, UserId } from '../shared/types'

export interface ExercisePublished extends DomainEvent {
  readonly type: 'ExercisePublished'
  readonly aggregateId: string // ExerciseId
  readonly exerciseId: ExerciseId
  readonly publishedBy: UserId
}
