import type { Kata } from '../../domain/content/kata'
import type { KataFilters, KataRepositoryPort } from '../../domain/content/ports'
import type { UserPreferencesPort } from '../../domain/identity/ports'
import type { UserId } from '../../domain/shared/types'

interface Deps {
  kataRepo: KataRepositoryPort
  preferencesRepo: UserPreferencesPort
}

export class GetKataOptions {
  constructor(private readonly deps: Deps) {}

  async execute(params: { userId: UserId; filters: KataFilters }): Promise<Kata[]> {
    const prefs = await this.deps.preferencesRepo.findByUserId(params.userId)

    const mergedFilters: KataFilters = {
      ...params.filters,
      userLevel: params.filters.userLevel ?? prefs?.level ?? undefined,
      interests: params.filters.interests ?? (prefs?.interests?.length ? prefs.interests : undefined),
      randomness: params.filters.randomness ?? prefs?.randomness ?? undefined,
    }

    return this.deps.kataRepo.findEligible(params.userId, mergedFilters)
  }
}
