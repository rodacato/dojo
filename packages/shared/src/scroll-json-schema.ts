import { z } from 'zod'
import {
  hostToScrollMessageSchema,
  scrollManifestSchema,
  scrollToHostMessageSchema,
} from './scroll-protocol'

export const SCROLL_JSON_SCHEMAS = {
  'scroll.schema.json': scrollManifestSchema,
  'scroll-to-host.schema.json': scrollToHostMessageSchema,
  'host-to-scroll.schema.json': hostToScrollMessageSchema,
} as const

export type ScrollJsonSchemaFile = keyof typeof SCROLL_JSON_SCHEMAS

export function renderScrollJsonSchema(file: ScrollJsonSchemaFile): string {
  const schema = z.toJSONSchema(SCROLL_JSON_SCHEMAS[file], { io: 'input' })
  return `${JSON.stringify(schema, null, 2)}\n`
}
