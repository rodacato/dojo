import { describe, expect, it, vi } from 'vitest'
import { Kata } from '../../domain/content/kata'
import { KataId, SessionId, UserId, VariationId } from '../../domain/shared/types'
import { GenerateSessionBody } from './GenerateSessionBody'

const makeKata = (overrides: Partial<Parameters<typeof Kata.create>[0]> = {}) =>
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
    ...overrides,
  })

async function* streamOf(chunks: string[]): AsyncIterable<string> {
  for (const c of chunks) yield c
}

const collect = async (it: AsyncIterable<string>): Promise<string[]> => {
  const out: string[] = []
  for await (const c of it) out.push(c)
  return out
}

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

  it('review kata persists the description verbatim and skips the LLM', async () => {
    const kata = makeKata({ type: 'review', description: 'Deterministic diff to review' })
    const variation = kata.variations[0]!
    const sessionRepo = makeStubSessionRepo()
    const llm = {
      evaluate: vi.fn(),
      generateSessionBody: vi.fn(),
      generateSessionBodyStream: vi.fn(),
      nudge: vi.fn(),
      askSensei: vi.fn(),
    }
    const kataRepo = { findEligible: vi.fn(), findById: vi.fn().mockResolvedValue(kata), save: vi.fn() }

    const useCase = new GenerateSessionBody({ kataRepo, sessionRepo, llm })
    await useCase.execute({ sessionId: SessionId('session-1'), kataId: kata.id, variationId: variation.id })

    expect(llm.generateSessionBody).not.toHaveBeenCalled()
    expect(sessionRepo.updateBody).toHaveBeenCalledWith(SessionId('session-1'), 'Deterministic diff to review')
  })
})

describe('GenerateSessionBody.executeStream', () => {
  it('streams LLM chunks, accumulates them, and persists the full body', async () => {
    const kata = makeKata()
    const variation = kata.variations[0]!
    const sessionRepo = makeStubSessionRepo()
    const llm = {
      evaluate: vi.fn(),
      generateSessionBody: vi.fn(),
      generateSessionBodyStream: vi.fn().mockReturnValue(streamOf(['You are ', 'reviewing ', 'a PR.'])),
      nudge: vi.fn(),
      askSensei: vi.fn(),
    }
    const kataRepo = { findEligible: vi.fn(), findById: vi.fn().mockResolvedValue(kata), save: vi.fn() }

    const useCase = new GenerateSessionBody({ kataRepo, sessionRepo, llm })
    const chunks = await collect(
      useCase.executeStream({ sessionId: SessionId('session-1'), kataId: kata.id, variationId: variation.id }),
    )

    expect(chunks).toEqual(['You are ', 'reviewing ', 'a PR.'])
    expect(llm.generateSessionBodyStream).toHaveBeenCalledWith({
      ownerRole: 'Tech Lead',
      ownerContext: 'Startup context',
      kataDescription: 'A test code review kata',
    })
    expect(sessionRepo.updateBody).toHaveBeenCalledWith(SessionId('session-1'), 'You are reviewing a PR.')
  })

  it('review kata yields the description as a single chunk and persists it without the LLM', async () => {
    const kata = makeKata({ type: 'review', description: 'Diff body' })
    const variation = kata.variations[0]!
    const sessionRepo = makeStubSessionRepo()
    const llm = {
      evaluate: vi.fn(),
      generateSessionBody: vi.fn(),
      generateSessionBodyStream: vi.fn(),
      nudge: vi.fn(),
      askSensei: vi.fn(),
    }
    const kataRepo = { findEligible: vi.fn(), findById: vi.fn().mockResolvedValue(kata), save: vi.fn() }

    const useCase = new GenerateSessionBody({ kataRepo, sessionRepo, llm })
    const chunks = await collect(
      useCase.executeStream({ sessionId: SessionId('session-1'), kataId: kata.id, variationId: variation.id }),
    )

    expect(chunks).toEqual(['Diff body'])
    expect(llm.generateSessionBodyStream).not.toHaveBeenCalled()
    expect(sessionRepo.updateBody).toHaveBeenCalledWith(SessionId('session-1'), 'Diff body')
  })

  it('deletes the session and never persists a body when the kata is missing', async () => {
    const sessionRepo = makeStubSessionRepo()
    const llm = {
      evaluate: vi.fn(),
      generateSessionBody: vi.fn(),
      generateSessionBodyStream: vi.fn(),
      nudge: vi.fn(),
      askSensei: vi.fn(),
    }
    const kataRepo = { findEligible: vi.fn(), findById: vi.fn().mockResolvedValue(null), save: vi.fn() }

    const useCase = new GenerateSessionBody({ kataRepo, sessionRepo, llm })
    const chunks = await collect(
      useCase.executeStream({
        sessionId: SessionId('session-1'),
        kataId: KataId('missing'),
        variationId: VariationId('var-1'),
      }),
    )

    expect(chunks).toEqual([])
    expect(llm.generateSessionBodyStream).not.toHaveBeenCalled()
    expect(sessionRepo.updateBody).not.toHaveBeenCalled()
    expect(sessionRepo.delete).toHaveBeenCalledWith(SessionId('session-1'))
  })

  it('deletes the session when the variation is missing and never opens the stream', async () => {
    const kata = makeKata()
    const sessionRepo = makeStubSessionRepo()
    const llm = {
      evaluate: vi.fn(),
      generateSessionBody: vi.fn(),
      generateSessionBodyStream: vi.fn(),
      nudge: vi.fn(),
      askSensei: vi.fn(),
    }
    const kataRepo = { findEligible: vi.fn(), findById: vi.fn().mockResolvedValue(kata), save: vi.fn() }

    const useCase = new GenerateSessionBody({ kataRepo, sessionRepo, llm })
    const chunks = await collect(
      useCase.executeStream({
        sessionId: SessionId('session-1'),
        kataId: kata.id,
        variationId: VariationId('nope'),
      }),
    )

    expect(chunks).toEqual([])
    expect(llm.generateSessionBodyStream).not.toHaveBeenCalled()
    expect(sessionRepo.updateBody).not.toHaveBeenCalled()
    expect(sessionRepo.delete).toHaveBeenCalledWith(SessionId('session-1'))
  })

  it('treats an empty/whitespace-only stream as a failure: throws, deletes, does not persist', async () => {
    const kata = makeKata()
    const variation = kata.variations[0]!
    const sessionRepo = makeStubSessionRepo()
    const llm = {
      evaluate: vi.fn(),
      generateSessionBody: vi.fn(),
      generateSessionBodyStream: vi.fn().mockReturnValue(streamOf(['   ', '\n'])),
      nudge: vi.fn(),
      askSensei: vi.fn(),
    }
    const kataRepo = { findEligible: vi.fn(), findById: vi.fn().mockResolvedValue(kata), save: vi.fn() }
    const errorReporter = { report: vi.fn().mockResolvedValue(undefined) }

    const useCase = new GenerateSessionBody({ kataRepo, sessionRepo, llm, errorReporter })

    await expect(
      collect(useCase.executeStream({ sessionId: SessionId('session-1'), kataId: kata.id, variationId: variation.id })),
    ).rejects.toThrow('LLM returned empty session body')

    expect(sessionRepo.updateBody).not.toHaveBeenCalled()
    expect(sessionRepo.delete).toHaveBeenCalledWith(SessionId('session-1'))
    expect(errorReporter.report).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'LLM returned empty session body',
        context: expect.objectContaining({ useCase: 'GenerateSessionBody.executeStream' }),
      }),
    )
  })

  it('propagates a mid-stream LLM error and deletes the session', async () => {
    const kata = makeKata()
    const variation = kata.variations[0]!
    const sessionRepo = makeStubSessionRepo()
    // eslint-disable-next-line require-yield
    async function* boom(): AsyncIterable<string> {
      throw new Error('stream blew up')
    }
    const llm = {
      evaluate: vi.fn(),
      generateSessionBody: vi.fn(),
      generateSessionBodyStream: vi.fn().mockReturnValue(boom()),
      nudge: vi.fn(),
      askSensei: vi.fn(),
    }
    const kataRepo = { findEligible: vi.fn(), findById: vi.fn().mockResolvedValue(kata), save: vi.fn() }
    const errorReporter = { report: vi.fn().mockResolvedValue(undefined) }

    const useCase = new GenerateSessionBody({ kataRepo, sessionRepo, llm, errorReporter })

    await expect(
      collect(useCase.executeStream({ sessionId: SessionId('session-1'), kataId: kata.id, variationId: variation.id })),
    ).rejects.toThrow('stream blew up')

    expect(sessionRepo.updateBody).not.toHaveBeenCalled()
    expect(sessionRepo.delete).toHaveBeenCalledWith(SessionId('session-1'))
  })
})
