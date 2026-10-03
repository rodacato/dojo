import { toProgressView, type ProgressOwner, type ScrollProgressView } from '../../domain/scrolls/progress'
import type { ScrollProgressPort, ScrollRepositoryPort } from '../../domain/scrolls/ports'
import { findProgressScroll } from './progressAccess'
import { deriveUserRef } from './userRef'

interface Deps {
  scrollRepo: ScrollRepositoryPort
  progressRepo: ScrollProgressPort
  userRefSecret: string
}

export class GetScrollProgress {
  constructor(private readonly deps: Deps) {}

  async execute(slug: string, owner: ProgressOwner): Promise<ScrollProgressView> {
    const entry = await findProgressScroll(this.deps.scrollRepo, slug, owner)
    const records = await this.deps.progressRepo.list(owner, entry.id)
    return toProgressView(deriveUserRef(this.deps.userRefSecret, entry.id, owner), records)
  }
}
