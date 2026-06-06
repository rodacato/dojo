import { describe, expect, it, vi } from 'vitest'
import { GetScrollList } from './GetScrollList'
import type { Scroll } from '../../domain/learning/scroll'
import type { ScrollRepositoryPort } from '../../domain/learning/ports'

const makeScroll = (overrides: Partial<Scroll> = {}): Scroll => ({
  id: 'scroll-1',
  slug: 'typescript-fundamentals',
  title: 'TypeScript Fundamentals',
  description: 'Learn TypeScript',
  language: 'typescript',
  accentColor: '#3178C6',
  status: 'published',
  isPublic: false,
  externalReferences: [],
  lessons: [
    {
      id: 'lesson-1',
      order: 1,
      title: 'Variables',
      steps: [
        { id: 'step-1', order: 1, type: 'read', title: null, instruction: 'Intro', starterCode: null, testCode: null, hint: null, solution: null, alternativeApproach: null, data: null },
        { id: 'step-2', order: 2, type: 'challenge', title: null, instruction: 'Write greet', starterCode: '', testCode: '', hint: null, solution: null, alternativeApproach: null, data: null },
      ],
    },
    {
      id: 'lesson-2',
      order: 2,
      title: 'Arrays',
      steps: [
        { id: 'step-3', order: 1, type: 'challenge', title: null, instruction: 'Sum', starterCode: '', testCode: '', hint: null, solution: null, alternativeApproach: null, data: null },
      ],
    },
  ],
  ...overrides,
})

function makeRepo(overrides: Partial<Record<keyof ScrollRepositoryPort, ReturnType<typeof vi.fn>>> = {}) {
  return {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findAllPublished: vi.fn().mockResolvedValue([]),
    findAllPublic: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

describe('GetScrollList', () => {
  it('returns published scrolls with summary counts', async () => {
    const scrollRepo = makeRepo({
      findAllPublished: vi.fn().mockResolvedValue([makeScroll()]),
    })

    const useCase = new GetScrollList({ scrollRepo })
    const result = await useCase.execute()

    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe('typescript-fundamentals')
    expect(result[0].lessonCount).toBe(2)
    expect(result[0].stepCount).toBe(3)
    expect(scrollRepo.findAllPublished).toHaveBeenCalled()
  })

  it('returns empty array when no scrolls published', async () => {
    const scrollRepo = makeRepo()

    const useCase = new GetScrollList({ scrollRepo })
    const result = await useCase.execute()

    expect(result).toHaveLength(0)
  })

  it('filters to public scrolls when publicOnly is true', async () => {
    const scrollRepo = makeRepo({
      findAllPublic: vi.fn().mockResolvedValue([makeScroll({ isPublic: true })]),
    })

    const useCase = new GetScrollList({ scrollRepo })
    const result = await useCase.execute({ publicOnly: true })

    expect(result).toHaveLength(1)
    expect(result[0].isPublic).toBe(true)
    expect(scrollRepo.findAllPublic).toHaveBeenCalled()
    expect(scrollRepo.findAllPublished).not.toHaveBeenCalled()
  })
})
