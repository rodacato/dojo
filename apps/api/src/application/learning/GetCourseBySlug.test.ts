import { describe, expect, it, vi } from 'vitest'
import { GetCourseBySlug } from './GetCourseBySlug'
import type { Course } from '../../domain/learning/course'

const makeCourse = (): Course => ({
  id: 'course-1',
  slug: 'typescript-fundamentals',
  title: 'TypeScript Fundamentals',
  description: 'Learn TypeScript',
  language: 'typescript',
  accentColor: '#3178C6',
  status: 'published',
  lessons: [],
})

describe('GetCourseBySlug', () => {
  it('returns course when found', async () => {
    const course = makeCourse()
    const courseRepo = {
      findAllPublished: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(course),
    }

    const useCase = new GetCourseBySlug({ courseRepo })
    const result = await useCase.execute('typescript-fundamentals')

    expect(result).toBe(course)
    expect(courseRepo.findBySlug).toHaveBeenCalledWith('typescript-fundamentals')
  })

  it('returns null when not found', async () => {
    const courseRepo = {
      findAllPublished: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(null),
    }

    const useCase = new GetCourseBySlug({ courseRepo })
    const result = await useCase.execute('nonexistent')

    expect(result).toBeNull()
  })
})
