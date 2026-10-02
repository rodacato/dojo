import type { RegisterScrollInput } from '@dojo/shared'
import { assertEntryOriginAllowed, type OriginPolicy } from '../../domain/scrolls/origins'
import type { ScrollRepositoryPort } from '../../domain/scrolls/ports'
import { registerScrollEntry, type ScrollEntry } from '../../domain/scrolls/scroll'
import { ScrollSlugTakenError } from '../../domain/shared/errors'

interface Deps {
  scrollRepo: ScrollRepositoryPort
  originPolicy: OriginPolicy
}

export class RegisterScroll {
  constructor(private readonly deps: Deps) {}

  async execute(input: RegisterScrollInput): Promise<ScrollEntry> {
    assertEntryOriginAllowed(input.manifest.entry, this.deps.originPolicy)
    if (await this.deps.scrollRepo.findBySlug(input.slug)) throw new ScrollSlugTakenError(input.slug)

    const entry = registerScrollEntry(input)
    await this.deps.scrollRepo.insert(entry)
    return entry
  }
}
