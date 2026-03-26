import type { Exercise } from '../../domain/content/exercise'
import type { ExerciseFilters, ExerciseRepositoryPort } from '../../domain/content/ports'
import type { UserPreferencesPort } from '../../domain/identity/ports'
import type { UserId } from '../../domain/shared/types'

interface Deps {
  exerciseRepo: ExerciseRepositoryPort
  preferencesRepo: UserPreferencesPort
}

export class GetExerciseOptions {
  constructor(private readonly deps: Deps) {}

  async execute(params: { userId: UserId; filters: ExerciseFilters }): Promise<Exercise[]> {
    const prefs = await this.deps.preferencesRepo.findByUserId(params.userId)

    const mergedFilters: ExerciseFilters = {
      ...params.filters,
      userLevel: params.filters.userLevel ?? prefs?.level ?? undefined,
      interests: params.filters.interests ?? (prefs?.interests?.length ? prefs.interests : undefined),
      randomness: params.filters.randomness ?? prefs?.randomness ?? undefined,
    }

    return this.deps.exerciseRepo.findEligible(params.userId, mergedFilters)
  }
}
