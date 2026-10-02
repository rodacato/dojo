import type { UpdateScrollInput } from '@dojo/shared'
import { assertEntryOriginAllowed, type OriginPolicy } from '../../domain/scrolls/origins'
import type { ScrollRepositoryPort } from '../../domain/scrolls/ports'
import type { ScrollEntry } from '../../domain/scrolls/scroll'
import { ScrollNotFoundError } from '../../domain/shared/errors'

interface Deps {
  scrollRepo: ScrollRepositoryPort
  originPolicy: OriginPolicy
}

export class UpdateScroll {
  constructor(private readonly deps: Deps) {}

  async execute(id: string, input: UpdateScrollInput): Promise<ScrollEntry> {
    const current = await this.deps.scrollRepo.findById(id)
    if (!current) throw new ScrollNotFoundError(id)

    if (input.manifest) assertEntryOriginAllowed(input.manifest.entry, this.deps.originPolicy)

    const updated: ScrollEntry = {
      ...current,
      manifest: input.manifest ?? current.manifest,
      status: input.status ?? current.status,
      visibility: input.visibility ?? current.visibility,
      updatedAt: new Date(),
    }
    await this.deps.scrollRepo.update(updated)
    return updated
  }
}
