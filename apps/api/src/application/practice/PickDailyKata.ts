import type { UserId } from '../../domain/shared/types'
import type { UserPreferencesPort } from '../../domain/identity/ports'
import { pickDailyKata, startOfDay, type DailyCandidate, type DailyKataCandidatesPort } from '../../domain/practice/daily-kata'

interface Deps {
  dailyKatas: DailyKataCandidatesPort
  preferencesRepo: UserPreferencesPort
}

export class PickDailyKata {
  constructor(private readonly deps: Deps) {}

  async execute(userId: UserId, now: Date = new Date()): Promise<DailyCandidate | null> {
    const [pool, prefs] = await Promise.all([
      this.deps.dailyKatas.findDailyCandidates(userId, startOfDay(now)),
      this.deps.preferencesRepo.findByUserId(userId),
    ])
    return pickDailyKata(pool, userId, now, prefs)
  }
}
