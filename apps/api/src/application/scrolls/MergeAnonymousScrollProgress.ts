import { mergeRecords } from '../../domain/scrolls/progress'
import type { ScrollProgressPort } from '../../domain/scrolls/ports'

export class MergeAnonymousScrollProgress {
  constructor(private readonly deps: { progressRepo: ScrollProgressPort }) {}

  async execute(params: { userId: string; anonymousId: string }): Promise<void> {
    const { progressRepo } = this.deps
    const owner = { kind: 'user', userId: params.userId } as const
    const anonymous = await progressRepo.listAnonymous(params.anonymousId)

    for (const { scrollId, record } of anonymous) {
      const existing = await progressRepo.find(owner, scrollId, record.unitId)
      await progressRepo.save(owner, scrollId, mergeRecords(existing ?? undefined, record))
    }

    await progressRepo.deleteAnonymous(params.anonymousId)
  }
}
