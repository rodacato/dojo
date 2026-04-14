import { describe, expect, it, vi } from 'vitest'
import type { ProgressOwner } from '../../domain/learning/ports'
import { TrackProgress } from './TrackProgress'

const userOwner: ProgressOwner = { kind: 'user', userId: 'user-1' }
const anonOwner: ProgressOwner = { kind: 'anonymous', sessionId: 'anon-1' }

describe('TrackProgress', () => {
  it('creates new progress for a user when none exists', async () => {
    const progressRepo = {
      findByOwnerAndCourse: vi.fn().mockResolvedValue(null),
      findAllForAnonymous: vi.fn(),
      save: vi.fn(),
      deleteAnonymous: vi.fn(),
    }

    const useCase = new TrackProgress({ progressRepo })
    await useCase.execute({ owner: userOwner, courseId: 'course-1', stepId: 'step-1' })

    expect(progressRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: userOwner,
        courseId: 'course-1',
        completedSteps: ['step-1'],
      }),
    )
  })

  it('appends step to existing progress', async () => {
    const progressRepo = {
      findByOwnerAndCourse: vi.fn().mockResolvedValue({
        owner: userOwner,
        courseId: 'course-1',
        completedSteps: ['step-1'],
        lastAccessedAt: new Date(),
      }),
      findAllForAnonymous: vi.fn(),
      save: vi.fn(),
      deleteAnonymous: vi.fn(),
    }

    const useCase = new TrackProgress({ progressRepo })
    await useCase.execute({ owner: userOwner, courseId: 'course-1', stepId: 'step-2' })

    expect(progressRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        completedSteps: ['step-1', 'step-2'],
      }),
    )
  })

  it('is idempotent — does not duplicate steps', async () => {
    const progressRepo = {
      findByOwnerAndCourse: vi.fn().mockResolvedValue({
        owner: userOwner,
        courseId: 'course-1',
        completedSteps: ['step-1'],
        lastAccessedAt: new Date(),
      }),
      findAllForAnonymous: vi.fn(),
      save: vi.fn(),
      deleteAnonymous: vi.fn(),
    }

    const useCase = new TrackProgress({ progressRepo })
    await useCase.execute({ owner: userOwner, courseId: 'course-1', stepId: 'step-1' })

    expect(progressRepo.save).not.toHaveBeenCalled()
  })

  it('tracks anonymous progress', async () => {
    const progressRepo = {
      findByOwnerAndCourse: vi.fn().mockResolvedValue(null),
      findAllForAnonymous: vi.fn(),
      save: vi.fn(),
      deleteAnonymous: vi.fn(),
    }

    const useCase = new TrackProgress({ progressRepo })
    await useCase.execute({ owner: anonOwner, courseId: 'course-1', stepId: 'step-1' })

    expect(progressRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: anonOwner,
        courseId: 'course-1',
        completedSteps: ['step-1'],
      }),
    )
  })
})
