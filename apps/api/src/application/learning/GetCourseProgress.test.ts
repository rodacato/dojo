import { describe, expect, it, vi } from 'vitest'
import type { ProgressOwner } from '../../domain/learning/ports'
import { GetCourseProgress } from './GetCourseProgress'

const userOwner: ProgressOwner = { kind: 'user', userId: 'user-1' }
const anonOwner: ProgressOwner = { kind: 'anonymous', sessionId: 'anon-1' }

describe('GetCourseProgress', () => {
  it('returns completed steps for a user who has progress', async () => {
    const progressRepo = {
      findByOwnerAndCourse: vi.fn().mockResolvedValue({
        owner: userOwner,
        courseId: 'course-1',
        completedSteps: ['step-a', 'step-b', 'step-c'],
        lastAccessedAt: new Date(),
      }),
      findAllForAnonymous: vi.fn(),
      save: vi.fn(),
      deleteAnonymous: vi.fn(),
    }

    const useCase = new GetCourseProgress({ progressRepo })
    const result = await useCase.execute(userOwner, 'course-1')

    expect(result).toEqual(['step-a', 'step-b', 'step-c'])
    expect(progressRepo.findByOwnerAndCourse).toHaveBeenCalledWith(userOwner, 'course-1')
  })

  it('returns empty array when no progress exists', async () => {
    const progressRepo = {
      findByOwnerAndCourse: vi.fn().mockResolvedValue(null),
      findAllForAnonymous: vi.fn(),
      save: vi.fn(),
      deleteAnonymous: vi.fn(),
    }

    const useCase = new GetCourseProgress({ progressRepo })
    const result = await useCase.execute(userOwner, 'course-1')

    expect(result).toEqual([])
  })

  it('loads progress for an anonymous owner', async () => {
    const progressRepo = {
      findByOwnerAndCourse: vi.fn().mockResolvedValue({
        owner: anonOwner,
        courseId: 'course-1',
        completedSteps: ['step-1'],
        lastAccessedAt: new Date(),
      }),
      findAllForAnonymous: vi.fn(),
      save: vi.fn(),
      deleteAnonymous: vi.fn(),
    }

    const useCase = new GetCourseProgress({ progressRepo })
    const result = await useCase.execute(anonOwner, 'course-1')

    expect(result).toEqual(['step-1'])
    expect(progressRepo.findByOwnerAndCourse).toHaveBeenCalledWith(anonOwner, 'course-1')
  })
})
