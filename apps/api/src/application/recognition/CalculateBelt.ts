import type { SessionRepositoryPort } from '../../domain/practice/ports'
import { beltRecordFromHistory, computeBeltFromHistory, type Belt, type BeltRecord } from '../../domain/recognition/belt'
import type { UserId } from '../../domain/shared/types'

interface Deps {
  sessionRepo: SessionRepositoryPort
  now?: () => Date
}

/**
 * Computes a user's current belt rank + factors from completed session
 * history (PRD-031 Option C). Pure derivation — no persistence write.
 * Sensei verdicts are intentionally NOT inputs to the rubric.
 */
export class CalculateBelt {
  private readonly now: () => Date

  constructor(private readonly deps: Deps) {
    this.now = deps.now ?? (() => new Date())
  }

  async execute(userId: UserId): Promise<Belt> {
    const history = await this.deps.sessionRepo.listPracticeHistory(userId)
    return computeBeltFromHistory(history, this.now())
  }

  async withRecord(userId: UserId): Promise<Belt & BeltRecord> {
    const history = await this.deps.sessionRepo.listPracticeHistory(userId)
    return beltRecordFromHistory(history, this.now())
  }
}
