import { and, asc, eq } from 'drizzle-orm'
import type { ScrollManifest } from '@dojo/shared'
import type { ScrollRepositoryPort } from '../../domain/scrolls/ports'
import type { ScrollEntry, ScrollStatus, ScrollVisibility } from '../../domain/scrolls/scroll'
import { ScrollSlugTakenError } from '../../domain/shared/errors'
import type { DB } from './drizzle/client'
import { scrolls } from './drizzle/schema'

const UNIQUE_VIOLATION = '23505'

type ScrollRow = typeof scrolls.$inferSelect

function toEntry(row: ScrollRow): ScrollEntry {
  return {
    id: row.id,
    slug: row.slug,
    // Written only through the validated register/update use cases.
    manifest: row.manifest as ScrollManifest,
    status: row.status as ScrollStatus,
    visibility: row.visibility as ScrollVisibility,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class PostgresScrollRepository implements ScrollRepositoryPort {
  constructor(private readonly db: DB) {}

  async listAll(): Promise<ScrollEntry[]> {
    const rows = await this.db.select().from(scrolls).orderBy(asc(scrolls.slug))
    return rows.map(toEntry)
  }

  async listPublished(options: { includePrivate: boolean }): Promise<ScrollEntry[]> {
    const published = eq(scrolls.status, 'published')
    const where = options.includePrivate ? published : and(published, eq(scrolls.visibility, 'public'))
    const rows = await this.db.select().from(scrolls).where(where).orderBy(asc(scrolls.slug))
    return rows.map(toEntry)
  }

  async findById(id: string): Promise<ScrollEntry | null> {
    const [row] = await this.db.select().from(scrolls).where(eq(scrolls.id, id))
    return row ? toEntry(row) : null
  }

  async findBySlug(slug: string): Promise<ScrollEntry | null> {
    const [row] = await this.db.select().from(scrolls).where(eq(scrolls.slug, slug))
    return row ? toEntry(row) : null
  }

  async insert(entry: ScrollEntry): Promise<void> {
    try {
      await this.db.insert(scrolls).values(entry)
    } catch (err) {
      if (isUniqueViolation(err)) throw new ScrollSlugTakenError(entry.slug)
      throw err
    }
  }

  async update(entry: ScrollEntry): Promise<void> {
    await this.db
      .update(scrolls)
      .set({
        manifest: entry.manifest,
        status: entry.status,
        visibility: entry.visibility,
        updatedAt: entry.updatedAt,
      })
      .where(eq(scrolls.id, entry.id))
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.delete(scrolls).where(eq(scrolls.id, id)).returning({ id: scrolls.id })
    return rows.length > 0
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === UNIQUE_VIOLATION
}
