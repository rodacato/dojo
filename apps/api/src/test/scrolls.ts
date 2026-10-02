import type { RegisterScrollInput } from '@dojo/shared'
import type { ScrollRepositoryPort } from '../domain/scrolls/ports'
import { registerScrollEntry, type ScrollEntry } from '../domain/scrolls/scroll'

export const TEST_ORIGIN = 'https://scrolls.example.org'

export const testManifest = {
  id: 'pattern-circuit',
  version: '0.1.0',
  protocol: 0 as const,
  entry: `${TEST_ORIGIN}/pattern-circuit/`,
  locales: ['en'],
  title: { en: 'Pattern Circuit' },
  description: { en: 'Learn patterns' },
  programmingLanguages: ['ruby'],
  units: [{ id: 'u1' }],
  capabilities: ['progress' as const],
}

export function testScrollInput(over: Partial<RegisterScrollInput> = {}): RegisterScrollInput {
  return { slug: 'pattern-circuit', manifest: testManifest, status: 'draft', visibility: 'public', ...over }
}

export function testScrollEntry(over: Partial<RegisterScrollInput> = {}): ScrollEntry {
  return registerScrollEntry(testScrollInput(over))
}

export class InMemoryScrollRepository implements ScrollRepositoryPort {
  readonly entries = new Map<string, ScrollEntry>()

  async listAll() {
    return [...this.entries.values()]
  }

  async listPublished({ includePrivate }: { includePrivate: boolean }) {
    return [...this.entries.values()].filter(
      (entry) => entry.status === 'published' && (includePrivate || entry.visibility === 'public'),
    )
  }

  async findById(id: string) {
    return this.entries.get(id) ?? null
  }

  async findBySlug(slug: string) {
    return [...this.entries.values()].find((entry) => entry.slug === slug) ?? null
  }

  async insert(entry: ScrollEntry) {
    this.entries.set(entry.id, entry)
  }

  async update(entry: ScrollEntry) {
    this.entries.set(entry.id, entry)
  }

  async delete(id: string) {
    return this.entries.delete(id)
  }
}
