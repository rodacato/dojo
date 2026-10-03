import type { ScrollEntryDTO } from '@dojo/shared'
import type { ScrollEntry } from '../../../domain/scrolls/scroll'

export function toScrollEntryDTO(entry: ScrollEntry): ScrollEntryDTO {
  return {
    id: entry.id,
    slug: entry.slug,
    manifest: entry.manifest,
    status: entry.status,
    visibility: entry.visibility,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }
}
