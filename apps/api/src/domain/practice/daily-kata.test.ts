import { describe, expect, it } from 'vitest'
import { KataId, UserId } from '../shared/types'
import { pickDailyKata, pickOneMore, pickTodaysKata, type DailyCandidate } from './daily-kata'

const NOW = new Date(2026, 9, 19, 9, 30)
const learner = UserId('11111111-1111-4111-8111-111111111111')

function candidate(id: string, lastPracticedAt: Date | null = null, over: Partial<DailyCandidate> = {}): DailyCandidate {
  return { kataId: KataId(id), durationMinutes: 5, category: 'debugging', difficulty: 'easy', lastPracticedAt, ...over }
}

const catalog = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => candidate(id))

describe('pickTodaysKata', () => {
  it('gives the same kata all day, so leaving and coming back is not a reroll', () => {
    const morning = pickTodaysKata(catalog, learner, new Date(2026, 9, 19, 0, 5))
    const night = pickTodaysKata(catalog, learner, new Date(2026, 9, 19, 23, 55))
    expect(night).toEqual(morning)
  })

  it('moves on to other kata across days', () => {
    const week = Array.from({ length: 7 }, (_, day) => pickTodaysKata(catalog, learner, new Date(2026, 9, 19 + day))?.kataId)
    expect(new Set(week).size).toBeGreaterThan(1)
  })

  it('prefers kata the learner has not practiced in the last six months', () => {
    const lastWeek = new Date(2026, 9, 12)
    const mostlyDone = catalog.map((c) => (c.kataId === 'e' ? c : { ...c, lastPracticedAt: lastWeek }))
    expect(pickTodaysKata(mostlyDone, learner, NOW)?.kataId).toBe('e')
  })

  it('repeats a kata rather than giving nothing once all of them were practiced', () => {
    const allDone = catalog.map((c) => ({ ...c, lastPracticedAt: new Date(2026, 9, 1) }))
    expect(pickTodaysKata(allDone, learner, NOW)).not.toBeNull()
  })

  it('gives nothing when the instance has no micro kata', () => {
    expect(pickTodaysKata([], learner, NOW)).toBeNull()
  })
})

describe('pickOneMore', () => {
  it('never hands back a kata already practiced today', () => {
    const doneThisMorning = [candidate('a', new Date(2026, 9, 19, 8)), candidate('b')]
    for (const roll of [0, 0.5, 0.99]) {
      expect(pickOneMore(doneThisMorning, NOW, null, () => roll)?.kataId).toBe('b')
    }
  })
})

describe('pickDailyKata', () => {
  it('switches to one more once a micro kata was practiced today', () => {
    const todays = pickTodaysKata(catalog, learner, NOW)!
    const afterIt = catalog.map((c) => (c.kataId === todays.kataId ? { ...c, lastPracticedAt: new Date(2026, 9, 19, 8) } : c))
    for (let i = 0; i < 20; i++) {
      expect(pickDailyKata(afterIt, learner, NOW)?.kataId).not.toBe(todays.kataId)
    }
  })
})

describe('preferences (D57)', () => {
  const mixed = [
    candidate('sql-hard', null, { category: 'sql', difficulty: 'hard' }),
    candidate('sql-easy', null, { category: 'sql', difficulty: 'easy' }),
    candidate('css-hard', null, { category: 'frontend', difficulty: 'hard' }),
    candidate('css-easy', null, { category: 'frontend', difficulty: 'easy' }),
  ]
  const focused = { level: 'senior' as const, interests: ['sql'], randomness: 0 }

  it('picks the kata that fits both the interests and the level when the learner wants focus', () => {
    const days = Array.from({ length: 10 }, (_, day) => pickTodaysKata(mixed, learner, new Date(2026, 9, 19 + day), focused)?.kataId)
    expect(new Set(days)).toEqual(new Set(['sql-hard']))
  })

  it('weighs nothing at full randomness, so the whole catalog stays in play', () => {
    const loose = { ...focused, randomness: 1 }
    const days = Array.from({ length: 30 }, (_, day) => pickTodaysKata(mixed, learner, new Date(2026, 9, 1 + day), loose)?.kataId)
    expect(new Set(days).size).toBeGreaterThan(1)
  })

  it('still gives a kata when nothing matches the preferences', () => {
    const nothingFits = { level: 'senior' as const, interests: ['devops'], randomness: 0 }
    const easyOnly = mixed.filter((c) => c.difficulty === 'easy')
    expect(pickTodaysKata(easyOnly, learner, NOW, nothingFits)).not.toBeNull()
  })

  it('does not let a fitting kata already practiced recently beat a fresh one', () => {
    const lastWeek = new Date(2026, 9, 12)
    const sqlHardDone = mixed.map((c) => (c.kataId === 'sql-hard' ? { ...c, lastPracticedAt: lastWeek } : c))
    expect(pickTodaysKata(sqlHardDone, learner, NOW, focused)?.kataId).not.toBe('sql-hard')
  })

  it('applies to one more as well', () => {
    const doneSqlEasy = mixed.map((c) => (c.kataId === 'sql-easy' ? { ...c, lastPracticedAt: new Date(2026, 9, 19, 8) } : c))
    for (const roll of [0, 0.5, 0.99]) {
      expect(pickOneMore(doneSqlEasy, NOW, focused, () => roll)?.kataId).toBe('sql-hard')
    }
  })
})
