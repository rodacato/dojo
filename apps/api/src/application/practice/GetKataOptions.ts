import type { Kata } from '../../domain/content/kata'
import type { KataFilters, KataRepositoryPort } from '../../domain/content/ports'
import type { UserPreferencesPort } from '../../domain/identity/ports'
import { startOfDay, todaysKataId, type DailyKataCandidatesPort } from '../../domain/practice/daily-kata'
import type { UserId } from '../../domain/shared/types'

interface Deps {
  kataRepo: KataRepositoryPort
  dailyKatas: DailyKataCandidatesPort
  preferencesRepo: UserPreferencesPort
}

export class GetKataOptions {
  constructor(private readonly deps: Deps) {}

  async execute(params: { userId: UserId; filters: KataFilters; now?: Date }): Promise<Kata[]> {
    const now = params.now ?? new Date()
    const [prefs, pool] = await Promise.all([
      this.deps.preferencesRepo.findByUserId(params.userId),
      this.deps.dailyKatas.findDailyCandidates(params.userId, startOfDay(now)),
    ])

    const mergedFilters: KataFilters = {
      ...params.filters,
      userLevel: params.filters.userLevel ?? prefs?.level ?? undefined,
      interests: params.filters.interests ?? (prefs?.interests?.length ? prefs.interests : undefined),
      randomness: params.filters.randomness ?? prefs?.randomness ?? undefined,
      // Choosing today's kata here would spoil the daily surprise (ADR-034).
      excludeKataId: todaysKataId(pool, params.userId, now, prefs) ?? undefined,
    }

    return this.deps.kataRepo.findEligible(params.userId, mergedFilters)
  }
}
