import type { ScrollRepositoryPort } from '../../domain/scrolls/ports'
import { ScrollNotFoundError } from '../../domain/shared/errors'

export class DeleteScroll {
  constructor(private readonly deps: { scrollRepo: ScrollRepositoryPort }) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.deps.scrollRepo.delete(id)
    if (!deleted) throw new ScrollNotFoundError(id)
  }
}
