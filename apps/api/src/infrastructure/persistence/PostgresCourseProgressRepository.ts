import { and, eq, isNull } from 'drizzle-orm'
import type {
  CourseProgress,
  CourseProgressPort,
  ProgressOwner,
} from '../../domain/learning/ports'
import type { DB } from './drizzle/client'
import { courseProgress } from './drizzle/schema'

type ProgressRow = typeof courseProgress.$inferSelect

export class PostgresCourseProgressRepository implements CourseProgressPort {
  constructor(private readonly db: DB) {}

  async findByOwnerAndCourse(
    owner: ProgressOwner,
    courseId: string,
  ): Promise<CourseProgress | null> {
    const whereClause =
      owner.kind === 'user'
        ? and(
            eq(courseProgress.userId, owner.userId),
            eq(courseProgress.courseId, courseId),
            isNull(courseProgress.anonymousSessionId),
          )
        : and(
            eq(courseProgress.anonymousSessionId, owner.sessionId),
            eq(courseProgress.courseId, courseId),
            isNull(courseProgress.userId),
          )

    const row = await this.db.query.courseProgress.findFirst({ where: whereClause })
    return row ? toDomain(row) : null
  }

  async findAllForAnonymous(sessionId: string): Promise<CourseProgress[]> {
    const rows = await this.db.query.courseProgress.findMany({
      where: eq(courseProgress.anonymousSessionId, sessionId),
    })
    return rows.map(toDomain)
  }

  async save(progress: CourseProgress): Promise<void> {
    const values =
      progress.owner.kind === 'user'
        ? {
            userId: progress.owner.userId,
            anonymousSessionId: null,
            courseId: progress.courseId,
            completedSteps: progress.completedSteps,
            lastAccessedAt: progress.lastAccessedAt,
          }
        : {
            userId: null,
            anonymousSessionId: progress.owner.sessionId,
            courseId: progress.courseId,
            completedSteps: progress.completedSteps,
            lastAccessedAt: progress.lastAccessedAt,
          }

    // Upsert via partial unique index. We first try to update an existing row,
    // and if none is matched we insert. onConflictDoUpdate requires a concrete
    // target, but we have two partial indexes depending on owner kind.
    const existing = await this.findByOwnerAndCourse(progress.owner, progress.courseId)
    if (existing) {
      await this.db
        .update(courseProgress)
        .set({
          completedSteps: values.completedSteps,
          lastAccessedAt: values.lastAccessedAt,
        })
        .where(
          progress.owner.kind === 'user'
            ? and(
                eq(courseProgress.userId, progress.owner.userId),
                eq(courseProgress.courseId, progress.courseId),
              )
            : and(
                eq(courseProgress.anonymousSessionId, progress.owner.sessionId),
                eq(courseProgress.courseId, progress.courseId),
              ),
        )
    } else {
      await this.db.insert(courseProgress).values(values)
    }
  }

  async deleteAnonymous(sessionId: string): Promise<void> {
    await this.db
      .delete(courseProgress)
      .where(eq(courseProgress.anonymousSessionId, sessionId))
  }
}

function toDomain(row: ProgressRow): CourseProgress {
  const owner: ProgressOwner = row.userId
    ? { kind: 'user', userId: row.userId }
    : { kind: 'anonymous', sessionId: row.anonymousSessionId as string }
  return {
    owner,
    courseId: row.courseId,
    completedSteps: row.completedSteps as string[],
    lastAccessedAt: row.lastAccessedAt,
  }
}
