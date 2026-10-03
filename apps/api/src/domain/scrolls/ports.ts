import type { ProgressOwner, ProgressRecord } from './progress'
import type { ScrollEntry } from './scroll'

export interface ScrollProgressPort {
  list(owner: ProgressOwner, scrollId: string): Promise<ProgressRecord[]>
  find(owner: ProgressOwner, scrollId: string, unitId: string | null): Promise<ProgressRecord | null>
  save(owner: ProgressOwner, scrollId: string, record: ProgressRecord): Promise<void>
  listAnonymous(anonymousId: string): Promise<{ scrollId: string; record: ProgressRecord }[]>
  deleteAnonymous(anonymousId: string): Promise<void>
}

export interface ScrollRepositoryPort {
  listAll(): Promise<ScrollEntry[]>
  listPublished(options: { includePrivate: boolean }): Promise<ScrollEntry[]>
  findById(id: string): Promise<ScrollEntry | null>
  findBySlug(slug: string): Promise<ScrollEntry | null>
  insert(entry: ScrollEntry): Promise<void>
  update(entry: ScrollEntry): Promise<void>
  delete(id: string): Promise<boolean>
}
