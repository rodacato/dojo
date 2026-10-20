import type { SessionCompleted, SessionFailed } from '../../domain/practice/events'
import type { AwardPractitionerPieces } from '../../application/recognition/AwardPractitionerPieces'
import type { InMemoryEventBus } from './InMemoryEventBus'

export function registerPractitionerPieceHandlers(eventBus: InMemoryEventBus, award: AwardPractitionerPieces) {
  const onEvaluated = async (event: SessionCompleted | SessionFailed) => {
    await award.execute({ userId: event.userId, sessionId: event.aggregateId })
  }
  eventBus.subscribe<SessionCompleted>('SessionCompleted', onEvaluated)
  eventBus.subscribe<SessionFailed>('SessionFailed', onEvaluated)
}
