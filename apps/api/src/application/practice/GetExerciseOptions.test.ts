import { describe, expect, it, vi } from 'vitest'
import { Exercise } from '../../domain/content/exercise'
import { UserId } from '../../domain/shared/types'

// Mock the db module before importing GetExerciseOptions
vi.mock('../../infrastructure/persistence/drizzle/client', () => ({
  db: {
    query: {
      userPreferences: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
  },
}))

import { GetExerciseOptions } from './GetExerciseOptions'

const makeExercise = (title: string) =>
  Exercise.create({
    title,
    description: 'A test exercise',
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

describe('GetExerciseOptions', () => {
  it('returns exercises from repository', async () => {
    const exercises = [makeExercise('Ex 1'), makeExercise('Ex 2')]
    const exerciseRepo = {
      findEligible: vi.fn().mockResolvedValue(exercises),
      findById: vi.fn(),
      save: vi.fn(),
    }

    const useCase = new GetExerciseOptions({ exerciseRepo })
    const result = await useCase.execute({
      userId: UserId('user-1'),
      filters: { mood: 'focused', maxDuration: 30 },
    })

    expect(result).toHaveLength(2)
    expect(exerciseRepo.findEligible).toHaveBeenCalledWith(UserId('user-1'), {
      mood: 'focused',
      maxDuration: 30,
    })
  })

  it('returns empty array when no exercises match', async () => {
    const exerciseRepo = {
      findEligible: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      save: vi.fn(),
    }

    const useCase = new GetExerciseOptions({ exerciseRepo })
    const result = await useCase.execute({
      userId: UserId('user-1'),
      filters: {},
    })

    expect(result).toEqual([])
  })
})
