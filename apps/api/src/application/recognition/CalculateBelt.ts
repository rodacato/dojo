import type { SessionRepositoryPort } from '../../domain/practice/ports'
import type { KataRepositoryPort } from '../../domain/content/ports'
import { rankFromFactors, type Belt } from '../../domain/recognition/belt'
import type { UserId } from '../../domain/shared/types'

interface Deps {
  sessionRepo: SessionRepositoryPort
  kataRepo: KataRepositoryPort
}

/**
 * Computes a user's current belt rank + factors from session history.
 * Pure derivation — no persistence write. PRD-031 Option C: rank is a
 * function of completed katas, distinct topic clusters touched, active
 * days in the trailing 30, and days at the previous rank (cooldown).
 *
 * `daysAtRank` is recomputed by walking history. If perf becomes a
 * concern, persist belt transitions later — derivable, no migration debt.
 */
export class CalculateBelt {
  constructor(private readonly deps: Deps) {}

  async execute(userId: UserId): Promise<Belt> {
    // Day 5 deliverable — depends on infrastructure projections (Day 4).
    // Stubbed to white belt until SessionRepository exposes the trailing-30
    // active-days and topic-cluster aggregations. See Spec 028 §3.3 + §5.
    void this.deps.sessionRepo
    void this.deps.kataRepo
    void userId
    return {
      rank: rankFromFactors({
        completed: 0,
        distinctClusters: 0,
        activeDays30: 0,
        daysAtRank: 0,
      }),
      factors: { completed: 0, distinctClusters: 0, activeDays30: 0, daysAtRank: 0 },
    }
  }
}
