export interface DomainEvent {
  readonly type: string
  readonly aggregateId: string
  readonly occurredAt: Date
}

export interface EventBusPort {
  publish(event: DomainEvent): Promise<void>
  subscribe<T extends DomainEvent>(eventType: string, handler: (event: T) => Promise<void>): void
}
