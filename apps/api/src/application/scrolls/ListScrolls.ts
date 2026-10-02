import type { ScrollRepositoryPort } from '../../domain/scrolls/ports'
import type { ScrollEntry } from '../../domain/scrolls/scroll'

export class ListScrolls {
  constructor(private readonly deps: { scrollRepo: ScrollRepositoryPort }) {}

  forVisitor(options: { authenticated: boolean }): Promise<ScrollEntry[]> {
    return this.deps.scrollRepo.listPublished({ includePrivate: options.authenticated })
  }

  all(): Promise<ScrollEntry[]> {
    return this.deps.scrollRepo.listAll()
  }
}
