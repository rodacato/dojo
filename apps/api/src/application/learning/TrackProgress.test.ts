import { describe, expect, it, vi } from 'vitest'
import type { Scroll } from '../../domain/learning/scroll'
import type { ProgressOwner } from '../../domain/learning/ports'
import { TrackProgress } from './TrackProgress'

const userOwner: ProgressOwner = { kind: 'user', userId: 'user-1' }
const anonOwner: ProgressOwner = { kind: 'anonymous', sessionId: 'anon-1' }

function buildScroll(overrides: Partial<Scroll> = {}): Scroll {
  return {
    id: 'scroll-1',
    slug: 'test-scroll',
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
  scroll?: Scroll | null
} = {}) {
  const existing = overrides.existing === undefined ? null : overrides.existing
  const scroll = overrides.scroll === undefined ? buildScroll() : overrides.scroll

  const progressRepo = {
    findByOwnerAndScroll: vi
      .fn()
      .mockResolvedValue(
        existing
          ? { owner: userOwner, scrollId: 'scroll-1', lastAccessedAt: new Date(), ...existing }
          : null,
      ),
    findAllForAnonymous: vi.fn(),
    save: vi.fn(),
    deleteAnonymous: vi.fn(),
  }

  const scrollRepo = {
    findById: vi.fn().mockResolvedValue(scroll),
    findBySlug: vi.fn(),
    findAllPublished: vi.fn(),
    findAllPublic: vi.fn(),
  }

  const eventBus = {
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(),
  }

  return { progressRepo, scrollRepo, eventBus }
}

describe('TrackProgress', () => {
  it('creates new progress for a user when none exists', async () => {
    const deps = buildDeps()
    const useCase = new TrackProgress(deps)
    await useCase.execute({ owner: userOwner, scrollId: 'scroll-1', stepId: 'step-1' })

    expect(deps.progressRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: userOwner,
        scrollId: 'scroll-1',
        completedSteps: ['step-1'],
      }),
    )
  })

  it('appends step to existing progress', async () => {
    const deps = buildDeps({ existing: { completedSteps: ['step-1'] } })
    const useCase = new TrackProgress(deps)
    await useCase.execute({ owner: userOwner, scrollId: 'scroll-1', stepId: 'step-2' })

    expect(deps.progressRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ completedSteps: ['step-1', 'step-2'] }),
    )
  })

  it('is idempotent — does not duplicate steps', async () => {
    const deps = buildDeps({ existing: { completedSteps: ['step-1'] } })
    const useCase = new TrackProgress(deps)
    await useCase.execute({ owner: userOwner, scrollId: 'scroll-1', stepId: 'step-1' })

    expect(deps.progressRepo.save).not.toHaveBeenCalled()
  })

  it('tracks anonymous progress', async () => {
    const deps = buildDeps()
    const useCase = new TrackProgress(deps)
    await useCase.execute({ owner: anonOwner, scrollId: 'scroll-1', stepId: 'step-1' })

    expect(deps.progressRepo.save).toHaveBeenCalled()
    expect(deps.eventBus.publish).not.toHaveBeenCalled()
  })

  it('emits ScrollCompleted when a user finishes the last step', async () => {
    const deps = buildDeps({ existing: { completedSteps: ['step-1'] } })
    const useCase = new TrackProgress(deps)
    await useCase.execute({ owner: userOwner, scrollId: 'scroll-1', stepId: 'step-2' })

    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ScrollCompleted',
        aggregateId: 'scroll-1',
        userId: 'user-1',
        scrollSlug: 'test-scroll',
        totalSteps: 2,
      }),
    )
  })

  it('does not emit ScrollCompleted on intermediate steps', async () => {
    const scroll = buildScroll({
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
    const deps = buildDeps({ existing: { completedSteps: ['step-1'] }, scroll })
    const useCase = new TrackProgress(deps)
    await useCase.execute({ owner: userOwner, scrollId: 'scroll-1', stepId: 'step-2' })

    expect(deps.eventBus.publish).not.toHaveBeenCalled()
  })

  it('does not re-emit ScrollCompleted when all steps are already done', async () => {
    const deps = buildDeps({ existing: { completedSteps: ['step-1', 'step-2'] } })
    const useCase = new TrackProgress(deps)
    await useCase.execute({ owner: userOwner, scrollId: 'scroll-1', stepId: 'step-2' })

    // Idempotent short-circuit fires before we reach the event bus.
    expect(deps.progressRepo.save).not.toHaveBeenCalled()
    expect(deps.eventBus.publish).not.toHaveBeenCalled()
  })
})
