import type { ExerciseId, UserId } from '../shared/types'
import type { Exercise } from './exercise'

export interface ExerciseFilters {
  mood?: 'focused' | 'regular' | 'low_energy'
  maxDuration?: number // minutes
  userLevel?: 'junior' | 'mid' | 'senior'
  interests?: string[]
  randomness?: number // 0.0–1.0
}

export interface ExerciseRepositoryPort {
  findEligible(userId: UserId, filters: ExerciseFilters): Promise<Exercise[]>
  findById(id: ExerciseId): Promise<Exercise | null>
  save(exercise: Exercise): Promise<void>
}
