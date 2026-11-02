import type { KataRepositoryPort } from '../../domain/content/ports'
import { KataNotFoundError } from '../../domain/shared/errors'
import type { KataId, UserId, VariationId } from '../../domain/shared/types'
import type { SessionRepositoryPort } from '../../domain/practice/ports'
import type { EventBusPort } from '../../domain/shared/events'
import type { UserPreferencesPort } from '../../domain/identity/ports'
import { Session } from '../../domain/practice/session'

interface Deps {
  kataRepo: KataRepositoryPort
  sessionRepo: SessionRepositoryPort
  eventBus: EventBusPort
  preferencesRepo: UserPreferencesPort
}

export class StartSession {
  constructor(private readonly deps: Deps) {}

  async execute(params: {
    userId: UserId
    kataId: KataId
    variationId: VariationId
    daily?: boolean
  }): Promise<Session> {
    const kata = await this.deps.kataRepo.findById(params.kataId)
    if (!kata) throw new KataNotFoundError(params.kataId)

    const variation = kata.variations.find((v) => v.id === params.variationId)
    if (!variation) throw new KataNotFoundError(params.variationId)

    const prefs = await this.deps.preferencesRepo.findByUserId(params.userId)
    const session = Session.createPreparing({
      userId: params.userId,
      kataId: params.kataId,
      variationId: params.variationId,
      daily: params.daily,
      level: prefs?.level,
    })

    await this.deps.sessionRepo.save(session)

    for (const event of session.pullEvents()) {
      await this.deps.eventBus.publish(event)
    }

    return session
  }
}
