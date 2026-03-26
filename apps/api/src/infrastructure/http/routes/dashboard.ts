import { and, count, desc, eq, gte, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../../persistence/drizzle/client'
import { attempts, exercises, sessions } from '../../persistence/drizzle/schema'
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

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Active session — single joined query instead of 3 cascaded queries
  const [activeRow] = await db
    .select({
      sessionId: sessions.id,
      exerciseDuration: exercises.duration,
      startedAt: sessions.startedAt,
      hasFinalEval: sql<boolean>`EXISTS(
        SELECT 1 FROM ${attempts}
        WHERE ${attempts.sessionId} = ${sessions.id}
          AND ${attempts.isFinalEvaluation} = true
          AND ${attempts.llmResponse} != ''
      )`,
    })
    .from(sessions)
    .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'active')))
    .limit(1)

  let activeSessionId: string | null = null
  if (activeRow) {
    const limitMs = activeRow.exerciseDuration * 60 * 1000 * 1.1
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

  // Heatmap: sessions per day (last 30 days, any status)
  const heatmapRows = await db
    .select({
      date: sql<string>`DATE(${sessions.startedAt})::text`,
      count: count(),
    })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gte(sessions.startedAt, thirtyDaysAgo)))
    .groupBy(sql`DATE(${sessions.startedAt})`)

  // Recent sessions with exercise info + verdict (last 5 completed/failed)
  const recentRows = await db
    .select({
      id: sessions.id,
      status: sessions.status,
      startedAt: sessions.startedAt,
      exerciseTitle: exercises.title,
      exerciseType: exercises.type,
      difficulty: exercises.difficulty,
      verdict: verdictSubquery(),
    })
    .from(sessions)
    .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
    .where(and(eq(sessions.userId, userId), sql`${sessions.status} != 'active'`))
    .orderBy(desc(sessions.startedAt))
    .limit(5)

  // Total completed sessions (all time)
  const [totalRow] = await db
    .select({ count: count() })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed')))
  const totalCompleted = Number(totalRow?.count ?? 0)

  // Streak: count consecutive days with any session going back from today
  const streak = calculateStreak(heatmapRows.map((r) => r.date))

  // Today session — single joined query instead of 3 cascaded queries
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const [todayRow] = await db
    .select({
      id: sessions.id,
      exerciseTitle: exercises.title,
      verdict: sql<string | null>`(
        SELECT ${attempts.llmResponse}::jsonb->>'verdict'
        FROM ${attempts}
        WHERE ${attempts.sessionId} = ${sessions.id} AND ${attempts.isFinalEvaluation} = true
        LIMIT 1
      )`,
    })
    .from(sessions)
    .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
    .where(and(
      eq(sessions.userId, userId),
      sql`${sessions.status} IN ('completed', 'failed')`,
      gte(sessions.startedAt, todayStart),
    ))
    .orderBy(desc(sessions.startedAt))
    .limit(1)

  const todayComplete = !!todayRow
  const todaySession = todayRow
    ? { id: todayRow.id, exerciseTitle: todayRow.exerciseTitle, verdict: todayRow.verdict }
    : null

  // --- Extended dashboard data ---

  // "Where you struggle": aggregate topicsToReview across all sessions
  const topicRows = await db
    .select({
      topic: sql<string>`jsonb_array_elements_text(${attempts.llmResponse}::jsonb->'topicsToReview')`,
    })
    .from(attempts)
    .innerJoin(sessions, eq(attempts.sessionId, sessions.id))
    .where(and(eq(sessions.userId, userId), eq(attempts.isFinalEvaluation, true)))

  const topicCounts = new Map<string, number>()
  for (const row of topicRows) {
    if (row.topic) topicCounts.set(row.topic, (topicCounts.get(row.topic) ?? 0) + 1)
  }
  const weakAreas = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, frequency]) => ({ topic, frequency }))

  // "How you practice": avg time, most avoided type, timed out
  const [avgTimeRow] = await db
    .select({
      avg: sql<number>`ROUND(AVG(EXTRACT(EPOCH FROM (${sessions.completedAt} - ${sessions.startedAt})) / 60))`,
    })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed'), sql`${sessions.completedAt} IS NOT NULL`))
  const avgTimeMinutes = Number(avgTimeRow?.avg ?? 0)

  // Most avoided type: type with fewest completions
  const typeCountRows = await db
    .select({ type: exercises.type, count: count() })
    .from(sessions)
    .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed')))
    .groupBy(exercises.type)
  const allTypes = ['CODE', 'CHAT', 'WHITEBOARD']
  const typeCounts = new Map(typeCountRows.map((r) => [r.type, Number(r.count)]))
  const mostAvoided = allTypes
    .map((t) => ({ type: t, count: typeCounts.get(t) ?? 0 }))
    .sort((a, b) => a.count - b.count)[0]

  // Sessions timed out (failed)
  const [timedOutRow] = await db
    .select({ count: count() })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'failed')))
  const sessionsTimedOut = Number(timedOutRow?.count ?? 0)

  return c.json({
    streak,
    totalCompleted,
    todayComplete,
    todaySession,
    activeSessionId,
    heatmapData: heatmapRows.map((r) => ({ date: r.date, count: Number(r.count) })),
    recentSessions: recentRows.map((s) => ({
      id: s.id,
      exerciseTitle: s.exerciseTitle,
      exerciseType: s.exerciseType,
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
    senseiSuggests: weakAreas.slice(0, 3).map((a) => a.topic),
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
      exerciseTitle: exercises.title,
      exerciseType: exercises.type,
      difficulty: exercises.difficulty,
      verdict: verdictSubquery(),
    })
    .from(sessions)
    .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
    .where(and(eq(sessions.userId, user.id), sql`${sessions.status} != 'active'`))
    .orderBy(desc(sessions.startedAt))
    .limit(pageSize)
    .offset(offset)

  return c.json({
    sessions: rows.map((s) => ({
      id: s.id,
      status: s.status,
      exerciseTitle: s.exerciseTitle,
      exerciseType: s.exerciseType,
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
