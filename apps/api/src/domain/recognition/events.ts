import type { DomainEvent } from '../shared/events'
import type { UserId } from '../shared/types'

export interface BadgeEarned extends DomainEvent {
  readonly type: 'BadgeEarned'
  readonly aggregateId: string // UserId
  readonly userId: UserId
  readonly badgeId: string
  readonly earnedAt: Date
}
