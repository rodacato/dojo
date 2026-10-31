import { and, count, eq, gte, sql } from 'drizzle-orm'
import type { DB } from './drizzle/client'
import { katas, sessions } from './drizzle/schema'
import { isEligiblePractice } from './eligible-practice'

export async function loadPracticeDays(db: DB, userId: string): Promise<string[]> {
  const rows = await db
    .select({ date: sql<string>`DATE(${sessions.startedAt})::text` })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isEligiblePractice()))
    .groupBy(sql`DATE(${sessions.startedAt})`)
  return rows.map((row) => row.date)
}

export async function loadPracticeMetrics(db: DB, userId: string, weekStart: Date) {
  const practiced = and(eq(sessions.userId, userId), isEligiblePractice())

  const [totalRows, weeklyRows, avgTimeRows, typeRows, timedOutRows] = await Promise.all([
    db.select({ count: count() }).from(sessions).where(practiced),
    db
      .select({ count: count() })
      .from(sessions)
      .where(and(practiced, gte(sessions.startedAt, weekStart))),
    db
      .select({
        avg: sql<number>`ROUND(AVG(EXTRACT(EPOCH FROM (${sessions.completedAt} - ${sessions.startedAt})) / 60))`,
      })
      .from(sessions)
      .where(and(practiced, sql`${sessions.completedAt} IS NOT NULL`)),
    db
      .select({ type: katas.type, count: count() })
      .from(sessions)
      .innerJoin(katas, eq(sessions.kataId, katas.id))
      .where(practiced)
      .groupBy(katas.type),
    db
      .select({ count: count() })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.status, 'failed'), sql`NOT ${isEligiblePractice()}`)),
  ])

  return {
    total: Number(totalRows[0]?.count ?? 0),
    weekly: Number(weeklyRows[0]?.count ?? 0),
    avgTimeMinutes: Number(avgTimeRows[0]?.avg ?? 0),
    typeCounts: typeRows.map((row) => ({ type: row.type, count: Number(row.count) })),
    timedOut: Number(timedOutRows[0]?.count ?? 0),
  }
}
