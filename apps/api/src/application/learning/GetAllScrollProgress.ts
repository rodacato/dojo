import type { ScrollProgressPort, ProgressOwner } from '../../domain/learning/ports'
import type { ScrollProgressSummary } from '@dojo/shared'

interface Deps {
  progressRepo: ScrollProgressPort
}

// Batch progress for the catalog: one round-trip, a completed-step count per
// scroll the owner has touched. The catalog derives binary state (not started /
// in progress / completed) client-side against the scroll's stepCount — so
// ScrollDTO stays pure Content and progress (Learning) never couples onto the
// cacheable catalog DTO. See docs/courses/README.md §4.5.
export class GetAllScrollProgress {
  constructor(private readonly deps: Deps) {}

  async execute(owner: ProgressOwner): Promise<ScrollProgressSummary[]> {
    const all = await this.deps.progressRepo.findAllForOwner(owner)
    return all.map((p) => ({
      scrollId: p.scrollId,
      completedStepCount: p.completedSteps.length,
    }))
  }
}
