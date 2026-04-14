import type { CourseProgressPort, ProgressOwner } from '../../domain/learning/ports'

interface Deps {
  progressRepo: CourseProgressPort
}

export class TrackProgress {
  constructor(private readonly deps: Deps) {}

  async execute(params: {
    owner: ProgressOwner
    courseId: string
    stepId: string
  }): Promise<void> {
    const existing = await this.deps.progressRepo.findByOwnerAndCourse(
      params.owner,
      params.courseId,
    )

    const completedSteps = existing?.completedSteps ?? []

    // Idempotent — don't add duplicate step IDs
    if (completedSteps.includes(params.stepId)) {
      return
    }

    await this.deps.progressRepo.save({
      owner: params.owner,
      courseId: params.courseId,
      completedSteps: [...completedSteps, params.stepId],
      lastAccessedAt: new Date(),
    })
  }
}
