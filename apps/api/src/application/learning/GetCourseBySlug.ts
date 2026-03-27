import type { Course } from '../../domain/learning/course'
import type { CourseRepositoryPort } from '../../domain/learning/ports'

interface Deps {
  courseRepo: CourseRepositoryPort
}

export class GetCourseBySlug {
  constructor(private readonly deps: Deps) {}

  async execute(slug: string): Promise<Course | null> {
    return this.deps.courseRepo.findBySlug(slug)
  }
}
