import { describe, expect, it, vi } from 'vitest'
import { GetCourseList } from './GetCourseList'
import type { Course } from '../../domain/learning/course'
import type { CourseRepositoryPort } from '../../domain/learning/ports'

const makeCourse = (overrides: Partial<Course> = {}): Course => ({
  id: 'course-1',
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
        { id: 'step-1', order: 1, type: 'read', title: null, instruction: 'Intro', starterCode: null, testCode: null, hint: null, solution: null, alternativeApproach: null },
        { id: 'step-2', order: 2, type: 'challenge', title: null, instruction: 'Write greet', starterCode: '', testCode: '', hint: null, solution: null, alternativeApproach: null },
      ],
    },
    {
      id: 'lesson-2',
      order: 2,
      title: 'Arrays',
      steps: [
        { id: 'step-3', order: 1, type: 'challenge', title: null, instruction: 'Sum', starterCode: '', testCode: '', hint: null, solution: null, alternativeApproach: null },
      ],
    },
  ],
  ...overrides,
})

function makeRepo(overrides: Partial<Record<keyof CourseRepositoryPort, ReturnType<typeof vi.fn>>> = {}) {
  return {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findAllPublished: vi.fn().mockResolvedValue([]),
    findAllPublic: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

describe('GetCourseList', () => {
  it('returns published courses with summary counts', async () => {
    const courseRepo = makeRepo({
      findAllPublished: vi.fn().mockResolvedValue([makeCourse()]),
    })

    const useCase = new GetCourseList({ courseRepo })
    const result = await useCase.execute()

    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe('typescript-fundamentals')
    expect(result[0].lessonCount).toBe(2)
    expect(result[0].stepCount).toBe(3)
    expect(courseRepo.findAllPublished).toHaveBeenCalled()
  })

  it('returns empty array when no courses published', async () => {
    const courseRepo = makeRepo()

    const useCase = new GetCourseList({ courseRepo })
    const result = await useCase.execute()

    expect(result).toHaveLength(0)
  })

  it('filters to public courses when publicOnly is true', async () => {
    const courseRepo = makeRepo({
      findAllPublic: vi.fn().mockResolvedValue([makeCourse({ isPublic: true })]),
    })

    const useCase = new GetCourseList({ courseRepo })
    const result = await useCase.execute({ publicOnly: true })

    expect(result).toHaveLength(1)
    expect(result[0].isPublic).toBe(true)
    expect(courseRepo.findAllPublic).toHaveBeenCalled()
    expect(courseRepo.findAllPublished).not.toHaveBeenCalled()
  })
})
