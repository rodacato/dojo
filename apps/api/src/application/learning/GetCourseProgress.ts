import type { CourseProgressPort } from '../../domain/learning/ports'

interface Deps {
  progressRepo: CourseProgressPort
}

export class GetCourseProgress {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string, courseId: string): Promise<string[]> {
    const progress = await this.deps.progressRepo.findByUserAndCourse(userId, courseId)
    return progress?.completedSteps ?? []
  }
}
