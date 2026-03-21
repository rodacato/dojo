import type { EventBusPort } from '../../domain/practice/ports'
import type { DomainEvent } from '../../domain/shared/events'

export class InMemoryEventBus implements EventBusPort {
  private handlers = new Map<string, Array<(event: DomainEvent) => Promise<void>>>()

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? []
    for (const handler of handlers) {
      await handler(event)
    }
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: (event: T) => Promise<void>): void {
    const existing = this.handlers.get(eventType) ?? []
    this.handlers.set(eventType, [...existing, handler as (event: DomainEvent) => Promise<void>])
  }
}
