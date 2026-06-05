import type { UserId } from '../shared/types'

export interface Milestone {
  readonly userId: UserId
  readonly milestoneId: string  // FIRST_KATA, POLYGLOT, CONSISTENT, 5_STREAK, SCROLL_*
  readonly earnedAt: Date
  readonly contextRef: string | null  // session id or scroll slug
}

export interface MilestoneRepositoryPort {
  findByUser(userId: UserId): Promise<Milestone[]>
  earnedIds(userId: UserId): Promise<Set<string>>
  award(milestone: Milestone): Promise<void>
}
