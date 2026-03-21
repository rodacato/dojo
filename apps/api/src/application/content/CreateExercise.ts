import type { ExerciseRepositoryPort } from '../../domain/content/ports'
import type { Difficulty, ExerciseType } from '../../domain/content/values'
import { Exercise } from '../../domain/content/exercise'
import type { UserId } from '../../domain/shared/types'

interface Deps {
  exerciseRepo: ExerciseRepositoryPort
}

export class CreateExercise {
  constructor(private readonly deps: Deps) {}

  async execute(params: {
    title: string
    description: string
    durationMinutes: number
    difficulty: Difficulty
    type: ExerciseType
    languages: string[]
    tags: string[]
    topics: string[]
    createdBy: UserId
    variations: Array<{ ownerRole: string; ownerContext: string }>
  }): Promise<{ id: string }> {
    const exercise = Exercise.create({
      ...params,
      category: params.type,
    })
    await this.deps.exerciseRepo.save(exercise)
    return { id: exercise.id }
  }
}
