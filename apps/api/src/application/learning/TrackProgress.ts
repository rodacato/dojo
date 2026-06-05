import type { ScrollProgressPort, ScrollRepositoryPort, ProgressOwner } from '../../domain/learning/ports'
import type { EventBusPort } from '../../domain/practice/ports'
import type { ScrollCompleted } from '../../domain/learning/events'

interface Deps {
  progressRepo: ScrollProgressPort
  scrollRepo: ScrollRepositoryPort
  eventBus: EventBusPort
}

export class TrackProgress {
  constructor(private readonly deps: Deps) {}

  async execute(params: {
    owner: ProgressOwner
    scrollId: string
    stepId: string
  }): Promise<void> {
    const existing = await this.deps.progressRepo.findByOwnerAndScroll(
      params.owner,
      params.scrollId,
    )

    const completedSteps = existing?.completedSteps ?? []

    // Idempotent — don't add duplicate step IDs
    if (completedSteps.includes(params.stepId)) {
      return
    }

    const nextCompletedSteps = [...completedSteps, params.stepId]
    await this.deps.progressRepo.save({
      owner: params.owner,
      scrollId: params.scrollId,
      completedSteps: nextCompletedSteps,
      lastAccessedAt: new Date(),
    })

    // Scroll completion: only emit for authenticated users, only on the
    // transition into the "all steps done" state. Anonymous completions are
    // skipped — milestones and recognition require an account.
    if (params.owner.kind !== 'user') return

    const scroll = await this.deps.scrollRepo.findById(params.scrollId)
    if (!scroll) return

    const totalSteps = scroll.lessons.reduce((sum, lesson) => sum + lesson.steps.length, 0)
    const justCompleted =
      totalSteps > 0 &&
      nextCompletedSteps.length >= totalSteps &&
      completedSteps.length < totalSteps

    if (!justCompleted) return

    const event: ScrollCompleted = {
      type: 'ScrollCompleted',
      aggregateId: params.scrollId,
      userId: params.owner.userId,
      scrollSlug: scroll.slug,
      totalSteps,
      occurredAt: new Date(),
    }
    await this.deps.eventBus.publish(event)
  }
}
