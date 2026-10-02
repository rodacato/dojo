import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  SCROLL_JSON_SCHEMAS,
  renderScrollJsonSchema,
  type ScrollJsonSchemaFile,
} from '../src/scroll-json-schema'

const outDir = join(__dirname, '../../../docs/scrolls/schema')
mkdirSync(outDir, { recursive: true })

for (const file of Object.keys(SCROLL_JSON_SCHEMAS) as ScrollJsonSchemaFile[]) {
  writeFileSync(join(outDir, file), renderScrollJsonSchema(file))
}
