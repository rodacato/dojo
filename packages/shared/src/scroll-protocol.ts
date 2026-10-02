import { z } from 'zod'

export const SCROLL_PROTOCOL_VERSION = 0
export const MAX_STATE_BYTES = 65_536
export const MAX_RESIZE_HEIGHT = 100_000

export const RESERVED_MESSAGE_TYPES = ['run', 'result', 'llm'] as const

const idPattern = /^[a-z0-9][a-z0-9-]{0,62}$/
const unitIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/
const localePattern = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/
const semverPattern = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/

export const scrollIdSchema = z.string().regex(idPattern)
export const unitIdSchema = z.string().regex(unitIdPattern)
export const localeSchema = z.string().regex(localePattern)
export const capabilitySchema = z.enum(['progress', 'run', 'llm'])
export const nonceSchema = z.string().min(16).max(128)
export const sessionIdSchema = z.string().min(1).max(128)

const stateSchema = z.json().refine(
  (value) => new TextEncoder().encode(JSON.stringify(value)).length <= MAX_STATE_BYTES,
  { message: `state exceeds ${MAX_STATE_BYTES} bytes` },
)

const themeSchema = z.record(z.string().max(64), z.string().max(256))

const envelope = { dojo: z.literal('scroll'), v: z.literal(SCROLL_PROTOCOL_VERSION) }

const unitProgressSchema = z.object({
  completed: z.boolean(),
  state: stateSchema.optional(),
})

export const scrollHelloSchema = z.object({
  ...envelope,
  type: z.literal('hello'),
  scroll: z.object({ id: scrollIdSchema, version: z.string().regex(semverPattern) }),
  nonce: nonceSchema,
  capabilities: z.array(capabilitySchema).max(8),
})

export const scrollProgressSchema = z.object({
  ...envelope,
  type: z.literal('progress'),
  session: sessionIdSchema,
  unitId: unitIdSchema,
  completed: z.boolean().optional(),
  state: stateSchema.optional(),
})

export const scrollCompleteSchema = z.object({
  ...envelope,
  type: z.literal('complete'),
  session: sessionIdSchema,
  unitId: unitIdSchema.optional(),
})

export const scrollResizeSchema = z.object({
  ...envelope,
  type: z.literal('resize'),
  session: sessionIdSchema,
  height: z.number().int().min(0).max(MAX_RESIZE_HEIGHT),
})

export const scrollErrorSchema = z.object({
  ...envelope,
  type: z.literal('error'),
  session: sessionIdSchema.optional(),
  code: z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),
  message: z.string().max(1000),
})

export const hostInitSchema = z.object({
  ...envelope,
  type: z.literal('init'),
  nonce: nonceSchema,
  session: sessionIdSchema,
  locale: localeSchema,
  theme: themeSchema,
  progress: z.record(unitIdSchema, unitProgressSchema),
  capabilities: z.array(capabilitySchema).max(8),
  userRef: z.string().min(1).max(128).nullable(),
  authenticated: z.boolean(),
})

export const hostSetLocaleSchema = z.object({
  ...envelope,
  type: z.literal('setLocale'),
  session: sessionIdSchema,
  locale: localeSchema,
})

export const hostSetThemeSchema = z.object({
  ...envelope,
  type: z.literal('setTheme'),
  session: sessionIdSchema,
  theme: themeSchema,
})

export const scrollToHostMessageSchema = z.discriminatedUnion('type', [
  scrollHelloSchema,
  scrollProgressSchema,
  scrollCompleteSchema,
  scrollResizeSchema,
  scrollErrorSchema,
])

export const hostToScrollMessageSchema = z.discriminatedUnion('type', [
  hostInitSchema,
  hostSetLocaleSchema,
  hostSetThemeSchema,
])

const localizedTextSchema = z.record(localeSchema, z.string().min(1).max(500))

export const scrollManifestSchema = z
  .object({
    id: scrollIdSchema,
    version: z.string().regex(semverPattern),
    protocol: z.literal(SCROLL_PROTOCOL_VERSION),
    entry: z.string().min(1).max(2048),
    locales: z.array(localeSchema).min(1).max(50),
    title: localizedTextSchema,
    description: localizedTextSchema,
    programmingLanguages: z.array(z.string().regex(idPattern)).max(20),
    units: z
      .array(z.object({ id: unitIdSchema, title: localizedTextSchema.optional() }))
      .min(1)
      .max(500),
    capabilities: z.array(capabilitySchema).max(8).default([]),
  })
  .superRefine((manifest, ctx) => {
    const unitIds = manifest.units.map((unit) => unit.id)
    if (new Set(unitIds).size !== unitIds.length) {
      ctx.addIssue({ code: 'custom', path: ['units'], message: 'unit ids must be unique' })
    }
    if (new Set(manifest.locales).size !== manifest.locales.length) {
      ctx.addIssue({ code: 'custom', path: ['locales'], message: 'locales must be unique' })
    }
    for (const field of ['title', 'description'] as const) {
      const missing = manifest.locales.filter((locale) => !(locale in manifest[field]))
      if (missing.length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: `missing translation for: ${missing.join(', ')}`,
        })
      }
    }
  })

export type ScrollCapability = z.infer<typeof capabilitySchema>
export type ScrollToHostMessage = z.infer<typeof scrollToHostMessageSchema>
export type HostToScrollMessage = z.infer<typeof hostToScrollMessageSchema>
export type ScrollManifest = z.infer<typeof scrollManifestSchema>
