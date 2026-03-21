import type { ExerciseRepositoryPort } from '../../domain/content/ports'
import type { Exercise } from '../../domain/content/exercise'
import type { ExerciseId } from '../../domain/shared/types'

interface Deps {
  exerciseRepo: ExerciseRepositoryPort
}

export class GetExerciseById {
  constructor(private readonly deps: Deps) {}

  async execute(exerciseId: ExerciseId): Promise<Exercise | null> {
    return this.deps.exerciseRepo.findById(exerciseId)
  }
}
