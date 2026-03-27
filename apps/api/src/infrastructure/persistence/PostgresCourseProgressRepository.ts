import { and, eq } from 'drizzle-orm'
import type { CourseProgress, CourseProgressPort } from '../../domain/learning/ports'
import type { DB } from './drizzle/client'
import { courseProgress } from './drizzle/schema'

export class PostgresCourseProgressRepository implements CourseProgressPort {
  constructor(private readonly db: DB) {}

  async findByUserAndCourse(userId: string, courseId: string): Promise<CourseProgress | null> {
    const row = await this.db.query.courseProgress.findFirst({
      where: and(
        eq(courseProgress.userId, userId),
        eq(courseProgress.courseId, courseId),
      ),
    })
    if (!row) return null
    return {
      userId: row.userId,
      courseId: row.courseId,
      completedSteps: row.completedSteps as string[],
      lastAccessedAt: row.lastAccessedAt,
    }
  }

  async save(progress: CourseProgress): Promise<void> {
    await this.db
      .insert(courseProgress)
      .values({
        userId: progress.userId,
        courseId: progress.courseId,
        completedSteps: progress.completedSteps,
        lastAccessedAt: progress.lastAccessedAt,
      })
      .onConflictDoUpdate({
        target: [courseProgress.userId, courseProgress.courseId],
        set: {
          completedSteps: progress.completedSteps,
          lastAccessedAt: progress.lastAccessedAt,
        },
      })
  }
}
