import { describe, expect, it, vi } from 'vitest'
import { Kata } from '../../domain/content/kata'
import { KataId, UserId } from '../../domain/shared/types'
import { GetKataById } from './GetKataById'

const makeKata = () =>
  Kata.create({
    title: 'Test Kata',
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

describe('GetKataById', () => {
  it('returns kata when found', async () => {
    const kata = makeKata()
    const kataRepo = {
      findEligible: vi.fn(),
      findById: vi.fn().mockResolvedValue(kata),
      save: vi.fn(),
    }

    const useCase = new GetKataById({ kataRepo })
    const result = await useCase.execute(kata.id)

    expect(result).toBe(kata)
    expect(kataRepo.findById).toHaveBeenCalledWith(kata.id)
  })

  it('returns null when kata does not exist', async () => {
    const kataRepo = {
      findEligible: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    }

    const useCase = new GetKataById({ kataRepo })
    const result = await useCase.execute(KataId('nonexistent'))

    expect(result).toBeNull()
  })
})
