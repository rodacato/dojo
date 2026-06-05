import { describe, expect, it, vi } from 'vitest'
import { Kata } from '../../domain/content/kata'
import { KataNotFoundError } from '../../domain/shared/errors'
import { KataId, UserId, VariationId } from '../../domain/shared/types'
import { InMemoryEventBus } from '../../infrastructure/events/InMemoryEventBus'
import { StartSession } from './StartSession'

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
  save: vi.fn().mockResolvedValue(undefined),
  updateBody: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findActiveByUserId: vi.fn(),
      listCompletedKataHistoryForBelt: vi.fn().mockResolvedValue(null),
})

describe('StartSession', () => {
  it('creates a session and publishes SessionCreated', async () => {
    const kata = makeKata()
    const kataRepo = {
      findEligible: vi.fn(),
      findById: vi.fn().mockResolvedValue(kata),
      save: vi.fn(),
    }
    const sessionRepo = makeStubSessionRepo()
    const eventBus = new InMemoryEventBus()
    const published: string[] = []
    eventBus.subscribe('SessionCreated', async (e) => {
      published.push(e.type)
    })

    const useCase = new StartSession({ kataRepo, sessionRepo, eventBus })
    const variation = kata.variations[0]!

    const session = await useCase.execute({
      userId: UserId('user-1'),
      kataId: kata.id,
      variationId: variation.id,
    })

    expect(session.status).toBe('preparing')
    expect(sessionRepo.save).toHaveBeenCalledWith(session)
    expect(published).toContain('SessionCreated')
  })

  it('throws KataNotFoundError when kata does not exist', async () => {
    const kataRepo = {
      findEligible: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    }
    const useCase = new StartSession({
      kataRepo,
      sessionRepo: makeStubSessionRepo(),
      eventBus: new InMemoryEventBus(),
    })

    await expect(
      useCase.execute({
        userId: UserId('user-1'),
        kataId: KataId('nonexistent'),
        variationId: VariationId('variation-1'),
      }),
    ).rejects.toThrow(KataNotFoundError)
  })
})
