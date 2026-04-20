import { describe, expect, it, vi } from 'vitest'
import type { Course } from '../../domain/learning/course'
import type { ProgressOwner } from '../../domain/learning/ports'
import { TrackProgress } from './TrackProgress'

const userOwner: ProgressOwner = { kind: 'user', userId: 'user-1' }
const anonOwner: ProgressOwner = { kind: 'anonymous', sessionId: 'anon-1' }

function buildCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'course-1',
    slug: 'test-course',
    title: 'Test',
    description: '',
    language: 'typescript',
    accentColor: '#000',
    status: 'published',
    isPublic: true,
    externalReferences: [],
    lessons: [
      {
        id: 'l1',
        order: 1,
        title: 'Lesson',
        steps: [
          { id: 'step-1', order: 1, type: 'exercise', title: null, instruction: '', starterCode: null, testCode: null, hint: null, solution: null, alternativeApproach: null },
          { id: 'step-2', order: 2, type: 'exercise', title: null, instruction: '', starterCode: null, testCode: null, hint: null, solution: null, alternativeApproach: null },
        ],
      },
    ],
    ...overrides,
  }
}

function buildDeps(overrides: {
  existing?: { completedSteps: string[] } | null
  course?: Course | null
} = {}) {
  const existing = overrides.existing === undefined ? null : overrides.existing
  const course = overrides.course === undefined ? buildCourse() : overrides.course

  const progressRepo = {
    findByOwnerAndCourse: vi
      .fn()
      .mockResolvedValue(
        existing
          ? { owner: userOwner, courseId: 'course-1', lastAccessedAt: new Date(), ...existing }
          : null,
      ),
    findAllForAnonymous: vi.fn(),
    save: vi.fn(),
    deleteAnonymous: vi.fn(),
  }

  const courseRepo = {
    findById: vi.fn().mockResolvedValue(course),
    findBySlug: vi.fn(),
    findAllPublished: vi.fn(),
    findAllPublic: vi.fn(),
  }

  const eventBus = {
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(),
  }

  return { progressRepo, courseRepo, eventBus }
}

describe('TrackProgress', () => {
  it('creates new progress for a user when none exists', async () => {
    const deps = buildDeps()
    const useCase = new TrackProgress(deps)
    await useCase.execute({ owner: userOwner, courseId: 'course-1', stepId: 'step-1' })

    expect(deps.progressRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: userOwner,
        courseId: 'course-1',
        completedSteps: ['step-1'],
      }),
    )
  })

  it('appends step to existing progress', async () => {
    const deps = buildDeps({ existing: { completedSteps: ['step-1'] } })
    const useCase = new TrackProgress(deps)
    await useCase.execute({ owner: userOwner, courseId: 'course-1', stepId: 'step-2' })

    expect(deps.progressRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ completedSteps: ['step-1', 'step-2'] }),
    )
  })

  it('is idempotent — does not duplicate steps', async () => {
    const deps = buildDeps({ existing: { completedSteps: ['step-1'] } })
    const useCase = new TrackProgress(deps)
    await useCase.execute({ owner: userOwner, courseId: 'course-1', stepId: 'step-1' })

    expect(deps.progressRepo.save).not.toHaveBeenCalled()
  })

  it('tracks anonymous progress', async () => {
    const deps = buildDeps()
    const useCase = new TrackProgress(deps)
    await useCase.execute({ owner: anonOwner, courseId: 'course-1', stepId: 'step-1' })

    expect(deps.progressRepo.save).toHaveBeenCalled()
    expect(deps.eventBus.publish).not.toHaveBeenCalled()
  })

  it('emits CourseCompleted when a user finishes the last step', async () => {
    const deps = buildDeps({ existing: { completedSteps: ['step-1'] } })
    const useCase = new TrackProgress(deps)
    await useCase.execute({ owner: userOwner, courseId: 'course-1', stepId: 'step-2' })

    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CourseCompleted',
        aggregateId: 'course-1',
        userId: 'user-1',
        courseSlug: 'test-course',
        totalSteps: 2,
      }),
    )
  })

  it('does not emit CourseCompleted on intermediate steps', async () => {
    const course = buildCourse({
      lessons: [
        {
          id: 'l1',
          order: 1,
          title: 'Lesson',
          steps: [
            { id: 'step-1', order: 1, type: 'exercise', title: null, instruction: '', starterCode: null, testCode: null, hint: null, solution: null, alternativeApproach: null },
            { id: 'step-2', order: 2, type: 'exercise', title: null, instruction: '', starterCode: null, testCode: null, hint: null, solution: null, alternativeApproach: null },
            { id: 'step-3', order: 3, type: 'exercise', title: null, instruction: '', starterCode: null, testCode: null, hint: null, solution: null, alternativeApproach: null },
          ],
        },
      ],
    })
    const deps = buildDeps({ existing: { completedSteps: ['step-1'] }, course })
    const useCase = new TrackProgress(deps)
    await useCase.execute({ owner: userOwner, courseId: 'course-1', stepId: 'step-2' })

    expect(deps.eventBus.publish).not.toHaveBeenCalled()
  })

  it('does not re-emit CourseCompleted when all steps are already done', async () => {
    const deps = buildDeps({ existing: { completedSteps: ['step-1', 'step-2'] } })
    const useCase = new TrackProgress(deps)
    await useCase.execute({ owner: userOwner, courseId: 'course-1', stepId: 'step-2' })

    // Idempotent short-circuit fires before we reach the event bus.
    expect(deps.progressRepo.save).not.toHaveBeenCalled()
    expect(deps.eventBus.publish).not.toHaveBeenCalled()
  })
})
