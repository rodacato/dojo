import { and, count, desc, eq, gte, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../../persistence/drizzle/client'
import { attempts, exercises, sessions, userBadges, users } from '../../persistence/drizzle/schema'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../app-env'
import { verdictSubquery, calculateStreak } from './query-helpers'

export const profileRoutes = new Hono<AppEnv>()

// ---------------------------------------------------------------------------
// GET /leaderboard — Consistency-ranked practitioners
// ---------------------------------------------------------------------------

const leaderboardSchema = z.object({
  period: z.enum(['month', 'all-time']).default('month'),
})

profileRoutes.get('/leaderboard', requireAuth, async (c) => {
  const currentUser = c.get('user') as { id: string }
  const query = c.req.query()
  const { period } = leaderboardSchema.parse(query)

  const periodFilter =
    period === 'month'
      ? gte(sessions.startedAt, sql`DATE_TRUNC('month', CURRENT_DATE)`)
      : sql`TRUE`

  const rows = await db
    .select({
      userId: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      kataCount: count(sessions.id),
      lastActive: sql<string>`MAX(${sessions.startedAt})::text`,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.status, 'completed'), periodFilter))
    .groupBy(users.id, users.username, users.avatarUrl)
    .orderBy(desc(count(sessions.id)))
    .limit(50)

  // Compute pass rate and streak for each user
  const entries = await Promise.all(
    rows.map(async (row, index) => {
      // Pass rate
      const [passedRow] = await db
        .select({ count: count() })
        .from(sessions)
        .innerJoin(attempts, and(eq(attempts.sessionId, sessions.id), eq(attempts.isFinalEvaluation, true)))
        .where(
          and(
            eq(sessions.userId, row.userId),
            eq(sessions.status, 'completed'),
            periodFilter,
            sql`${attempts.llmResponse}::jsonb->>'verdict' IN ('PASSED', 'PASSED_WITH_NOTES')`,
          ),
        )
      const passed = Number(passedRow?.count ?? 0)
      const total = Number(row.kataCount)
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

      // Streak (all-time, not period-filtered)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const heatmapRows = await db
        .select({ date: sql<string>`DATE(${sessions.startedAt})::text` })
        .from(sessions)
        .where(and(eq(sessions.userId, row.userId), gte(sessions.startedAt, thirtyDaysAgo)))
        .groupBy(sql`DATE(${sessions.startedAt})`)
      const streak = calculateStreak(heatmapRows.map((r) => r.date))

      return {
        rank: index + 1,
        userId: row.userId,
        username: row.username,
        avatarUrl: row.avatarUrl,
        streak,
        kataCount: total,
        passRate,
        lastActive: row.lastActive,
        isCurrentUser: row.userId === currentUser.id,
      }
    }),
  )

  return c.json({ entries, period })
})

// ---------------------------------------------------------------------------
// GET /u/:username — Public profile (no auth required)
// ---------------------------------------------------------------------------

profileRoutes.get('/u/:username', async (c) => {
  const { username } = c.req.param()

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  })

  if (!user) return c.json({ error: 'User not found' }, 404)

  const userId = user.id
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  // Heatmap (90 days for profile)
  const heatmapRows = await db
    .select({
      date: sql<string>`DATE(${sessions.startedAt})::text`,
      count: count(),
    })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gte(sessions.startedAt, ninetyDaysAgo)))
    .groupBy(sql`DATE(${sessions.startedAt})`)

  // Total completed
  const [totalRow] = await db
    .select({ count: count() })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed')))
  const totalCompleted = Number(totalRow?.count ?? 0)

  // Pass rate
  const [passedRow] = await db
    .select({ count: count() })
    .from(sessions)
    .innerJoin(attempts, and(eq(attempts.sessionId, sessions.id), eq(attempts.isFinalEvaluation, true)))
    .where(
      and(
        eq(sessions.userId, userId),
        eq(sessions.status, 'completed'),
        sql`${attempts.llmResponse}::jsonb->>'verdict' IN ('PASSED', 'PASSED_WITH_NOTES')`,
      ),
    )
  const passed = Number(passedRow?.count ?? 0)
  const passRate = totalCompleted > 0 ? Math.round((passed / totalCompleted) * 100) : 0

  // Languages used (distinct)
  const langRows = await db
    .selectDistinct({ lang: sql<string>`unnest(${exercises.language})` })
    .from(sessions)
    .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed')))

  // Avg time (completed sessions)
  const [avgRow] = await db
    .select({
      avg: sql<number>`ROUND(AVG(EXTRACT(EPOCH FROM (${sessions.completedAt} - ${sessions.startedAt})) / 60))`,
    })
    .from(sessions)
    .where(
      and(eq(sessions.userId, userId), eq(sessions.status, 'completed'), sql`${sessions.completedAt} IS NOT NULL`),
    )

  // Recent sessions (last 10, public)
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
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed')))
    .orderBy(desc(sessions.startedAt))
    .limit(10)

  const streak = calculateStreak(heatmapRows.map((r) => r.date))

  // Badges
  const badgeRows = await db
    .select({
      slug: userBadges.badgeSlug,
      earnedAt: userBadges.earnedAt,
    })
    .from(userBadges)
    .where(eq(userBadges.userId, userId))
    .orderBy(userBadges.earnedAt)

  return c.json({
    username: user.username,
    avatarUrl: user.avatarUrl,
    memberSince: user.createdAt.toISOString(),
    stats: {
      totalKata: totalCompleted,
      passRate,
      avgTimeMinutes: Number(avgRow?.avg ?? 0),
      languages: langRows.map((r) => r.lang),
    },
    streak,
    heatmapData: heatmapRows.map((r) => ({ date: r.date, count: Number(r.count) })),
    recentSessions: recentRows.map((s) => ({
      id: s.id,
      exerciseTitle: s.exerciseTitle,
      exerciseType: s.exerciseType,
      difficulty: s.difficulty,
      verdict: s.verdict ?? null,
      startedAt: s.startedAt.toISOString(),
    })),
    badges: badgeRows.map((b) => ({
      slug: b.slug,
      earnedAt: b.earnedAt.toISOString(),
    })),
  })
})
