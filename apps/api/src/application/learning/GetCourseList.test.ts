import { describe, expect, it, vi } from 'vitest'
import { GetCourseList } from './GetCourseList'
import type { Course } from '../../domain/learning/course'

const makeCourse = (overrides: Partial<Course> = {}): Course => ({
  id: 'course-1',
  slug: 'typescript-fundamentals',
  title: 'TypeScript Fundamentals',
  description: 'Learn TypeScript',
  language: 'typescript',
  accentColor: '#3178C6',
  status: 'published',
  lessons: [
    {
      id: 'lesson-1',
      order: 1,
      title: 'Variables',
      steps: [
        { id: 'step-1', order: 1, type: 'explanation', instruction: 'Intro', starterCode: null, testCode: null, hint: null },
        { id: 'step-2', order: 2, type: 'exercise', instruction: 'Write greet', starterCode: '', testCode: '', hint: null },
      ],
    },
    {
      id: 'lesson-2',
      order: 2,
      title: 'Arrays',
      steps: [
        { id: 'step-3', order: 1, type: 'exercise', instruction: 'Sum', starterCode: '', testCode: '', hint: null },
      ],
    },
  ],
  ...overrides,
})

describe('GetCourseList', () => {
  it('returns published courses with summary counts', async () => {
    const courseRepo = {
      findAllPublished: vi.fn().mockResolvedValue([makeCourse()]),
      findBySlug: vi.fn(),
    }

    const useCase = new GetCourseList({ courseRepo })
    const result = await useCase.execute()

    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe('typescript-fundamentals')
    expect(result[0].lessonCount).toBe(2)
    expect(result[0].stepCount).toBe(3)
    expect(courseRepo.findAllPublished).toHaveBeenCalled()
  })

  it('returns empty array when no courses published', async () => {
    const courseRepo = {
      findAllPublished: vi.fn().mockResolvedValue([]),
      findBySlug: vi.fn(),
    }

    const useCase = new GetCourseList({ courseRepo })
    const result = await useCase.execute()

    expect(result).toHaveLength(0)
  })
})
