import type { DomainEvent } from '../shared/events'
import type { SessionId, UserId } from '../shared/types'
import type { Session } from './session'
import type { EvaluationToken } from './values'

export interface ConversationTurn {
  userResponse: string
  llmResponse: string
}

export interface LLMPort {
  evaluate(params: {
    ownerRole: string
    ownerContext: string
    sessionBody: string
    userResponse: string
    history: ConversationTurn[]
  }): AsyncIterable<EvaluationToken>

  generateSessionBody(params: {
    ownerRole: string
    ownerContext: string
    exerciseDescription: string
  }): Promise<string>
}

export interface SessionRepositoryPort {
  save(session: Session): Promise<void>
  findById(id: SessionId): Promise<Session | null>
  findActiveByUserId(userId: UserId): Promise<Session | null>
}

export interface EventBusPort {
  publish(event: DomainEvent): Promise<void>
  subscribe<T extends DomainEvent>(eventType: string, handler: (event: T) => Promise<void>): void
}
