import type { ScrollEntry } from './scroll'

export interface ScrollRepositoryPort {
  listAll(): Promise<ScrollEntry[]>
  listPublished(options: { includePrivate: boolean }): Promise<ScrollEntry[]>
  findById(id: string): Promise<ScrollEntry | null>
  findBySlug(slug: string): Promise<ScrollEntry | null>
  insert(entry: ScrollEntry): Promise<void>
  update(entry: ScrollEntry): Promise<void>
  delete(id: string): Promise<boolean>
}
