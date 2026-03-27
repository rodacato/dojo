import type { CourseRepositoryPort } from '../../domain/learning/ports'

export interface CourseSummary {
  id: string
  slug: string
  title: string
  description: string
  language: string
  accentColor: string
  lessonCount: number
  stepCount: number
}

interface Deps {
  courseRepo: CourseRepositoryPort
}

export class GetCourseList {
  constructor(private readonly deps: Deps) {}

  async execute(): Promise<CourseSummary[]> {
    const courses = await this.deps.courseRepo.findAllPublished()
    return courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      language: c.language,
      accentColor: c.accentColor,
      lessonCount: c.lessons.length,
      stepCount: c.lessons.reduce((sum, l) => sum + l.steps.length, 0),
    }))
  }
}
