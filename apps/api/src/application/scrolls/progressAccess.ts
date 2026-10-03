import { ScrollProgressNotEnabledError } from '../../domain/scrolls/progress-errors'
import type { ProgressOwner } from '../../domain/scrolls/progress'
import type { ScrollRepositoryPort } from '../../domain/scrolls/ports'
import type { ScrollEntry } from '../../domain/scrolls/scroll'
import { GetScrollBySlug } from './GetScrollBySlug'

export async function findProgressScroll(
  scrollRepo: ScrollRepositoryPort,
  slug: string,
  owner: ProgressOwner,
): Promise<ScrollEntry> {
  const entry = await new GetScrollBySlug({ scrollRepo }).execute(slug, { authenticated: owner.kind === 'user' })
  if (!entry.manifest.capabilities.includes('progress')) throw new ScrollProgressNotEnabledError(slug)
  return entry
}
