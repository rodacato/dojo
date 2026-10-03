import { and, eq, isNull, sql, type SQL } from 'drizzle-orm'
import type { ScrollProgressPort } from '../../domain/scrolls/ports'
import type { ProgressOwner, ProgressRecord } from '../../domain/scrolls/progress'
import type { DB } from './drizzle/client'
import { scrollProgress } from './drizzle/schema'

const WHOLE_SCROLL = ''

type Row = typeof scrollProgress.$inferSelect

function toRecord(row: Row): ProgressRecord {
  return {
    unitId: row.unitId === WHOLE_SCROLL ? null : row.unitId,
    completed: row.completed,
    ...(row.state !== null && { state: row.state }),
    updatedAt: row.updatedAt,
  }
}

function ownedBy(owner: ProgressOwner): SQL {
  return owner.kind === 'user'
    ? and(eq(scrollProgress.userId, owner.userId), isNull(scrollProgress.anonymousId))!
    : and(eq(scrollProgress.anonymousId, owner.anonymousId), isNull(scrollProgress.userId))!
}

export class PostgresScrollProgressRepository implements ScrollProgressPort {
  constructor(private readonly db: DB) {}

  async list(owner: ProgressOwner, scrollId: string): Promise<ProgressRecord[]> {
    const rows = await this.db
      .select()
      .from(scrollProgress)
      .where(and(ownedBy(owner), eq(scrollProgress.scrollId, scrollId)))
    return rows.map(toRecord)
  }

  async find(owner: ProgressOwner, scrollId: string, unitId: string | null): Promise<ProgressRecord | null> {
    const [row] = await this.db
      .select()
      .from(scrollProgress)
      .where(
        and(ownedBy(owner), eq(scrollProgress.scrollId, scrollId), eq(scrollProgress.unitId, unitId ?? WHOLE_SCROLL)),
      )
    return row ? toRecord(row) : null
  }

  async save(owner: ProgressOwner, scrollId: string, record: ProgressRecord): Promise<void> {
    const changes = {
      completed: record.completed,
      state: record.state ?? null,
      updatedAt: record.updatedAt,
    }
    const values = { ...changes, scrollId, unitId: record.unitId ?? WHOLE_SCROLL }

    if (owner.kind === 'user') {
      await this.db
        .insert(scrollProgress)
        .values({ ...values, userId: owner.userId })
        .onConflictDoUpdate({
          target: [scrollProgress.userId, scrollProgress.scrollId, scrollProgress.unitId],
          targetWhere: sql`${scrollProgress.userId} IS NOT NULL`,
          set: changes,
        })
      return
    }

    await this.db
      .insert(scrollProgress)
      .values({ ...values, anonymousId: owner.anonymousId })
      .onConflictDoUpdate({
        target: [scrollProgress.anonymousId, scrollProgress.scrollId, scrollProgress.unitId],
        targetWhere: sql`${scrollProgress.anonymousId} IS NOT NULL`,
        set: changes,
      })
  }

  async listAnonymous(anonymousId: string): Promise<{ scrollId: string; record: ProgressRecord }[]> {
    const rows = await this.db.select().from(scrollProgress).where(eq(scrollProgress.anonymousId, anonymousId))
    return rows.map((row) => ({ scrollId: row.scrollId, record: toRecord(row) }))
  }

  async deleteAnonymous(anonymousId: string): Promise<void> {
    await this.db.delete(scrollProgress).where(eq(scrollProgress.anonymousId, anonymousId))
  }
}
