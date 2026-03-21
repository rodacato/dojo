import type { ExerciseRepositoryPort } from '../../domain/content/ports'
import { ExerciseNotFoundError } from '../../domain/shared/errors'
import type { ExerciseId, UserId, VariationId } from '../../domain/shared/types'
import type { EventBusPort, LLMPort, SessionRepositoryPort } from '../../domain/practice/ports'
import { Session } from '../../domain/practice/session'

interface Deps {
  exerciseRepo: ExerciseRepositoryPort
  sessionRepo: SessionRepositoryPort
  llm: LLMPort
  eventBus: EventBusPort
}

export class StartSession {
  constructor(private readonly deps: Deps) {}

  async execute(params: {
    userId: UserId
    exerciseId: ExerciseId
    variationId: VariationId
  }): Promise<Session> {
    const exercise = await this.deps.exerciseRepo.findById(params.exerciseId)
    if (!exercise) throw new ExerciseNotFoundError(params.exerciseId)

    const variation = exercise.variations.find((v) => v.id === params.variationId)
    if (!variation) throw new ExerciseNotFoundError(params.variationId)

    const body = await this.deps.llm.generateSessionBody({
      ownerRole: variation.ownerRole,
      ownerContext: variation.ownerContext,
      exerciseDescription: exercise.description,
    })

    const session = Session.create({
      userId: params.userId,
      exerciseId: params.exerciseId,
      variationId: params.variationId,
      body,
    })

    await this.deps.sessionRepo.save(session)

    for (const event of session.pullEvents()) {
      await this.deps.eventBus.publish(event)
    }

    return session
  }
}
