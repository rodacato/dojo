import type { CourseProgressPort } from '../../domain/learning/ports'

interface Deps {
  progressRepo: CourseProgressPort
}

export class MergeAnonymousProgress {
  constructor(private readonly deps: Deps) {}

  async execute(params: { userId: string; anonymousSessionId: string }): Promise<void> {
    const anonymousProgressList = await this.deps.progressRepo.findAllForAnonymous(
      params.anonymousSessionId,
    )

    if (anonymousProgressList.length === 0) {
      return
    }

    for (const anon of anonymousProgressList) {
      const existing = await this.deps.progressRepo.findByOwnerAndCourse(
        { kind: 'user', userId: params.userId },
        anon.courseId,
      )

      const mergedSteps = existing
        ? Array.from(new Set([...existing.completedSteps, ...anon.completedSteps]))
        : anon.completedSteps

      const lastAccessedAt =
        existing && existing.lastAccessedAt > anon.lastAccessedAt
          ? existing.lastAccessedAt
          : anon.lastAccessedAt

      await this.deps.progressRepo.save({
        owner: { kind: 'user', userId: params.userId },
        courseId: anon.courseId,
        completedSteps: mergedSteps,
        lastAccessedAt,
      })
    }

    await this.deps.progressRepo.deleteAnonymous(params.anonymousSessionId)
  }
}
