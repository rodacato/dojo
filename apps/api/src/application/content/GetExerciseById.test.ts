import { describe, expect, it, vi } from 'vitest'
import { Exercise } from '../../domain/content/exercise'
import { ExerciseId, UserId } from '../../domain/shared/types'
import { GetExerciseById } from './GetExerciseById'

const makeExercise = () =>
  Exercise.create({
    title: 'Test Exercise',
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

describe('GetExerciseById', () => {
  it('returns exercise when found', async () => {
    const exercise = makeExercise()
    const exerciseRepo = {
      findEligible: vi.fn(),
      findById: vi.fn().mockResolvedValue(exercise),
      save: vi.fn(),
    }

    const useCase = new GetExerciseById({ exerciseRepo })
    const result = await useCase.execute(exercise.id)

    expect(result).toBe(exercise)
    expect(exerciseRepo.findById).toHaveBeenCalledWith(exercise.id)
  })

  it('returns null when exercise does not exist', async () => {
    const exerciseRepo = {
      findEligible: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    }

    const useCase = new GetExerciseById({ exerciseRepo })
    const result = await useCase.execute(ExerciseId('nonexistent'))

    expect(result).toBeNull()
  })
})
