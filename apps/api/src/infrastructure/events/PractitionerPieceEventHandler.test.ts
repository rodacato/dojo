import { describe, expect, it, vi } from 'vitest'
import type { AwardPractitionerPieces } from '../../application/recognition/AwardPractitionerPieces'
import type { SessionCompleted, SessionFailed } from '../../domain/practice/events'
import type { UserId } from '../../domain/shared/types'
import { InMemoryEventBus } from './InMemoryEventBus'
import { registerPractitionerPieceHandlers } from './PractitionerPieceEventHandler'

describe('registerPractitionerPieceHandlers', () => {
  it('awards after either outcome of an evaluation, so NEEDS WORK counts too', async () => {
    const execute = vi.fn().mockResolvedValue([])
    const bus = new InMemoryEventBus()
    registerPractitionerPieceHandlers(bus, { execute } as unknown as AwardPractitionerPieces)
    const userId = 'user-1' as UserId

    const completed: SessionCompleted = { type: 'SessionCompleted', aggregateId: 's-1', occurredAt: new Date(), userId, verdict: 'passed', topicsToReview: [] }
    const failed: SessionFailed = { type: 'SessionFailed', aggregateId: 's-2', occurredAt: new Date(), userId }
    await bus.publish(completed)
    await bus.publish(failed)

    expect(execute.mock.calls).toEqual([[{ userId, sessionId: 's-1' }], [{ userId, sessionId: 's-2' }]])
  })
})
