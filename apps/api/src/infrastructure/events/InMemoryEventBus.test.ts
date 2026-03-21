import { describe, expect, it, vi } from 'vitest'
import type { DomainEvent } from '../../domain/shared/events'
import { InMemoryEventBus } from './InMemoryEventBus'

const makeEvent = (type: string): DomainEvent => ({
  type,
  aggregateId: 'aggregate-1',
  occurredAt: new Date(),
})

describe('InMemoryEventBus', () => {
  it('publish() calls all subscribers for the event type', async () => {
    const bus = new InMemoryEventBus()
    const handler = vi.fn().mockResolvedValue(undefined)

    bus.subscribe('TestEvent', handler)
    await bus.publish(makeEvent('TestEvent'))

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('multiple subscribers on the same event type are all called', async () => {
    const bus = new InMemoryEventBus()
    const handler1 = vi.fn().mockResolvedValue(undefined)
    const handler2 = vi.fn().mockResolvedValue(undefined)

    bus.subscribe('TestEvent', handler1)
    bus.subscribe('TestEvent', handler2)
    await bus.publish(makeEvent('TestEvent'))

    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).toHaveBeenCalledTimes(1)
  })

  it('events with no subscribers do not error', async () => {
    const bus = new InMemoryEventBus()
    await expect(bus.publish(makeEvent('UnhandledEvent'))).resolves.toBeUndefined()
  })

  it('subscribers for different event types do not cross-fire', async () => {
    const bus = new InMemoryEventBus()
    const handler = vi.fn().mockResolvedValue(undefined)

    bus.subscribe('EventA', handler)
    await bus.publish(makeEvent('EventB'))

    expect(handler).not.toHaveBeenCalled()
  })
})
