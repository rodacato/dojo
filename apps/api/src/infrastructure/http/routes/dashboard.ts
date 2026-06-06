import { and, count, desc, eq, gte, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../../persistence/drizzle/client'
import { attempts, katas, sessions, userPreferences } from '../../persistence/drizzle/schema'
import { useCases } from '../../container'
import { UserId } from '../../../domain/shared/types'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../app-env'
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

  // Phase 1: active session check. May UPDATE session status, which changes
  // the state every subsequent query reads — must finish before Phase 2.
  const [activeRow] = await db
    .select({
      sessionId: sessions.id,
      kataDuration: katas.duration,
      startedAt: sessions.startedAt,
      hasFinalEval: sql<boolean>`EXISTS(
        SELECT 1 FROM ${attempts}
        WHERE ${attempts.sessionId} = ${sessions.id}
          AND ${attempts.isFinalEvaluation} = true
          AND ${attempts.llmResponse} != ''
      )`,
    })
    .from(sessions)
    .innerJoin(katas, eq(sessions.kataId, katas.id))
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'active')))
    .limit(1)

  let activeSessionId: string | null = null
  if (activeRow) {
    const limitMs = activeRow.kataDuration * 60 * 1000 * 1.1
    const elapsedMs = Date.now() - activeRow.startedAt.getTime()
    if (elapsedMs > limitMs) {
      await db
        .update(sessions)
        .set({ status: activeRow.hasFinalEval ? 'completed' : 'failed', completedAt: new Date() })
        .where(eq(sessions.id, activeRow.sessionId))
    } else {
      activeSessionId = activeRow.sessionId
    }
  }

  // Phase 2: every other read is independent of the others, fan out.
  const [
    heatmapRows,
    recentRows,
    totalRows,
    todayRows,
    topicRows,
    avgTimeRows,
    typeCountRows,
    timedOutRows,
    weeklyRows,
    prefs,
    belt,
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
        sql`EXISTS (
          SELECT 1 FROM ${attempts}
          WHERE ${attempts.sessionId} = ${sessions.id}
            AND ${attempts.isFinalEvaluation} = true
        )`,
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
      .select({ count: count() })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed'))),
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
    db
      .select({
        avg: sql<number>`ROUND(AVG(EXTRACT(EPOCH FROM (${sessions.completedAt} - ${sessions.startedAt})) / 60))`,
      })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed'), sql`${sessions.completedAt} IS NOT NULL`)),
    db
      .select({ type: katas.type, count: count() })
      .from(sessions)
      .innerJoin(katas, eq(sessions.kataId, katas.id))
      .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed')))
      .groupBy(katas.type),
    db
      .select({ count: count() })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.status, 'failed'))),
    db
      .select({ count: count() })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed'), gte(sessions.startedAt, weekStart))),
    db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, userId) }),
    useCases.calculateBelt.execute(UserId(userId)),
  ])

  const totalCompleted = Number(totalRows[0]?.count ?? 0)
  const streak = calculateStreak(heatmapRows.map((r) => r.date))

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

  const avgTimeMinutes = Number(avgTimeRows[0]?.avg ?? 0)

  const allTypes = ['CODE', 'CHAT', 'WHITEBOARD']
  const typeCounts = new Map(typeCountRows.map((r) => [r.type, Number(r.count)]))
  const mostAvoided = allTypes
    .map((t) => ({ type: t, count: typeCounts.get(t) ?? 0 }))
    .sort((a, b) => a.count - b.count)[0]

  const sessionsTimedOut = Number(timedOutRows[0]?.count ?? 0)
  const weeklyCompleted = Number(weeklyRows[0]?.count ?? 0)
  const weeklyTarget = prefs?.goalWeeklyTarget ?? null

  return c.json({
    streak,
    totalCompleted,
    todayComplete,
    todaySession,
    activeSessionId,
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
      avgTimeMinutes,
      mostAvoidedType: mostAvoided?.type ?? null,
      sessionsTimedOut,
    },
    weeklyGoal: {
      target: weeklyTarget,
      completed: weeklyCompleted,
    },
    belt,
  })
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
