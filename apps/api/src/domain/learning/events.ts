import type { DomainEvent } from '../shared/events'

// Fired from TrackProgress once a user's completedSteps covers every step of
// a course. Anonymous completions (sessionId only) are intentionally not
// emitted — badges, shares and recognition require a user account.
export interface CourseCompleted extends DomainEvent {
  readonly type: 'CourseCompleted'
  readonly aggregateId: string // courseId
  readonly userId: string
  readonly courseSlug: string
  readonly totalSteps: number
}
