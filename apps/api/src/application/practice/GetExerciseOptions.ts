import type { Exercise } from '../../domain/content/exercise'
import type { ExerciseFilters, ExerciseRepositoryPort } from '../../domain/content/ports'
import type { UserId } from '../../domain/shared/types'

interface Deps {
  exerciseRepo: ExerciseRepositoryPort
}

export class GetExerciseOptions {
  constructor(private readonly deps: Deps) {}

  async execute(params: { userId: UserId; filters: ExerciseFilters }): Promise<Exercise[]> {
    return this.deps.exerciseRepo.findEligible(params.userId, params.filters)
  }
}
