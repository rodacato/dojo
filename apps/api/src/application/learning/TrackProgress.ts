import type { CourseProgressPort, CourseRepositoryPort, ProgressOwner } from '../../domain/learning/ports'
import type { EventBusPort } from '../../domain/practice/ports'
import type { CourseCompleted } from '../../domain/learning/events'

interface Deps {
  progressRepo: CourseProgressPort
  courseRepo: CourseRepositoryPort
  eventBus: EventBusPort
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

    const nextCompletedSteps = [...completedSteps, params.stepId]
    await this.deps.progressRepo.save({
      owner: params.owner,
      courseId: params.courseId,
      completedSteps: nextCompletedSteps,
      lastAccessedAt: new Date(),
    })

    // Course completion: only emit for authenticated users, only on the
    // transition into the "all steps done" state. Anonymous completions are
    // skipped — badges and recognition require an account.
    if (params.owner.kind !== 'user') return

    const course = await this.deps.courseRepo.findById(params.courseId)
    if (!course) return

    const totalSteps = course.lessons.reduce((sum, lesson) => sum + lesson.steps.length, 0)
    const justCompleted =
      totalSteps > 0 &&
      nextCompletedSteps.length >= totalSteps &&
      completedSteps.length < totalSteps

    if (!justCompleted) return

    const event: CourseCompleted = {
      type: 'CourseCompleted',
      aggregateId: params.courseId,
      userId: params.owner.userId,
      courseSlug: course.slug,
      totalSteps,
      occurredAt: new Date(),
    }
    await this.deps.eventBus.publish(event)
  }
}
