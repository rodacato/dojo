import { and, eq, isNull } from 'drizzle-orm'
import type {
  ScrollProgress,
  ScrollProgressPort,
  ProgressOwner,
} from '../../domain/learning/ports'
import type { DB } from './drizzle/client'
import { scrollProgress } from './drizzle/schema'

type ProgressRow = typeof scrollProgress.$inferSelect

export class PostgresScrollProgressRepository implements ScrollProgressPort {
  constructor(private readonly db: DB) {}

  async findByOwnerAndScroll(
    owner: ProgressOwner,
    scrollId: string,
  ): Promise<ScrollProgress | null> {
    const whereClause =
      owner.kind === 'user'
        ? and(
            eq(scrollProgress.userId, owner.userId),
            eq(scrollProgress.scrollId, scrollId),
            isNull(scrollProgress.anonymousSessionId),
          )
        : and(
            eq(scrollProgress.anonymousSessionId, owner.sessionId),
            eq(scrollProgress.scrollId, scrollId),
            isNull(scrollProgress.userId),
          )

    const row = await this.db.query.scrollProgress.findFirst({ where: whereClause })
    return row ? toDomain(row) : null
  }

  async findAllForOwner(owner: ProgressOwner): Promise<ScrollProgress[]> {
    const whereClause =
      owner.kind === 'user'
        ? and(eq(scrollProgress.userId, owner.userId), isNull(scrollProgress.anonymousSessionId))
        : and(
            eq(scrollProgress.anonymousSessionId, owner.sessionId),
            isNull(scrollProgress.userId),
          )

    const rows = await this.db.query.scrollProgress.findMany({ where: whereClause })
    return rows.map(toDomain)
  }

  async findAllForAnonymous(sessionId: string): Promise<ScrollProgress[]> {
    const rows = await this.db.query.scrollProgress.findMany({
      where: eq(scrollProgress.anonymousSessionId, sessionId),
    })
    return rows.map(toDomain)
  }

  async save(progress: ScrollProgress): Promise<void> {
    const values =
      progress.owner.kind === 'user'
        ? {
            userId: progress.owner.userId,
            anonymousSessionId: null,
            scrollId: progress.scrollId,
            completedSteps: progress.completedSteps,
            lastAccessedAt: progress.lastAccessedAt,
          }
        : {
            userId: null,
            anonymousSessionId: progress.owner.sessionId,
            scrollId: progress.scrollId,
            completedSteps: progress.completedSteps,
            lastAccessedAt: progress.lastAccessedAt,
          }

    // Upsert via partial unique index. We first try to update an existing row,
    // and if none is matched we insert. onConflictDoUpdate requires a concrete
    // target, but we have two partial indexes depending on owner kind.
    const existing = await this.findByOwnerAndScroll(progress.owner, progress.scrollId)
    if (existing) {
      await this.db
        .update(scrollProgress)
        .set({
          completedSteps: values.completedSteps,
          lastAccessedAt: values.lastAccessedAt,
        })
        .where(
          progress.owner.kind === 'user'
            ? and(
                eq(scrollProgress.userId, progress.owner.userId),
                eq(scrollProgress.scrollId, progress.scrollId),
              )
            : and(
                eq(scrollProgress.anonymousSessionId, progress.owner.sessionId),
                eq(scrollProgress.scrollId, progress.scrollId),
              ),
        )
    } else {
      await this.db.insert(scrollProgress).values(values)
    }
  }

  async deleteAnonymous(sessionId: string): Promise<void> {
    await this.db
      .delete(scrollProgress)
      .where(eq(scrollProgress.anonymousSessionId, sessionId))
  }
}

function toDomain(row: ProgressRow): ScrollProgress {
  const owner: ProgressOwner = row.userId
    ? { kind: 'user', userId: row.userId }
    : { kind: 'anonymous', sessionId: row.anonymousSessionId as string }
  return {
    owner,
    scrollId: row.scrollId,
    completedSteps: row.completedSteps as string[],
    lastAccessedAt: row.lastAccessedAt,
  }
}
