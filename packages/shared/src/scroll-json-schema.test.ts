import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SCROLL_JSON_SCHEMAS, renderScrollJsonSchema, type ScrollJsonSchemaFile } from './scroll-json-schema'

const schemaDir = join(__dirname, '../../../docs/scrolls/schema')
const files = Object.keys(SCROLL_JSON_SCHEMAS) as ScrollJsonSchemaFile[]

describe('committed scroll JSON Schemas', () => {
  it.each(files)('%s is in sync with the Zod source (run `pnpm --filter=@dojo/shared scroll-schema`)', (file) => {
    const committed = readFileSync(join(schemaDir, file), 'utf8')
    expect(committed).toBe(renderScrollJsonSchema(file))
  })

  it('describes the manifest required fields', () => {
    const schema = JSON.parse(renderScrollJsonSchema('scroll.schema.json')) as { required: string[] }
    expect(schema.required).toEqual(expect.arrayContaining(['id', 'version', 'protocol', 'entry', 'units']))
  })
})
