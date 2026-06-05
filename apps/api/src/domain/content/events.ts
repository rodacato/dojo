import type { DomainEvent } from '../shared/events'
import type { KataId, UserId } from '../shared/types'

export interface KataPublished extends DomainEvent {
  readonly type: 'KataPublished'
  readonly aggregateId: string // KataId
  readonly kataId: KataId
  readonly publishedBy: UserId
}
