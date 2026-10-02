import { describe, expect, it } from 'vitest'
import { registerScrollSchema, scrollEntrySchema, updateScrollSchema } from './scroll-registry'

const manifest = {
  id: 'pattern-circuit',
  version: '0.1.0',
  protocol: 0,
  entry: 'https://example.org/pattern-circuit/',
  locales: ['en'],
  title: { en: 'Pattern Circuit' },
  description: { en: 'Learn patterns' },
  programmingLanguages: ['ruby'],
  units: [{ id: 'u1' }],
  capabilities: ['progress'],
}

describe('registerScrollSchema', () => {
  it('defaults to a public draft', () => {
    const parsed = registerScrollSchema.parse({ slug: 'pattern-circuit', manifest })
    expect(parsed.status).toBe('draft')
    expect(parsed.visibility).toBe('public')
  })

  it.each(['Upper', '-leading', 'has space', '', 'a'.repeat(65)])('rejects slug %j', (slug) => {
    expect(registerScrollSchema.safeParse({ slug, manifest }).success).toBe(false)
  })

  it('rejects an invalid manifest', () => {
    const result = registerScrollSchema.safeParse({ slug: 'ok', manifest: { ...manifest, units: [] } })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown status', () => {
    expect(registerScrollSchema.safeParse({ slug: 'ok', manifest, status: 'archived' }).success).toBe(false)
  })
})

describe('updateScrollSchema', () => {
  it('accepts a partial update and an empty one', () => {
    expect(updateScrollSchema.safeParse({ status: 'published' }).success).toBe(true)
    expect(updateScrollSchema.safeParse({}).success).toBe(true)
  })

  it('rejects an invalid visibility', () => {
    expect(updateScrollSchema.safeParse({ visibility: 'secret' }).success).toBe(false)
  })
})

describe('scrollEntrySchema', () => {
  const entry = {
    id: '3f0d1c52-6c0e-4c53-9d0c-3a3a8f6a3b11',
    slug: 'pattern-circuit',
    manifest,
    status: 'published',
    visibility: 'public',
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  }

  it('accepts a valid entry', () => {
    expect(scrollEntrySchema.safeParse(entry).success).toBe(true)
  })

  it('rejects a non-uuid id', () => {
    expect(scrollEntrySchema.safeParse({ ...entry, id: 'nope' }).success).toBe(false)
  })
})
