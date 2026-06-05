import type { BeltRank } from '@dojo/shared'

export interface BeltFactors {
  completed: number
  distinctClusters: number
  activeDays30: number
  daysAtRank: number
}

export interface Belt {
  rank: BeltRank
  factors: BeltFactors
}

/**
 * Advancement thresholds per [PRD-031](docs/prd/031-belt-progression-rubric.md).
 * Values are provisional v1 — recalculable from existing session history, no
 * migration required to revise. Each row is what a user must satisfy to be at
 * (or above) that belt.
 */
export const BELT_THRESHOLDS: Record<Exclude<BeltRank, 'white'>, BeltFactors> = {
  yellow: { completed: 10,  distinctClusters: 2, activeDays30: 5,  daysAtRank: 0   },
  green:  { completed: 40,  distinctClusters: 4, activeDays30: 10, daysAtRank: 21  },
  brown:  { completed: 120, distinctClusters: 6, activeDays30: 15, daysAtRank: 60  },
  black:  { completed: 300, distinctClusters: 8, activeDays30: 18, daysAtRank: 120 },
}

const ASCENDING_RANKS: BeltRank[] = ['white', 'yellow', 'green', 'brown', 'black']

/**
 * Pure computation. Given the four factors at evaluation time, returns the
 * highest belt rank the user has earned. `daysAtRank` is the count of days
 * the user has been at their PREVIOUS rank (i.e., cooldown gate); for the
 * white→yellow transition the cooldown is zero so any value passes.
 */
export function rankFromFactors(factors: BeltFactors): BeltRank {
  let current: BeltRank = 'white'
  for (const rank of ASCENDING_RANKS.slice(1) as Array<Exclude<BeltRank, 'white'>>) {
    const t = BELT_THRESHOLDS[rank]
    if (
      factors.completed >= t.completed &&
      factors.distinctClusters >= t.distinctClusters &&
      factors.activeDays30 >= t.activeDays30 &&
      factors.daysAtRank >= t.daysAtRank
    ) {
      current = rank
    } else {
      break
    }
  }
  return current
}
