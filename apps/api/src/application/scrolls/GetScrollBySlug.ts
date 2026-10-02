import type { ScrollRepositoryPort } from '../../domain/scrolls/ports'
import type { ScrollEntry } from '../../domain/scrolls/scroll'
import { ScrollLoginRequiredError, ScrollNotFoundError } from '../../domain/shared/errors'

export class GetScrollBySlug {
  constructor(private readonly deps: { scrollRepo: ScrollRepositoryPort }) {}

  async execute(slug: string, options: { authenticated: boolean }): Promise<ScrollEntry> {
    const entry = await this.deps.scrollRepo.findBySlug(slug)
    if (!entry || entry.status !== 'published') throw new ScrollNotFoundError(slug)
    if (entry.visibility === 'private' && !options.authenticated) throw new ScrollLoginRequiredError()
    return entry
  }
}
