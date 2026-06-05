import { describe, expect, it, vi } from 'vitest'
import { Kata } from '../../domain/content/kata'
import { UserId } from '../../domain/shared/types'
import { GetKataOptions } from './GetKataOptions'

const makeKata = (title: string) =>
  Kata.create({
    title,
    description: 'A test kata',
    durationMinutes: 30,
    difficulty: 'medium',
    category: 'code-review',
    type: 'code',
    languages: ['typescript'],
    tags: ['testing'],
    topics: ['review'],
    createdBy: UserId('creator-1'),
    variations: [{ ownerRole: 'Tech Lead', ownerContext: 'Startup context' }],
  })

function makeDeps(overrides?: { prefs?: { level: 'junior' | 'mid' | 'senior'; interests: string[]; randomness: number } | null }) {
  const kataRepo = {
    findEligible: vi.fn().mockResolvedValue([makeKata('Ex 1'), makeKata('Ex 2')]),
    findById: vi.fn(),
    save: vi.fn(),
  }
  const preferencesRepo = {
    findByUserId: vi.fn().mockResolvedValue(overrides?.prefs ?? null),
  }
  return { kataRepo, preferencesRepo }
}

describe('GetKataOptions', () => {
  it('returns katas from repository', async () => {
    const deps = makeDeps()
    const useCase = new GetKataOptions(deps)
    const result = await useCase.execute({
      userId: UserId('user-1'),
      filters: { mood: 'focused', maxDuration: 30 },
    })

    expect(result).toHaveLength(2)
    expect(deps.preferencesRepo.findByUserId).toHaveBeenCalledWith(UserId('user-1'))
    expect(deps.kataRepo.findEligible).toHaveBeenCalledWith(UserId('user-1'), {
      mood: 'focused',
      maxDuration: 30,
    })
  })

  it('merges user preferences into filters', async () => {
    const deps = makeDeps({
      prefs: { level: 'senior', interests: ['backend', 'security'], randomness: 0.2 },
    })
    const useCase = new GetKataOptions(deps)
    await useCase.execute({
      userId: UserId('user-1'),
      filters: { mood: 'focused' },
    })

    expect(deps.kataRepo.findEligible).toHaveBeenCalledWith(UserId('user-1'), {
      mood: 'focused',
      userLevel: 'senior',
      interests: ['backend', 'security'],
      randomness: 0.2,
    })
  })

  it('filter params override preferences', async () => {
    const deps = makeDeps({
      prefs: { level: 'junior', interests: ['frontend'], randomness: 0.5 },
    })
    const useCase = new GetKataOptions(deps)
    await useCase.execute({
      userId: UserId('user-1'),
      filters: { userLevel: 'senior', interests: ['backend'], randomness: 0.1 },
    })

    expect(deps.kataRepo.findEligible).toHaveBeenCalledWith(UserId('user-1'), {
      userLevel: 'senior',
      interests: ['backend'],
      randomness: 0.1,
    })
  })

  it('returns empty array when no katas match', async () => {
    const deps = makeDeps()
    deps.kataRepo.findEligible.mockResolvedValue([])
    const useCase = new GetKataOptions(deps)
    const result = await useCase.execute({
      userId: UserId('user-1'),
      filters: {},
    })

    expect(result).toEqual([])
  })
})
