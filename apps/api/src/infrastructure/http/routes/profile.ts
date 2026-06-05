import { and, count, desc, eq, gte, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../../persistence/drizzle/client'
import { attempts, katas, sessions, userMilestones, users } from '../../persistence/drizzle/schema'
import type { AppEnv } from '../app-env'
import { verdictSubquery, calculateStreak } from './query-helpers'

export const profileRoutes = new Hono<AppEnv>()

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
    .selectDistinct({ lang: sql<string>`jsonb_array_elements_text(${katas.language})` })
    .from(sessions)
    .innerJoin(katas, eq(sessions.kataId, katas.id))
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
      completedAt: sessions.completedAt,
      kataTitle: katas.title,
      kataType: katas.type,
      difficulty: katas.difficulty,
      verdict: verdictSubquery(),
    })
    .from(sessions)
    .innerJoin(katas, eq(sessions.kataId, katas.id))
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed')))
    .orderBy(desc(sessions.startedAt))
    .limit(10)

  const streak = calculateStreak(heatmapRows.map((r) => r.date))

  // Milestones
  const badgeRows = await db
    .select({
      slug: userMilestones.milestoneSlug,
      earnedAt: userMilestones.earnedAt,
    })
    .from(userMilestones)
    .where(eq(userMilestones.userId, userId))
    .orderBy(userMilestones.earnedAt)

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
      kataTitle: s.kataTitle,
      kataType: s.kataType,
      difficulty: s.difficulty,
      verdict: s.verdict ?? null,
      status: s.status,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt ? s.completedAt.toISOString() : null,
    })),
    milestones: badgeRows.map((b) => ({
      slug: b.slug,
      earnedAt: b.earnedAt.toISOString(),
    })),
  })
})
