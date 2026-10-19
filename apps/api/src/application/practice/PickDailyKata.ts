import type { UserId } from '../../domain/shared/types'
import { pickDailyKata, type DailyCandidate, type DailyKataCandidatesPort } from '../../domain/practice/daily-kata'

interface Deps {
  dailyKatas: DailyKataCandidatesPort
}

export class PickDailyKata {
  constructor(private readonly deps: Deps) {}

  async execute(userId: UserId, now: Date = new Date()): Promise<DailyCandidate | null> {
    const candidates = await this.deps.dailyKatas.findDailyCandidates(userId)
    return pickDailyKata(candidates, userId, now)
  }
}
