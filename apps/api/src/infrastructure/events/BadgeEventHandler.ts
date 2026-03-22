import { and, count, eq, gte, sql } from 'drizzle-orm'
import type { SessionCompleted } from '../../domain/practice/events'
import type { InMemoryEventBus } from './InMemoryEventBus'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { attempts, exercises, sessions, userBadges } from '../persistence/drizzle/schema'

export function registerBadgeHandlers(eventBus: InMemoryEventBus, db: PostgresJsDatabase) {
  eventBus.subscribe<SessionCompleted>('SessionCompleted', async (event) => {
    const { userId, aggregateId: sessionId } = event

    const earned = await getEarnedSlugs(db, userId)

    // FIRST_KATA: first completed session
    if (!earned.has('FIRST_KATA')) {
      await award(db, userId, 'FIRST_KATA', sessionId)
    }

    // 5_STREAK: 5 consecutive days
    if (!earned.has('5_STREAK')) {
      const streak = await getCurrentStreak(db, userId)
      if (streak >= 5) await award(db, userId, '5_STREAK', sessionId)
    }

    // CONSISTENT: 30-day streak
    if (!earned.has('CONSISTENT')) {
      const streak = await getCurrentStreak(db, userId)
      if (streak >= 30) await award(db, userId, 'CONSISTENT', sessionId)
    }

    // POLYGLOT: completed kata in all 3 types (CODE, CHAT, WHITEBOARD)
    if (!earned.has('POLYGLOT')) {
      const types = await db
        .selectDistinct({ type: exercises.type })
        .from(sessions)
        .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
        .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed')))
      if (types.length >= 3) await award(db, userId, 'POLYGLOT', sessionId)
    }

    // ARCHITECT: 3+ WHITEBOARD kata completed
    if (!earned.has('ARCHITECT')) {
      const [row] = await db
        .select({ count: count() })
        .from(sessions)
        .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
        .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed'), eq(exercises.type, 'WHITEBOARD')))
      if (Number(row?.count ?? 0) >= 3) await award(db, userId, 'ARCHITECT', sessionId)
    }

    // RUBBER_DUCK: 3+ CHAT kata completed
    if (!earned.has('RUBBER_DUCK')) {
      const [row] = await db
        .select({ count: count() })
        .from(sessions)
        .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
        .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed'), eq(exercises.type, 'CHAT')))
      if (Number(row?.count ?? 0) >= 3) await award(db, userId, 'RUBBER_DUCK', sessionId)
    }

    // BRUTAL_TRUTH: 3+ NEEDS_WORK verdicts
    if (!earned.has('BRUTAL_TRUTH')) {
      const [row] = await db
        .select({ count: count() })
        .from(attempts)
        .innerJoin(sessions, eq(attempts.sessionId, sessions.id))
        .where(
          and(
            eq(sessions.userId, userId),
            eq(attempts.isFinalEvaluation, true),
            sql`${attempts.llmResponse}::jsonb->>'verdict' = 'NEEDS_WORK'`,
          ),
        )
      if (Number(row?.count ?? 0) >= 3) await award(db, userId, 'BRUTAL_TRUTH', sessionId)
    }

    // SENSEI_APPROVED: 5+ clean PASSED verdicts (not PASSED_WITH_NOTES)
    if (!earned.has('SENSEI_APPROVED')) {
      const [row] = await db
        .select({ count: count() })
        .from(attempts)
        .innerJoin(sessions, eq(attempts.sessionId, sessions.id))
        .where(
          and(
            eq(sessions.userId, userId),
            eq(attempts.isFinalEvaluation, true),
            sql`${attempts.llmResponse}::jsonb->>'verdict' = 'PASSED'`,
          ),
        )
      if (Number(row?.count ?? 0) >= 5) await award(db, userId, 'SENSEI_APPROVED', sessionId)
    }

    // SQL_SURVIVOR: 3+ kata with SQL-related topics
    if (!earned.has('SQL_SURVIVOR')) {
      const [row] = await db
        .select({ count: count() })
        .from(sessions)
        .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
        .where(
          and(
            eq(sessions.userId, userId),
            eq(sessions.status, 'completed'),
            sql`${exercises.topics}::jsonb ?| ARRAY['sql', 'SQL', 'database', 'postgresql', 'postgres', 'mysql', 'queries']`,
          ),
        )
      if (Number(row?.count ?? 0) >= 3) await award(db, userId, 'SQL_SURVIVOR', sessionId)
    }

    // UNDEFINED_NO_MORE: 50+ total completed kata (prestige)
    if (!earned.has('UNDEFINED_NO_MORE')) {
      const [row] = await db
        .select({ count: count() })
        .from(sessions)
        .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed')))
      if (Number(row?.count ?? 0) >= 50) await award(db, userId, 'UNDEFINED_NO_MORE', sessionId)
    }
  })
}

async function getEarnedSlugs(db: PostgresJsDatabase, userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ slug: userBadges.badgeSlug })
    .from(userBadges)
    .where(eq(userBadges.userId, userId))
  return new Set(rows.map((r) => r.slug))
}

async function award(db: PostgresJsDatabase, userId: string, slug: string, sessionId: string) {
  await db.insert(userBadges).values({ userId, badgeSlug: slug, sessionId })
}

async function getCurrentStreak(db: PostgresJsDatabase, userId: string): Promise<number> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const heatmapRows = await db
    .select({ date: sql<string>`DATE(${sessions.startedAt})::text` })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed'), gte(sessions.startedAt, thirtyDaysAgo)))
    .groupBy(sql`DATE(${sessions.startedAt})`)

  const dates = heatmapRows.map((r) => r.date)
  if (dates.length === 0) return 0

  const dateSet = new Set(dates)
  const today = new Date().toISOString().slice(0, 10)
  let streak = 0
  const current = new Date()
  if (!dateSet.has(today)) current.setDate(current.getDate() - 1)

  while (true) {
    const dateStr = current.toISOString().slice(0, 10)
    if (!dateSet.has(dateStr)) break
    streak++
    current.setDate(current.getDate() - 1)
  }

  return streak
}
