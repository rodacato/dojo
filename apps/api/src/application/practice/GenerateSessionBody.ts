import type { ExerciseRepositoryPort } from '../../domain/content/ports'
import type { LLMPort, SessionRepositoryPort } from '../../domain/practice/ports'
import type { ExerciseId, SessionId, VariationId } from '../../domain/shared/types'

interface Deps {
  exerciseRepo: ExerciseRepositoryPort
  sessionRepo: SessionRepositoryPort
  llm: LLMPort
}

export class GenerateSessionBody {
  constructor(private readonly deps: Deps) {}

  async execute(params: {
    sessionId: SessionId
    exerciseId: ExerciseId
    variationId: VariationId
  }): Promise<void> {
    const exercise = await this.deps.exerciseRepo.findById(params.exerciseId)
    if (!exercise) return

    const variation = exercise.variations.find((v) => v.id === params.variationId)
    if (!variation) return

    const body = await this.deps.llm.generateSessionBody({
      ownerRole: variation.ownerRole,
      ownerContext: variation.ownerContext,
      exerciseDescription: exercise.description,
    })

    await this.deps.sessionRepo.updateBody(params.sessionId, body)
  }
}
