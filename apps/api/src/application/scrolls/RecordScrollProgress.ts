import type { RecordScrollProgressInput } from '@dojo/shared'
import {
  toProgressView,
  type ProgressOwner,
  type ProgressRecord,
  type ScrollProgressView,
} from '../../domain/scrolls/progress'
import { ScrollUnitNotFoundError } from '../../domain/scrolls/progress-errors'
import type { ScrollProgressPort, ScrollRepositoryPort } from '../../domain/scrolls/ports'
import { findProgressScroll } from './progressAccess'
import { deriveUserRef } from './userRef'

interface Deps {
  scrollRepo: ScrollRepositoryPort
  progressRepo: ScrollProgressPort
  userRefSecret: string
  now?: () => Date
}

export class RecordScrollProgress {
  constructor(private readonly deps: Deps) {}

  async execute(slug: string, owner: ProgressOwner, report: RecordScrollProgressInput): Promise<ScrollProgressView> {
    const { progressRepo } = this.deps
    const entry = await findProgressScroll(this.deps.scrollRepo, slug, owner)
    const unitId = report.unitId ?? null

    if (unitId !== null && !entry.manifest.units.some((unit) => unit.id === unitId)) {
      throw new ScrollUnitNotFoundError(unitId)
    }

    const existing = await progressRepo.find(owner, entry.id, unitId)
    const record: ProgressRecord = {
      unitId,
      completed: report.type === 'complete' ? true : (report.completed ?? existing?.completed ?? false),
      state: report.type === 'progress' ? (report.state ?? existing?.state) : existing?.state,
      updatedAt: (this.deps.now ?? (() => new Date()))(),
    }
    await progressRepo.save(owner, entry.id, record)

    const records = await progressRepo.list(owner, entry.id)
    return toProgressView(deriveUserRef(this.deps.userRefSecret, entry.id, owner), records)
  }
}
