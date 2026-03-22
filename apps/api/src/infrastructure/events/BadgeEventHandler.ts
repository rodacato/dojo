import { and, count, eq, gte, sql } from 'drizzle-orm'
import type { SessionCompleted } from '../../domain/practice/events'
import type { InMemoryEventBus } from './InMemoryEventBus'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { sessions, userBadges } from '../persistence/drizzle/schema'

export function registerBadgeHandlers(eventBus: InMemoryEventBus, db: PostgresJsDatabase) {
  eventBus.subscribe<SessionCompleted>('SessionCompleted', async (event) => {
    const { userId, aggregateId: sessionId } = event

    // FIRST_KATA: first completed session
    const hasFirstKata = await db
      .select({ id: userBadges.id })
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeSlug, 'FIRST_KATA')))
      .limit(1)

    if (hasFirstKata.length === 0) {
      await db.insert(userBadges).values({
        userId,
        badgeSlug: 'FIRST_KATA',
        sessionId,
      })
    }

    // 5_STREAK: 5 consecutive days
    const has5Streak = await db
      .select({ id: userBadges.id })
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeSlug, '5_STREAK')))
      .limit(1)

    if (has5Streak.length === 0) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const heatmapRows = await db
        .select({ date: sql<string>`DATE(${sessions.startedAt})::text` })
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            eq(sessions.status, 'completed'),
            gte(sessions.startedAt, thirtyDaysAgo),
          ),
        )
        .groupBy(sql`DATE(${sessions.startedAt})`)

      const streak = calculateStreak(heatmapRows.map((r) => r.date))

      if (streak >= 5) {
        await db.insert(userBadges).values({
          userId,
          badgeSlug: '5_STREAK',
          sessionId,
        })
      }
    }
  })
}

function calculateStreak(sessionDates: string[]): number {
  if (sessionDates.length === 0) return 0

  const dateSet = new Set(sessionDates)
  const today = new Date().toISOString().slice(0, 10)
  let streak = 0
  const current = new Date()

  if (!dateSet.has(today)) {
    current.setDate(current.getDate() - 1)
  }

  while (true) {
    const dateStr = current.toISOString().slice(0, 10)
    if (!dateSet.has(dateStr)) break
    streak++
    current.setDate(current.getDate() - 1)
  }

  return streak
}
