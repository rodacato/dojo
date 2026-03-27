import { describe, expect, it, vi } from 'vitest'
import { GetCourseProgress } from './GetCourseProgress'

describe('GetCourseProgress', () => {
  it('returns completed steps for a user who has progress', async () => {
    const progressRepo = {
      findByUserAndCourse: vi.fn().mockResolvedValue({
        userId: 'user-1',
        courseId: 'course-1',
        completedSteps: ['step-a', 'step-b', 'step-c'],
        lastAccessedAt: new Date(),
      }),
      save: vi.fn(),
    }

    const useCase = new GetCourseProgress({ progressRepo })
    const result = await useCase.execute('user-1', 'course-1')

    expect(result).toEqual(['step-a', 'step-b', 'step-c'])
    expect(progressRepo.findByUserAndCourse).toHaveBeenCalledWith('user-1', 'course-1')
  })

  it('returns empty array when user has no progress', async () => {
    const progressRepo = {
      findByUserAndCourse: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    }

    const useCase = new GetCourseProgress({ progressRepo })
    const result = await useCase.execute('user-1', 'course-1')

    expect(result).toEqual([])
  })
})
