import { describe, expect, it } from 'vitest'
import { KataId, UserId } from '../shared/types'
import { pickDailyKata, pickOneMore, pickTodaysKata, type DailyCandidate } from './daily-kata'

const NOW = new Date(2026, 9, 19, 9, 30)
const learner = UserId('11111111-1111-4111-8111-111111111111')

function candidate(id: string, lastPracticedAt: Date | null = null): DailyCandidate {
  return { kataId: KataId(id), durationMinutes: 5, lastPracticedAt }
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
      expect(pickOneMore(doneThisMorning, NOW, () => roll)?.kataId).toBe('b')
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
