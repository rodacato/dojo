import { describe, expect, it, vi } from 'vitest'
import { GetScrollBySlug } from './GetScrollBySlug'
import type { Scroll } from '../../domain/learning/scroll'
import type { ScrollRepositoryPort } from '../../domain/learning/ports'

const makeScroll = (): Scroll => ({
  id: 'scroll-1',
  slug: 'typescript-fundamentals',
  title: 'TypeScript Fundamentals',
  description: 'Learn TypeScript',
  language: 'typescript',
  accentColor: '#3178C6',
  status: 'published',
  isPublic: false,
  estimatedMinutes: null,
  externalReferences: [],
  lessons: [],
})

function makeRepo(overrides: Partial<Record<keyof ScrollRepositoryPort, ReturnType<typeof vi.fn>>> = {}) {
  return {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findAllPublished: vi.fn(),
    findAllPublic: vi.fn(),
    ...overrides,
  }
}

describe('GetScrollBySlug', () => {
  it('returns scroll when found', async () => {
    const scroll = makeScroll()
    const scrollRepo = makeRepo({ findBySlug: vi.fn().mockResolvedValue(scroll) })

    const useCase = new GetScrollBySlug({ scrollRepo })
    const result = await useCase.execute('typescript-fundamentals')

    expect(result).toBe(scroll)
    expect(scrollRepo.findBySlug).toHaveBeenCalledWith('typescript-fundamentals')
  })

  it('returns null when not found', async () => {
    const scrollRepo = makeRepo({ findBySlug: vi.fn().mockResolvedValue(null) })

    const useCase = new GetScrollBySlug({ scrollRepo })
    const result = await useCase.execute('nonexistent')

    expect(result).toBeNull()
  })
})
