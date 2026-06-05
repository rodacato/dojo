import type { ScrollProgressPort, ProgressOwner } from '../../domain/learning/ports'

interface Deps {
  progressRepo: ScrollProgressPort
}

export class GetScrollProgress {
  constructor(private readonly deps: Deps) {}

  async execute(owner: ProgressOwner, scrollId: string): Promise<string[]> {
    const progress = await this.deps.progressRepo.findByOwnerAndScroll(owner, scrollId)
    return progress?.completedSteps ?? []
  }
}
