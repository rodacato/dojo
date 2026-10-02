import { z } from 'zod'
import { scrollManifestSchema } from './scroll-protocol'

export const scrollEntryStatusSchema = z.enum(['draft', 'published'])
export const scrollEntryVisibilitySchema = z.enum(['public', 'private'])
export const scrollSlugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/)

export const scrollEntrySchema = z.object({
  id: z.string().uuid(),
  slug: scrollSlugSchema,
  manifest: scrollManifestSchema,
  status: scrollEntryStatusSchema,
  visibility: scrollEntryVisibilitySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const registerScrollSchema = z.object({
  slug: scrollSlugSchema,
  manifest: scrollManifestSchema,
  status: scrollEntryStatusSchema.default('draft'),
  visibility: scrollEntryVisibilitySchema.default('public'),
})

export const updateScrollSchema = z.object({
  manifest: scrollManifestSchema.optional(),
  status: scrollEntryStatusSchema.optional(),
  visibility: scrollEntryVisibilitySchema.optional(),
})

export type ScrollEntryDTO = z.infer<typeof scrollEntrySchema>
export type RegisterScrollInput = z.infer<typeof registerScrollSchema>
export type UpdateScrollInput = z.infer<typeof updateScrollSchema>
