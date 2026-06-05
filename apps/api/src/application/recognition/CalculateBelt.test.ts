import { describe, expect, it, vi } from 'vitest'
import { CalculateBelt } from './CalculateBelt'
import type { SessionRepositoryPort } from '../../domain/practice/ports'
import { UserId } from '../../domain/shared/types'

const day = (n: number) => new Date(Date.UTC(2026, 0, n, 12, 0, 0))

function makeSessionRepo(
  history: Awaited<ReturnType<SessionRepositoryPort['listCompletedKataHistoryForBelt']>>,
): SessionRepositoryPort {
  return {
    save: vi.fn(),
    updateBody: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    findActiveByUserId: vi.fn(),
    listCompletedKataHistoryForBelt: vi.fn().mockResolvedValue(history),
  }
}

describe('CalculateBelt', () => {
  it('returns white belt when the user has no completed sessions', async () => {
    const useCase = new CalculateBelt({ sessionRepo: makeSessionRepo([]), now: () => day(100) })
    const belt = await useCase.execute(UserId('user-1'))

    expect(belt.rank).toBe('white')
    expect(belt.factors).toEqual({
      completed: 0,
      distinctClusters: 0,
      activeDays30: 0,
      daysAtRank: 0,
    })
  })

  it('promotes to yellow when history meets the yellow thresholds', async () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      startedAt: day(50 + i),
      topics: i < 5 ? ['database'] : ['typescript'],
    }))

    const useCase = new CalculateBelt({ sessionRepo: makeSessionRepo(history), now: () => day(60) })
    const belt = await useCase.execute(UserId('user-2'))

    expect(belt.rank).toBe('yellow')
    expect(belt.factors.completed).toBe(10)
    expect(belt.factors.distinctClusters).toBe(2)
  })

  it('queries the repo by the given userId', async () => {
    const repo = makeSessionRepo([])
    const useCase = new CalculateBelt({ sessionRepo: repo, now: () => day(0) })
    await useCase.execute(UserId('user-xyz'))

    expect(repo.listCompletedKataHistoryForBelt).toHaveBeenCalledWith('user-xyz')
  })

  it('accepts a now() override for deterministic tests', async () => {
    const fixedNow = day(42)
    const useCase = new CalculateBelt({ sessionRepo: makeSessionRepo([]), now: () => fixedNow })
    const belt = await useCase.execute(UserId('user-3'))

    expect(belt.factors.activeDays30).toBe(0)
  })
})
