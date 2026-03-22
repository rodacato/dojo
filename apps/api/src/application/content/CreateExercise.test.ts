import { describe, expect, it, vi } from 'vitest'
import { UserId } from '../../domain/shared/types'
import { CreateExercise } from './CreateExercise'

describe('CreateExercise', () => {
  it('creates exercise and saves to repository', async () => {
    const exerciseRepo = {
      findEligible: vi.fn(),
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    }

    const useCase = new CreateExercise({ exerciseRepo })
    const result = await useCase.execute({
      title: 'N+1 Query Review',
      description: 'Review a PR with an N+1 query problem',
      durationMinutes: 20,
      difficulty: 'medium',
      type: 'code',
      languages: ['typescript', 'sql'],
      tags: ['database', 'performance'],
      topics: ['n-plus-one', 'orm'],
      createdBy: UserId('creator-1'),
      variations: [
        { ownerRole: 'Senior DBA', ownerContext: 'E-commerce platform with 10M rows' },
        { ownerRole: 'Tech Lead', ownerContext: 'Startup with growing data' },
      ],
    })

    expect(result.id).toBeDefined()
    expect(typeof result.id).toBe('string')
    expect(exerciseRepo.save).toHaveBeenCalledTimes(1)

    const savedExercise = exerciseRepo.save.mock.calls[0]![0]!
    expect(savedExercise.title).toBe('N+1 Query Review')
    expect(savedExercise.variations).toHaveLength(2)
    expect(savedExercise.status).toBe('draft')
  })
})
