import type { RegisterScrollInput, ScrollManifest } from '@dojo/shared'

export type ScrollStatus = 'draft' | 'published'
export type ScrollVisibility = 'public' | 'private'

export interface ScrollEntry {
  id: string
  slug: string
  manifest: ScrollManifest
  status: ScrollStatus
  visibility: ScrollVisibility
  createdAt: Date
  updatedAt: Date
}

export function registerScrollEntry(input: RegisterScrollInput, now = new Date()): ScrollEntry {
  return {
    id: crypto.randomUUID(),
    slug: input.slug,
    manifest: input.manifest,
    status: input.status,
    visibility: input.visibility,
    createdAt: now,
    updatedAt: now,
  }
}
