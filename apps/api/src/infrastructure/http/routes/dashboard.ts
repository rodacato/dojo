import type { DashboardDTO } from '@dojo/shared'
import { and, count, desc, eq, gte, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../../persistence/drizzle/client'
import { attempts, katas, sessions, userPreferences } from '../../persistence/drizzle/schema'
import { useCases } from '../../container'
import { UserId } from '../../../domain/shared/types'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../app-env'
import { isEligiblePractice } from '../../persistence/eligible-practice'
import { loadPracticeDays, loadPracticeMetrics } from '../../persistence/practice-metrics'
import { verdictSubquery, calculateStreak } from './query-helpers'

export const dashboardRoutes = new Hono<AppEnv>()

// ---------------------------------------------------------------------------
// GET /dashboard
// ---------------------------------------------------------------------------

dashboardRoutes.get('/dashboard', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const userId = user.id

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  // Expiring a session changes what every read below sees, so it finishes first.
  const activeSessionId = await useCases.resolveActiveSession.execute(UserId(userId))

  const [
    heatmapRows,
    recentRows,
    todayRows,
    topicRows,
    metrics,
    practiceDays,
    prefs,
    belt,
    dailyKata,
  ] = await Promise.all([
    db
      .select({
        date: sql<string>`DATE(${sessions.startedAt})::text`,
        count: count(),
      })
      .from(sessions)
      .where(and(
        eq(sessions.userId, userId),
        gte(sessions.startedAt, thirtyDaysAgo),
        isEligiblePractice(),
      ))
      .groupBy(sql`DATE(${sessions.startedAt})`),
    db
      .select({
        id: sessions.id,
        status: sessions.status,
        startedAt: sessions.startedAt,
        kataTitle: katas.title,
        kataType: katas.type,
        difficulty: katas.difficulty,
        verdict: verdictSubquery(),
      })
      .from(sessions)
      .innerJoin(katas, eq(sessions.kataId, katas.id))
      .where(and(eq(sessions.userId, userId), sql`${sessions.status} != 'active'`))
      .orderBy(desc(sessions.startedAt))
      .limit(5),
    db
      .select({
        id: sessions.id,
        kataTitle: katas.title,
        verdict: sql<string | null>`(
          SELECT ${attempts.llmResponse}::jsonb->>'verdict'
          FROM ${attempts}
          WHERE ${attempts.sessionId} = ${sessions.id} AND ${attempts.isFinalEvaluation} = true
          LIMIT 1
        )`,
      })
      .from(sessions)
      .innerJoin(katas, eq(sessions.kataId, katas.id))
      .where(and(
        eq(sessions.userId, userId),
        sql`${sessions.status} IN ('completed', 'failed')`,
        gte(sessions.startedAt, todayStart),
      ))
      .orderBy(desc(sessions.startedAt))
      .limit(1),
    db
      .select({
        topic: sql<string>`jsonb_array_elements_text(${attempts.llmResponse}::jsonb->'topicsToReview')`,
      })
      .from(attempts)
      .innerJoin(sessions, eq(attempts.sessionId, sessions.id))
      .where(and(eq(sessions.userId, userId), eq(attempts.isFinalEvaluation, true))),
    loadPracticeMetrics(db, userId, weekStart),
    loadPracticeDays(db, userId),
    db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, userId) }),
    useCases.calculateBelt.execute(UserId(userId)),
    useCases.pickDailyKata.execute(UserId(userId)),
  ])

  const streak = calculateStreak(practiceDays)

  const todayRow = todayRows[0]
  const todayComplete = !!todayRow
  const todaySession = todayRow
    ? { id: todayRow.id, kataTitle: todayRow.kataTitle, verdict: todayRow.verdict }
    : null

  const topicCounts = new Map<string, number>()
  for (const row of topicRows) {
    if (row.topic) topicCounts.set(row.topic, (topicCounts.get(row.topic) ?? 0) + 1)
  }
  const weakAreas = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, frequency]) => ({ topic, frequency }))

  const allTypes = ['CODE', 'CHAT', 'WHITEBOARD', 'REVIEW']
  const typeCounts = new Map(metrics.typeCounts.map((r) => [r.type.toUpperCase(), r.count]))
  const mostAvoided = allTypes
    .map((t) => ({ type: t, count: typeCounts.get(t) ?? 0 }))
    .sort((a, b) => a.count - b.count)[0]

  const weeklyTarget = prefs?.goalWeeklyTarget ?? null

  return c.json({
    streak,
    totalCompleted: metrics.total,
    todayComplete,
    todaySession,
    activeSessionId,
    dailyKataMinutes: dailyKata?.durationMinutes ?? null,
    heatmapData: heatmapRows.map((r) => ({ date: r.date, count: Number(r.count) })),
    recentSessions: recentRows.map((s) => ({
      id: s.id,
      kataTitle: s.kataTitle,
      kataType: s.kataType,
      difficulty: s.difficulty,
      verdict: s.verdict ?? null,
      startedAt: s.startedAt.toISOString(),
    })),
    // Extended
    weakAreas,
    practicePatterns: {
      avgTimeMinutes: metrics.avgTimeMinutes,
      mostAvoidedType: mostAvoided?.type ?? null,
      sessionsTimedOut: metrics.timedOut,
    },
    weeklyGoal: {
      target: weeklyTarget,
      completed: metrics.weekly,
    },
    belt,
  } satisfies DashboardDTO)
})

// ---------------------------------------------------------------------------
// GET /history
// ---------------------------------------------------------------------------

const historySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

dashboardRoutes.get('/history', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const query = c.req.query()
  const { page, limit: pageSize } = historySchema.parse({
    page: query['page'],
    limit: query['limit'],
  })
  const offset = (page - 1) * pageSize

  const [totalRow] = await db
    .select({ count: count() })
    .from(sessions)
    .where(and(eq(sessions.userId, user.id), sql`${sessions.status} != 'active'`))
  const total = Number(totalRow?.count ?? 0)

  const rows = await db
    .select({
      id: sessions.id,
      status: sessions.status,
      startedAt: sessions.startedAt,
      completedAt: sessions.completedAt,
      kataTitle: katas.title,
      kataType: katas.type,
      difficulty: katas.difficulty,
      verdict: verdictSubquery(),
    })
    .from(sessions)
    .innerJoin(katas, eq(sessions.kataId, katas.id))
    .where(and(eq(sessions.userId, user.id), sql`${sessions.status} != 'active'`))
    .orderBy(desc(sessions.startedAt))
    .limit(pageSize)
    .offset(offset)

  return c.json({
    sessions: rows.map((s) => ({
      id: s.id,
      status: s.status,
      kataTitle: s.kataTitle,
      kataType: s.kataType,
      difficulty: s.difficulty,
      verdict: s.verdict ?? null,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt?.toISOString() ?? null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  })
})
