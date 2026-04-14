import type { CourseProgressPort, ProgressOwner } from '../../domain/learning/ports'

interface Deps {
  progressRepo: CourseProgressPort
}

export class GetCourseProgress {
  constructor(private readonly deps: Deps) {}

  async execute(owner: ProgressOwner, courseId: string): Promise<string[]> {
    const progress = await this.deps.progressRepo.findByOwnerAndCourse(owner, courseId)
    return progress?.completedSteps ?? []
  }
}
