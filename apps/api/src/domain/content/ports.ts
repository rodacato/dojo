import type { ExerciseId, UserId } from '../shared/types'
import type { Exercise } from './exercise'

export interface ExerciseFilters {
  mood?: 'focused' | 'regular' | 'low_energy'
  maxDuration?: number // minutes
}

export interface ExerciseRepositoryPort {
  findEligible(userId: UserId, filters: ExerciseFilters): Promise<Exercise[]>
  findById(id: ExerciseId): Promise<Exercise | null>
  save(exercise: Exercise): Promise<void>
}
