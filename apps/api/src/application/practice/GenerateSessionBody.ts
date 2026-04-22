import type { ExerciseRepositoryPort } from '../../domain/content/ports'
import type { LLMPort, SessionRepositoryPort } from '../../domain/practice/ports'
import type { ExerciseId, SessionId, VariationId } from '../../domain/shared/types'
import type { ErrorReporterPort } from '../../infrastructure/observability/ports'

interface Deps {
  exerciseRepo: ExerciseRepositoryPort
  sessionRepo: SessionRepositoryPort
  llm: LLMPort
  errorReporter?: ErrorReporterPort
}

export class GenerateSessionBody {
  constructor(private readonly deps: Deps) {}

  async execute(params: {
    sessionId: SessionId
    exerciseId: ExerciseId
    variationId: VariationId
  }): Promise<void> {
    // Failures in prep delete the session rather than mark it failed. A
    // half-born session has no body to read and no attempt to show — leaving
    // the row around pollutes the dashboard, skews streak counts, and sends
    // the learner to a misleading "expired without submission" screen.
    try {
      const exercise = await this.deps.exerciseRepo.findById(params.exerciseId)
      if (!exercise) {
        await this.deps.sessionRepo.delete(params.sessionId)
        return
      }

      const variation = exercise.variations.find((v) => v.id === params.variationId)
      if (!variation) {
        await this.deps.sessionRepo.delete(params.sessionId)
        return
      }

      // Review kata (PRD 027) ship with a deterministic diff authored directly
      // into the exercise description. Running it through the LLM would drift
      // the diff every session, which defeats the rubric. Skip the call.
      if (exercise.type === 'review') {
        await this.deps.sessionRepo.updateBody(params.sessionId, exercise.description)
        return
      }

      const body = await this.deps.llm.generateSessionBody({
        ownerRole: variation.ownerRole,
        ownerContext: variation.ownerContext,
        exerciseDescription: exercise.description,
      })

      await this.deps.sessionRepo.updateBody(params.sessionId, body)
    } catch (err) {
      await this.deps.sessionRepo.delete(params.sessionId).catch(() => {})
      await this.deps.errorReporter?.report({
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        status: 500,
        source: 'api',
        context: {
          useCase: 'GenerateSessionBody',
          sessionId: params.sessionId,
          exerciseId: params.exerciseId,
          variationId: params.variationId,
        },
      })
      throw err
    }
  }
}
