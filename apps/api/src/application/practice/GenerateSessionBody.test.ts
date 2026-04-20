import { describe, expect, it, vi } from 'vitest'
import { Exercise } from '../../domain/content/exercise'
import { ExerciseId, SessionId, UserId, VariationId } from '../../domain/shared/types'
import { GenerateSessionBody } from './GenerateSessionBody'

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
  save: vi.fn(),
  updateBody: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn(),
  findActiveByUserId: vi.fn(),
})

describe('GenerateSessionBody', () => {
  it('generates body via LLM and updates session', async () => {
    const exercise = makeExercise()
    const variation = exercise.variations[0]!
    const sessionRepo = makeStubSessionRepo()
    const llm = {
      evaluate: vi.fn(),
      generateSessionBody: vi.fn().mockResolvedValue('You are reviewing a PR that...'),
      nudge: vi.fn(),
    }
    const exerciseRepo = {
      findEligible: vi.fn(),
      findById: vi.fn().mockResolvedValue(exercise),
      save: vi.fn(),
    }

    const useCase = new GenerateSessionBody({ exerciseRepo, sessionRepo, llm })
    await useCase.execute({
      sessionId: SessionId('session-1'),
      exerciseId: exercise.id,
      variationId: variation.id,
    })

    expect(llm.generateSessionBody).toHaveBeenCalledWith({
      ownerRole: 'Tech Lead',
      ownerContext: 'Startup context',
      exerciseDescription: 'A test code review exercise',
    })
    expect(sessionRepo.updateBody).toHaveBeenCalledWith(SessionId('session-1'), 'You are reviewing a PR that...')
  })

  it('does nothing when exercise is not found', async () => {
    const sessionRepo = makeStubSessionRepo()
    const llm = { evaluate: vi.fn(), generateSessionBody: vi.fn(), nudge: vi.fn() }
    const exerciseRepo = {
      findEligible: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    }

    const useCase = new GenerateSessionBody({ exerciseRepo, sessionRepo, llm })
    await useCase.execute({
      sessionId: SessionId('session-1'),
      exerciseId: ExerciseId('nonexistent'),
      variationId: VariationId('var-1'),
    })

    expect(llm.generateSessionBody).not.toHaveBeenCalled()
    expect(sessionRepo.updateBody).not.toHaveBeenCalled()
  })

  it('does nothing when variation is not found', async () => {
    const exercise = makeExercise()
    const sessionRepo = makeStubSessionRepo()
    const llm = { evaluate: vi.fn(), generateSessionBody: vi.fn(), nudge: vi.fn() }
    const exerciseRepo = {
      findEligible: vi.fn(),
      findById: vi.fn().mockResolvedValue(exercise),
      save: vi.fn(),
    }

    const useCase = new GenerateSessionBody({ exerciseRepo, sessionRepo, llm })
    await useCase.execute({
      sessionId: SessionId('session-1'),
      exerciseId: exercise.id,
      variationId: VariationId('nonexistent-var'),
    })

    expect(llm.generateSessionBody).not.toHaveBeenCalled()
    expect(sessionRepo.updateBody).not.toHaveBeenCalled()
  })
})
