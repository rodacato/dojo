import { describe, expect, it, vi } from 'vitest'
import { TrackProgress } from './TrackProgress'

describe('TrackProgress', () => {
  it('creates new progress when none exists', async () => {
    const progressRepo = {
      findByUserAndCourse: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    }

    const useCase = new TrackProgress({ progressRepo })
    await useCase.execute({ userId: 'user-1', courseId: 'course-1', stepId: 'step-1' })

    expect(progressRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        courseId: 'course-1',
        completedSteps: ['step-1'],
      }),
    )
  })

  it('appends step to existing progress', async () => {
    const progressRepo = {
      findByUserAndCourse: vi.fn().mockResolvedValue({
        userId: 'user-1',
        courseId: 'course-1',
        completedSteps: ['step-1'],
        lastAccessedAt: new Date(),
      }),
      save: vi.fn(),
    }

    const useCase = new TrackProgress({ progressRepo })
    await useCase.execute({ userId: 'user-1', courseId: 'course-1', stepId: 'step-2' })

    expect(progressRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        completedSteps: ['step-1', 'step-2'],
      }),
    )
  })

  it('is idempotent — does not duplicate steps', async () => {
    const progressRepo = {
      findByUserAndCourse: vi.fn().mockResolvedValue({
        userId: 'user-1',
        courseId: 'course-1',
        completedSteps: ['step-1'],
        lastAccessedAt: new Date(),
      }),
      save: vi.fn(),
    }

    const useCase = new TrackProgress({ progressRepo })
    await useCase.execute({ userId: 'user-1', courseId: 'course-1', stepId: 'step-1' })

    expect(progressRepo.save).not.toHaveBeenCalled()
  })
})
