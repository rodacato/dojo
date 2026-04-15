import type { CourseRepositoryPort } from '../../domain/learning/ports'
import type { CourseStatus } from '../../domain/learning/values'

export interface CourseSummary {
  id: string
  slug: string
  title: string
  description: string
  language: string
  accentColor: string
  status: CourseStatus
  isPublic: boolean
  lessonCount: number
  stepCount: number
}

interface Deps {
  courseRepo: CourseRepositoryPort
}

export class GetCourseList {
  constructor(private readonly deps: Deps) {}

  async execute(options?: { publicOnly?: boolean }): Promise<CourseSummary[]> {
    const courses = options?.publicOnly
      ? await this.deps.courseRepo.findAllPublic()
      : await this.deps.courseRepo.findAllPublished()
    return courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      language: c.language,
      accentColor: c.accentColor,
      status: c.status,
      isPublic: c.isPublic,
      lessonCount: c.lessons.length,
      stepCount: c.lessons.reduce((sum, l) => sum + l.steps.length, 0),
    }))
  }
}
