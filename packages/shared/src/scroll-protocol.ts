import { z } from 'zod'

export const SCROLL_PROTOCOL_VERSION = 0
export const MAX_STATE_BYTES = 65_536
export const MAX_RESIZE_HEIGHT = 100_000

export const MAX_RUN_FILES = 8
export const MAX_RUN_BYTES = 65_536
export const MAX_RUN_OUTPUT_CHARS = 65_536

export const RUN_TOO_LARGE_MESSAGE = `files exceed ${MAX_RUN_BYTES} bytes`

export const RESERVED_MESSAGE_TYPES = ['llm'] as const

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

const requestIdSchema = z.string().min(1).max(128)
const runFileNameSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/)

export const runFileSchema = z.object({
  name: runFileNameSchema,
  content: z.string(),
})

export const runFilesSchema = z
  .array(runFileSchema)
  .min(1)
  .max(MAX_RUN_FILES)
  .superRefine((files, ctx) => {
    const encoder = new TextEncoder()
    const bytes = files.reduce((sum, file) => sum + encoder.encode(file.content).length, 0)
    if (bytes > MAX_RUN_BYTES) {
      ctx.addIssue({ code: 'custom', message: RUN_TOO_LARGE_MESSAGE })
    }
    if (new Set(files.map((file) => file.name)).size !== files.length) {
      ctx.addIssue({ code: 'custom', message: 'file names must be unique' })
    }
  })

export const runStdinSchema = z.string().max(MAX_RUN_BYTES)
export const runLanguageSchema = z.string().regex(idPattern)
export const runResultKindSchema = z.enum(['ok', 'compile', 'runtime', 'timeout', 'output-limit', 'unavailable'])

export const runOutcomeShape = {
  kind: runResultKindSchema,
  exitCode: z.number().int().nullable(),
  stdout: z.string().max(MAX_RUN_OUTPUT_CHARS),
  stderr: z.string().max(MAX_RUN_OUTPUT_CHARS),
  durationMs: z.number().int().min(0),
}

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

export const scrollRunSchema = z.object({
  ...envelope,
  type: z.literal('run'),
  session: sessionIdSchema,
  id: requestIdSchema,
  language: runLanguageSchema,
  files: runFilesSchema,
  stdin: runStdinSchema.optional(),
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

export const hostResultSchema = z.object({
  ...envelope,
  type: z.literal('result'),
  session: sessionIdSchema,
  id: requestIdSchema,
  ...runOutcomeShape,
})

export const hostErrorSchema = z.object({
  ...envelope,
  type: z.literal('error'),
  session: sessionIdSchema,
  id: requestIdSchema.optional(),
  code: z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),
  message: z.string().max(1000),
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
  scrollRunSchema,
  scrollErrorSchema,
])

export const hostToScrollMessageSchema = z.discriminatedUnion('type', [
  hostInitSchema,
  hostResultSchema,
  hostErrorSchema,
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
export type RunResultKind = z.infer<typeof runResultKindSchema>
