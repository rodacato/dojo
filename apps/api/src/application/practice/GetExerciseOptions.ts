import { eq } from 'drizzle-orm'
import type { Exercise } from '../../domain/content/exercise'
import type { ExerciseFilters, ExerciseRepositoryPort } from '../../domain/content/ports'
import type { UserId } from '../../domain/shared/types'
import { db } from '../../infrastructure/persistence/drizzle/client'
import { userPreferences } from '../../infrastructure/persistence/drizzle/schema'

interface Deps {
  exerciseRepo: ExerciseRepositoryPort
}

export class GetExerciseOptions {
  constructor(private readonly deps: Deps) {}

  async execute(params: { userId: UserId; filters: ExerciseFilters }): Promise<Exercise[]> {
    // Fetch user preferences and merge into filters
    const prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, params.userId),
    })

    const mergedFilters: ExerciseFilters = {
      ...params.filters,
      userLevel: params.filters.userLevel ?? (prefs?.level as ExerciseFilters['userLevel']) ?? undefined,
      interests: params.filters.interests ?? (prefs?.interests?.length ? prefs.interests : undefined),
      randomness: params.filters.randomness ?? prefs?.randomness ?? undefined,
    }

    return this.deps.exerciseRepo.findEligible(params.userId, mergedFilters)
  }
}
