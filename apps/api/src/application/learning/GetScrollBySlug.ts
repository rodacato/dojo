import type { Scroll } from '../../domain/learning/scroll'
import type { ScrollRepositoryPort } from '../../domain/learning/ports'

interface Deps {
  scrollRepo: ScrollRepositoryPort
}

export class GetScrollBySlug {
  constructor(private readonly deps: Deps) {}

  async execute(slug: string): Promise<Scroll | null> {
    return this.deps.scrollRepo.findBySlug(slug)
  }
}
