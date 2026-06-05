import type { DomainEvent } from '../shared/events'
import type { UserId } from '../shared/types'

export interface MilestoneEarned extends DomainEvent {
  readonly type: 'MilestoneEarned'
  readonly aggregateId: string // UserId
  readonly userId: UserId
  readonly milestoneId: string
  readonly earnedAt: Date
}
