import type { DomainEvent } from '../shared/events'

// Fired from TrackProgress once a user's completedSteps covers every step of
// a scroll. Anonymous completions (sessionId only) are intentionally not
// emitted — milestones, shares and recognition require a user account.
export interface ScrollCompleted extends DomainEvent {
  readonly type: 'ScrollCompleted'
  readonly aggregateId: string // scrollId
  readonly userId: string
  readonly scrollSlug: string
  readonly totalSteps: number
}
