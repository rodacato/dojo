import type { SessionRepositoryPort } from '../../domain/practice/ports'
import { computeBeltFromHistory, type Belt } from '../../domain/recognition/belt'
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
    const history = await this.deps.sessionRepo.listCompletedKataHistoryForBelt(userId)
    return computeBeltFromHistory(history, this.now())
  }
}
