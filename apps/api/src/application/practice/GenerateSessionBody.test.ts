import { describe, expect, it, vi } from 'vitest'
import { Kata } from '../../domain/content/kata'
import { KataId, SessionId, UserId, VariationId } from '../../domain/shared/types'
import { GenerateSessionBody } from './GenerateSessionBody'

const makeKata = () =>
  Kata.create({
    title: 'Test Kata',
    description: 'A test code review kata',
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
  delete: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn(),
  findActiveByUserId: vi.fn(),
      listCompletedKataHistoryForBelt: vi.fn(),
})

describe('GenerateSessionBody', () => {
  it('generates body via LLM and updates session', async () => {
    const kata = makeKata()
    const variation = kata.variations[0]!
    const sessionRepo = makeStubSessionRepo()
    const llm = {
      evaluate: vi.fn(),
      generateSessionBody: vi.fn().mockResolvedValue('You are reviewing a PR that...'),
      generateSessionBodyStream: vi.fn(),
      nudge: vi.fn(),
      askSensei: vi.fn(),
    }
    const kataRepo = {
      findEligible: vi.fn(),
      findById: vi.fn().mockResolvedValue(kata),
      save: vi.fn(),
    }

    const useCase = new GenerateSessionBody({ kataRepo, sessionRepo, llm })
    await useCase.execute({
      sessionId: SessionId('session-1'),
      kataId: kata.id,
      variationId: variation.id,
    })

    expect(llm.generateSessionBody).toHaveBeenCalledWith({
      ownerRole: 'Tech Lead',
      ownerContext: 'Startup context',
      kataDescription: 'A test code review kata',
    })
    expect(sessionRepo.updateBody).toHaveBeenCalledWith(SessionId('session-1'), 'You are reviewing a PR that...')
  })

  it('deletes session when kata is not found', async () => {
    const sessionRepo = makeStubSessionRepo()
    const llm = { evaluate: vi.fn(), generateSessionBody: vi.fn(), generateSessionBodyStream: vi.fn(), nudge: vi.fn(), askSensei: vi.fn() }
    const kataRepo = {
      findEligible: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    }

    const useCase = new GenerateSessionBody({ kataRepo, sessionRepo, llm })
    await useCase.execute({
      sessionId: SessionId('session-1'),
      kataId: KataId('nonexistent'),
      variationId: VariationId('var-1'),
    })

    expect(llm.generateSessionBody).not.toHaveBeenCalled()
    expect(sessionRepo.updateBody).not.toHaveBeenCalled()
    expect(sessionRepo.delete).toHaveBeenCalledWith(SessionId('session-1'))
  })

  it('deletes session when variation is not found', async () => {
    const kata = makeKata()
    const sessionRepo = makeStubSessionRepo()
    const llm = { evaluate: vi.fn(), generateSessionBody: vi.fn(), generateSessionBodyStream: vi.fn(), nudge: vi.fn(), askSensei: vi.fn() }
    const kataRepo = {
      findEligible: vi.fn(),
      findById: vi.fn().mockResolvedValue(kata),
      save: vi.fn(),
    }

    const useCase = new GenerateSessionBody({ kataRepo, sessionRepo, llm })
    await useCase.execute({
      sessionId: SessionId('session-1'),
      kataId: kata.id,
      variationId: VariationId('nonexistent-var'),
    })

    expect(llm.generateSessionBody).not.toHaveBeenCalled()
    expect(sessionRepo.updateBody).not.toHaveBeenCalled()
    expect(sessionRepo.delete).toHaveBeenCalledWith(SessionId('session-1'))
  })

  it('deletes session and reports error when LLM throws', async () => {
    const kata = makeKata()
    const variation = kata.variations[0]!
    const sessionRepo = makeStubSessionRepo()
    const llmError = new Error('shellm: 401 Unauthorized')
    const llm = {
      evaluate: vi.fn(),
      generateSessionBody: vi.fn().mockRejectedValue(llmError),
      generateSessionBodyStream: vi.fn(),
      nudge: vi.fn(),
      askSensei: vi.fn(),
    }
    const kataRepo = {
      findEligible: vi.fn(),
      findById: vi.fn().mockResolvedValue(kata),
      save: vi.fn(),
    }
    const errorReporter = { report: vi.fn().mockResolvedValue(undefined) }

    const useCase = new GenerateSessionBody({ kataRepo, sessionRepo, llm, errorReporter })

    await expect(
      useCase.execute({
        sessionId: SessionId('session-1'),
        kataId: kata.id,
        variationId: variation.id,
      }),
    ).rejects.toThrow('shellm: 401 Unauthorized')

    expect(sessionRepo.updateBody).not.toHaveBeenCalled()
    expect(sessionRepo.delete).toHaveBeenCalledWith(SessionId('session-1'))
    expect(errorReporter.report).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'shellm: 401 Unauthorized',
        source: 'api',
        context: expect.objectContaining({
          useCase: 'GenerateSessionBody',
          sessionId: SessionId('session-1'),
        }),
      }),
    )
  })
})
