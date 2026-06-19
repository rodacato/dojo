import { describe, it, expect, vi } from 'vitest'
import { GetAllScrollProgress } from './GetAllScrollProgress'
import type { ScrollProgress, ScrollProgressPort } from '../../domain/learning/ports'

const row = (scrollId: string, completedSteps: string[]): ScrollProgress => ({
  owner: { kind: 'user', userId: 'u1' },
  scrollId,
  completedSteps,
  lastAccessedAt: new Date(0),
})

describe('GetAllScrollProgress', () => {
  it('maps each owner progress row to scrollId + completedStepCount', async () => {
    const progressRepo = {
      findAllForOwner: vi.fn().mockResolvedValue([row('s1', ['a', 'b']), row('s2', [])]),
    } as unknown as ScrollProgressPort

    const result = await new GetAllScrollProgress({ progressRepo }).execute({
      kind: 'user',
      userId: 'u1',
    })

    expect(result).toEqual([
      { scrollId: 's1', completedStepCount: 2 },
      { scrollId: 's2', completedStepCount: 0 },
    ])
  })

  it('returns empty when the owner has no progress', async () => {
    const progressRepo = {
      findAllForOwner: vi.fn().mockResolvedValue([]),
    } as unknown as ScrollProgressPort

    const result = await new GetAllScrollProgress({ progressRepo }).execute({
      kind: 'anonymous',
      sessionId: 'sess',
    })

    expect(result).toEqual([])
  })
})
