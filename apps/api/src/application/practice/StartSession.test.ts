import { describe, expect, it, vi } from 'vitest'
import { Exercise } from '../../domain/content/exercise'
import { ExerciseNotFoundError } from '../../domain/shared/errors'
import { ExerciseId, UserId, VariationId } from '../../domain/shared/types'
import { InMemoryEventBus } from '../../infrastructure/events/InMemoryEventBus'
import { MockLLMAdapter } from '../../infrastructure/llm/MockLLMAdapter'
import { StartSession } from './StartSession'

const makeExercise = () =>
  Exercise.create({
    title: 'Test Exercise',
    description: 'A test code review exercise',
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

const makeStubSessionRepo = () => ({
  save: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findActiveByUserId: vi.fn().mockResolvedValue(null),
})

describe('StartSession', () => {
  it('creates a session and publishes SessionCreated', async () => {
    const exercise = makeExercise()
    const exerciseRepo = {
      findEligible: vi.fn(),
      findById: vi.fn().mockResolvedValue(exercise),
      save: vi.fn(),
    }
    const sessionRepo = makeStubSessionRepo()
    const llm = new MockLLMAdapter()
    const eventBus = new InMemoryEventBus()
    const published: string[] = []
    eventBus.subscribe('SessionCreated', async (e) => {
      published.push(e.type)
    })

    const useCase = new StartSession({ exerciseRepo, sessionRepo, llm, eventBus })
    const variation = exercise.variations[0]!

    const session = await useCase.execute({
      userId: UserId('user-1'),
      exerciseId: exercise.id,
      variationId: variation.id,
    })

    expect(session.status).toBe('active')
    expect(sessionRepo.save).toHaveBeenCalledWith(session)
    expect(published).toContain('SessionCreated')
  })

  it('throws ExerciseNotFoundError when exercise does not exist', async () => {
    const exerciseRepo = {
      findEligible: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    }
    const useCase = new StartSession({
      exerciseRepo,
      sessionRepo: makeStubSessionRepo(),
      llm: new MockLLMAdapter(),
      eventBus: new InMemoryEventBus(),
    })

    await expect(
      useCase.execute({
        userId: UserId('user-1'),
        exerciseId: ExerciseId('nonexistent'),
        variationId: VariationId('variation-1'),
      }),
    ).rejects.toThrow(ExerciseNotFoundError)
  })
})
