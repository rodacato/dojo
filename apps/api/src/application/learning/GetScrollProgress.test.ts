import { describe, expect, it, vi } from 'vitest'
import type { ProgressOwner } from '../../domain/learning/ports'
import { GetScrollProgress } from './GetScrollProgress'

const userOwner: ProgressOwner = { kind: 'user', userId: 'user-1' }
const anonOwner: ProgressOwner = { kind: 'anonymous', sessionId: 'anon-1' }

describe('GetScrollProgress', () => {
  it('returns completed steps for a user who has progress', async () => {
    const progressRepo = {
      findByOwnerAndScroll: vi.fn().mockResolvedValue({
        owner: userOwner,
        scrollId: 'scroll-1',
        completedSteps: ['step-a', 'step-b', 'step-c'],
        lastAccessedAt: new Date(),
      }),
      findAllForAnonymous: vi.fn(),
      findAllForOwner: vi.fn(),
      save: vi.fn(),
      deleteAnonymous: vi.fn(),
    }

    const useCase = new GetScrollProgress({ progressRepo })
    const result = await useCase.execute(userOwner, 'scroll-1')

    expect(result).toEqual(['step-a', 'step-b', 'step-c'])
    expect(progressRepo.findByOwnerAndScroll).toHaveBeenCalledWith(userOwner, 'scroll-1')
  })

  it('returns empty array when no progress exists', async () => {
    const progressRepo = {
      findByOwnerAndScroll: vi.fn().mockResolvedValue(null),
      findAllForAnonymous: vi.fn(),
      findAllForOwner: vi.fn(),
      save: vi.fn(),
      deleteAnonymous: vi.fn(),
    }

    const useCase = new GetScrollProgress({ progressRepo })
    const result = await useCase.execute(userOwner, 'scroll-1')

    expect(result).toEqual([])
  })

  it('loads progress for an anonymous owner', async () => {
    const progressRepo = {
      findByOwnerAndScroll: vi.fn().mockResolvedValue({
        owner: anonOwner,
        scrollId: 'scroll-1',
        completedSteps: ['step-1'],
        lastAccessedAt: new Date(),
      }),
      findAllForAnonymous: vi.fn(),
      findAllForOwner: vi.fn(),
      save: vi.fn(),
      deleteAnonymous: vi.fn(),
    }

    const useCase = new GetScrollProgress({ progressRepo })
    const result = await useCase.execute(anonOwner, 'scroll-1')

    expect(result).toEqual(['step-1'])
    expect(progressRepo.findByOwnerAndScroll).toHaveBeenCalledWith(anonOwner, 'scroll-1')
  })
})
