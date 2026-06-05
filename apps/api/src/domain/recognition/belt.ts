import { topicClustersFor, type BeltRank } from '@dojo/shared'

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

export interface KataHistoryEntry {
  startedAt: Date
  topics: string[]
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

function nextRankAbove(rank: BeltRank): Exclude<BeltRank, 'white'> | null {
  const idx = ASCENDING_RANKS.indexOf(rank)
  if (idx < 0 || idx >= ASCENDING_RANKS.length - 1) return null
  return ASCENDING_RANKS[idx + 1] as Exclude<BeltRank, 'white'>
}

const MS_PER_DAY = 86_400_000

function utcDayString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Counts distinct UTC calendar dates in `dates` within the 30-day window
 * ending at `referenceAt` (inclusive). Used by the belt rubric's activeDays30
 * factor.
 */
export function countActiveDaysIn30(dates: readonly Date[], referenceAt: Date): number {
  const windowStart = referenceAt.getTime() - 30 * MS_PER_DAY
  const seen = new Set<string>()
  for (const d of dates) {
    const t = d.getTime()
    if (t >= windowStart && t <= referenceAt.getTime()) {
      seen.add(utcDayString(d))
    }
  }
  return seen.size
}

function daysBetween(earlier: Date, later: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / MS_PER_DAY)
}

/**
 * Walks completed kata history forward through time, maintaining the user's
 * current belt rank and the timestamp at which they entered it. Each session
 * may trigger at most one promotion — when its accumulated factors satisfy
 * the next rank's thresholds AND the cooldown at the previous rank has
 * elapsed. Returns the rank at "now" and the four factors as of now.
 *
 * Honors PRD-031 Option C: sensei verdicts are NOT inputs. The rank derives
 * from volume, topic-cluster diversity, calendar activity, and cooldown.
 */
export function computeBeltFromHistory(
  history: readonly KataHistoryEntry[],
  now: Date,
): Belt {
  let rank: BeltRank = 'white'
  let enteredRankAt: Date | null = null

  let completed = 0
  const clusters = new Set<string>()
  const dates: Date[] = []

  for (const entry of history) {
    completed++
    for (const c of topicClustersFor(entry.topics)) clusters.add(c)
    dates.push(entry.startedAt)

    const activeDays30 = countActiveDaysIn30(dates, entry.startedAt)
    const daysAtRank = enteredRankAt ? daysBetween(enteredRankAt, entry.startedAt) : Infinity

    const next = nextRankAbove(rank)
    if (!next) continue
    const t = BELT_THRESHOLDS[next]
    if (
      completed >= t.completed &&
      clusters.size >= t.distinctClusters &&
      activeDays30 >= t.activeDays30 &&
      daysAtRank >= t.daysAtRank
    ) {
      rank = next
      enteredRankAt = entry.startedAt
    }
  }

  return {
    rank,
    factors: {
      completed,
      distinctClusters: clusters.size,
      activeDays30: countActiveDaysIn30(dates, now),
      daysAtRank: enteredRankAt ? daysBetween(enteredRankAt, now) : 0,
    },
  }
}
