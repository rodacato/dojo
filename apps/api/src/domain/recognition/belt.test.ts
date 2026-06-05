import { describe, expect, it } from 'vitest'
import {
  BELT_THRESHOLDS,
  computeBeltFromHistory,
  countActiveDaysIn30,
  rankFromFactors,
  type KataHistoryEntry,
} from './belt'

const DAY_MS = 86_400_000
const day = (n: number) => new Date(Date.UTC(2026, 0, n, 12, 0, 0))

describe('rankFromFactors', () => {
  it('returns white when no thresholds met', () => {
    expect(
      rankFromFactors({ completed: 0, distinctClusters: 0, activeDays30: 0, daysAtRank: 0 }),
    ).toBe('white')
  })

  it('promotes through ranks as factors grow', () => {
    expect(rankFromFactors(BELT_THRESHOLDS.yellow)).toBe('yellow')
    expect(rankFromFactors(BELT_THRESHOLDS.green)).toBe('green')
    expect(rankFromFactors(BELT_THRESHOLDS.brown)).toBe('brown')
    expect(rankFromFactors(BELT_THRESHOLDS.black)).toBe('black')
  })

  it('stops at the first unmet threshold (cooldown gate respected)', () => {
    // Meets green's volume/diversity/activity but cooldown unmet → stays yellow
    const factors = { ...BELT_THRESHOLDS.green, daysAtRank: 0 }
    expect(rankFromFactors(factors)).toBe('yellow')
  })

  it('is monotone: every factor below black still returns black if all met', () => {
    expect(
      rankFromFactors({
        completed: 10_000,
        distinctClusters: 99,
        activeDays30: 30,
        daysAtRank: 9999,
      }),
    ).toBe('black')
  })
})

describe('countActiveDaysIn30', () => {
  it('counts distinct UTC dates within the 30-day window', () => {
    const ref = day(50)
    const dates = [
      day(10), // ref - 40d → outside
      day(12), // outside
      day(15), // ref - 35d → outside
      day(25), // ref - 25d → inside
      day(25), // duplicate same date → counted once
      day(40), // inside
      day(50), // inside
    ]
    expect(countActiveDaysIn30(dates, ref)).toBe(3)
  })

  it('returns 0 when all dates are older than 30 days', () => {
    expect(countActiveDaysIn30([day(1), day(2)], day(100))).toBe(0)
  })
})

describe('computeBeltFromHistory', () => {
  it('returns white belt for an empty history', () => {
    const result = computeBeltFromHistory([], day(100))
    expect(result.rank).toBe('white')
    expect(result.factors).toEqual({
      completed: 0,
      distinctClusters: 0,
      activeDays30: 0,
      daysAtRank: 0,
    })
  })

  it('promotes to yellow when thresholds met (no cooldown gate on white→yellow)', () => {
    // 10 sessions, 2 clusters (database + typescript), 10 distinct days in last 30
    const history: KataHistoryEntry[] = []
    for (let i = 0; i < 10; i++) {
      history.push({
        startedAt: day(50 + i),
        topics: i < 5 ? ['database', 'orm'] : ['typescript', 'type-safety'],
      })
    }
    const result = computeBeltFromHistory(history, day(60))
    expect(result.rank).toBe('yellow')
    expect(result.factors.completed).toBe(10)
    expect(result.factors.distinctClusters).toBe(2)
  })

  it('respects the cooldown for green (21 days at yellow before green possible)', () => {
    // Saturate green's volume/diversity/activity instantly — should still be yellow
    // because cooldown at yellow has not elapsed.
    const history: KataHistoryEntry[] = []
    for (let i = 0; i < 50; i++) {
      history.push({
        startedAt: day(100 + i * 0), // all same day — earns yellow instantly
        topics: ['database', 'typescript', 'system-design', 'api-versioning'],
      })
    }
    // Run for one more day to ensure the activity factor is satisfied
    for (let i = 0; i < 11; i++) {
      history.push({
        startedAt: day(100 + i),
        topics: ['database', 'typescript', 'system-design', 'api-versioning'],
      })
    }
    const result = computeBeltFromHistory(history, day(110))
    // Even with > 40 completed and > 4 clusters, < 21 days since yellow → still yellow
    expect(result.rank).toBe('yellow')
  })

  it('reaches green once cooldown + thresholds are satisfied', () => {
    const history: KataHistoryEntry[] = []
    // First 10 sessions on day 0..9 — earns yellow on day 9
    for (let i = 0; i < 10; i++) {
      history.push({
        startedAt: day(i),
        topics: ['database'],
      })
    }
    // Drip-feed sessions over the next 40 days to satisfy green
    // Need 40 total completed, 4 clusters, 10 active days in 30, 21 days at yellow
    for (let i = 0; i < 40; i++) {
      const dayOffset = 10 + i  // days 10..49
      const cluster =
        i < 10 ? 'typescript' : i < 20 ? 'system-design' : i < 30 ? 'api-versioning' : 'database'
      const topicByCluster: Record<string, string> = {
        typescript: 'typescript',
        'system-design': 'system-design',
        'api-versioning': 'api-versioning',
        database: 'database',
      }
      history.push({
        startedAt: day(dayOffset),
        topics: [topicByCluster[cluster]],
      })
    }
    const result = computeBeltFromHistory(history, day(50))
    expect(result.rank).toBe('green')
    expect(result.factors.completed).toBe(50)
    expect(result.factors.distinctClusters).toBeGreaterThanOrEqual(4)
  })

  it('computes daysAtRank as zero when still on white', () => {
    const result = computeBeltFromHistory([], day(100))
    expect(result.factors.daysAtRank).toBe(0)
  })

  it('reports current activeDays30 from now, not from the last session', () => {
    const history: KataHistoryEntry[] = [
      { startedAt: day(0), topics: ['database'] },
      { startedAt: day(1), topics: ['database'] },
    ]
    // "Now" is far away from the sessions — activeDays30 should be 0
    const result = computeBeltFromHistory(history, day(100))
    expect(result.factors.activeDays30).toBe(0)
    expect(result.factors.completed).toBe(2)
  })

  it('silently skips unknown topic slugs (legacy data)', () => {
    const history: KataHistoryEntry[] = [
      { startedAt: day(0), topics: ['database', 'unknown-legacy-topic'] },
    ]
    const result = computeBeltFromHistory(history, day(0))
    expect(result.factors.distinctClusters).toBe(1) // only 'database' counted
  })
})

describe('CalculateBelt — date semantics', () => {
  it('uses MS_PER_DAY arithmetic for cross-day boundaries', () => {
    const earlier = new Date('2026-01-01T23:59:59.000Z')
    const later = new Date('2026-01-22T23:59:59.000Z') // exactly 21 days later
    const diff = Math.floor((later.getTime() - earlier.getTime()) / DAY_MS)
    expect(diff).toBe(21)
  })
})
