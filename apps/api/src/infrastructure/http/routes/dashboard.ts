import type { DashboardDTO, HistoryOutcome, HistoryPageDTO } from '@dojo/shared'
import { and, count, desc, eq, gte, ilike, sql } from 'drizzle-orm'
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

/** Monday, like the week strip the count sits beside: a Sunday still belongs to its own week. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  start.setHours(0, 0, 0, 0)
  return start
}

dashboardRoutes.get('/dashboard', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const userId = user.id

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const weekStart = startOfWeek(today)

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
  outcome: z
    .enum(['all', 'passed', 'passed_with_notes', 'needs_work', 'expired', 'no_evaluation'])
    .default('all'),
  q: z.string().trim().max(120).default(''),
})

// `failed` with no verdict is a timeout only if nothing was answered: a broken evaluation leaves an attempt.
function historyOutcome() {
  return sql<HistoryOutcome>`CASE
    WHEN ${verdictSubquery()} IN ('passed', 'passed_with_notes', 'needs_work') THEN ${verdictSubquery()}
    WHEN ${sessions.status} = 'failed' AND NOT EXISTS (
      SELECT 1 FROM ${attempts} WHERE ${attempts.sessionId} = ${sessions.id}
    ) THEN 'expired'
    ELSE 'no_evaluation'
  END`
}

function escapeLikePattern(text: string) {
  return text.replace(/[\\%_]/g, String.raw`\$&`)
}

dashboardRoutes.get('/history', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const parsed = historySchema.safeParse(c.req.query())
  if (!parsed.success) return c.json({ error: 'Invalid history query' }, 400)
  const { page, limit: pageSize, outcome, q } = parsed.data

  const record = and(eq(sessions.userId, user.id), sql`${sessions.status} != 'active'`)
  const matching = and(
    record,
    q ? ilike(katas.title, `%${escapeLikePattern(q)}%`) : undefined,
    outcome === 'all' ? undefined : eq(historyOutcome(), outcome),
  )

  const [recordRows, matchingRows] = await Promise.all([
    db.select({ count: count() }).from(sessions).where(record),
    db
      .select({ count: count() })
      .from(sessions)
      .innerJoin(katas, eq(sessions.kataId, katas.id))
      .where(matching),
  ])
  const recordTotal = Number(recordRows[0]?.count ?? 0)
  const total = Number(matchingRows[0]?.count ?? 0)
  const totalPages = Math.ceil(total / pageSize)
  const currentPage = Math.min(page, Math.max(totalPages, 1))

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
      outcome: historyOutcome(),
    })
    .from(sessions)
    .innerJoin(katas, eq(sessions.kataId, katas.id))
    .where(matching)
    .orderBy(desc(sessions.startedAt), desc(sessions.id))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize)

  return c.json({
    sessions: rows.map((s) => ({
      id: s.id,
      status: s.status,
      kataTitle: s.kataTitle,
      kataType: s.kataType,
      difficulty: s.difficulty,
      verdict: s.verdict ?? null,
      outcome: s.outcome,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt?.toISOString() ?? null,
    })),
    total,
    recordTotal,
    page: currentPage,
    totalPages,
  } satisfies HistoryPageDTO)
})
