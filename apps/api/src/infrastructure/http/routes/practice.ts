import { and, count, desc, eq, gte, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { config } from '../../../config'
import { SessionExpiredError } from '../../../domain/shared/errors'
import { ExerciseId, SessionId, UserId } from '../../../domain/shared/types'
import { useCases } from '../../container'
import { db } from '../../persistence/drizzle/client'
import { attempts, exercises, sessions, variations } from '../../persistence/drizzle/schema'
import { requireAuth, requireCreator } from '../middleware/auth'
import type { AppEnv } from '../app-env'
import { pendingAttempts } from './pending-attempts'

export const practiceRoutes = new Hono<AppEnv>()
export const adminRoutes = new Hono<AppEnv>()

// Apply requireCreator to all admin routes
adminRoutes.use('*', requireAuth, requireCreator)

// ---------------------------------------------------------------------------
// GET /auth/me
// ---------------------------------------------------------------------------

practiceRoutes.get('/auth/me', requireAuth, (c) => {
  const user = c.get('user') as {
    id: string
    githubId: string
    username: string
    avatarUrl: string
    createdAt: Date
  }
  return c.json({
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    isCreator: !!config.CREATOR_GITHUB_ID && user.githubId === config.CREATOR_GITHUB_ID,
  })
})

// ---------------------------------------------------------------------------
// GET /exercises
// ---------------------------------------------------------------------------

const exerciseFiltersSchema = z.object({
  mood: z.enum(['focused', 'regular', 'low_energy']).optional(),
  maxDuration: z.coerce.number().int().positive().optional(),
})

practiceRoutes.get('/exercises', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const query = c.req.query()
  const filters = exerciseFiltersSchema.parse({
    mood: query['mood'],
    maxDuration: query['maxDuration'],
  })

  const exerciseList = await useCases.getExerciseOptions.execute({
    userId: UserId(user.id),
    filters,
  })

  return c.json(
    exerciseList.map((ex) => ({
      id: ex.id,
      title: ex.title,
      description: ex.description,
      duration: ex.durationMinutes,
      difficulty: ex.difficulty,
      type: ex.type,
      language: ex.languages,
      tags: ex.tags,
    })),
  )
})

// ---------------------------------------------------------------------------
// POST /sessions
// ---------------------------------------------------------------------------

const startSessionSchema = z.object({
  exerciseId: z.string().uuid(),
})

practiceRoutes.post('/sessions', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const body = await c.req.json()
  const parsed = startSessionSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request body' }, 400)

  const { exerciseId } = parsed.data

  // Fetch exercise to pick a random variation
  const exercise = await useCases.getExerciseById.execute(ExerciseId(exerciseId))
  if (!exercise) return c.json({ error: 'Exercise not found' }, 404)
  if (exercise.variations.length === 0) return c.json({ error: 'Exercise has no variations' }, 422)

  const variation = exercise.variations[Math.floor(Math.random() * exercise.variations.length)]!

  const session = await useCases.startSession.execute({
    userId: UserId(user.id),
    exerciseId: ExerciseId(exerciseId),
    variationId: variation.id,
  })

  return c.json({ sessionId: session.id }, 201)
})

// ---------------------------------------------------------------------------
// GET /sessions/:id
// ---------------------------------------------------------------------------

practiceRoutes.get('/sessions/:id', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const sessionId = c.req.param('id')!

  const session = await useCases.getSession.execute(SessionId(sessionId))
  if (!session) return c.json({ error: 'Session not found' }, 404)
  if (session.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)

  const exercise = await useCases.getExerciseById.execute(session.exerciseId)
  if (!exercise) return c.json({ error: 'Exercise not found' }, 404)

  const variation = exercise.variations.find((v) => v.id === session.variationId)

  return c.json({
    id: session.id,
    body: session.body,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    variationId: session.variationId,
    ownerRole: variation?.ownerRole ?? '',
    exercise: {
      id: exercise.id,
      title: exercise.title,
      description: exercise.description,
      duration: exercise.durationMinutes,
      difficulty: exercise.difficulty,
      type: exercise.type,
      language: exercise.languages,
      tags: exercise.tags,
    },
  })
})

// ---------------------------------------------------------------------------
// POST /sessions/:id/attempts
// ---------------------------------------------------------------------------

const submitAttemptSchema = z.object({
  userResponse: z.string().min(1),
})

practiceRoutes.post('/sessions/:id/attempts', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const sessionId = c.req.param('id')!

  const body = await c.req.json()
  const parsed = submitAttemptSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request body' }, 400)

  const session = await useCases.getSession.execute(SessionId(sessionId))
  if (!session) return c.json({ error: 'Session not found' }, 404)
  if (session.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)
  if (session.status !== 'active') return c.json({ error: 'Session is no longer active' }, 409)

  // Timer enforcement — 10% grace window
  const exercise = await useCases.getExerciseById.execute(session.exerciseId)
  if (!exercise) return c.json({ error: 'Exercise not found' }, 404)

  const limitMs = exercise.durationMinutes * 60 * 1000 * 1.1
  const elapsedMs = Date.now() - session.startedAt.getTime()
  if (elapsedMs > limitMs) {
    throw new SessionExpiredError(sessionId)
  }

  // Store in pendingAttempts for the WebSocket handler (ADR-008)
  const attemptId = crypto.randomUUID()
  pendingAttempts.set(attemptId, { sessionId, userResponse: parsed.data.userResponse })
  setTimeout(() => pendingAttempts.delete(attemptId), 5 * 60 * 1000)

  return c.json({ attemptId }, 202)
})

// ---------------------------------------------------------------------------
// GET /dashboard
// ---------------------------------------------------------------------------

practiceRoutes.get('/dashboard', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const userId = user.id

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Active session
  const activeSession = await db.query.sessions.findFirst({
    where: and(eq(sessions.userId, userId), eq(sessions.status, 'active')),
  })

  // Heatmap: sessions per day (last 30 days, any status)
  const heatmapRows = await db
    .select({
      date: sql<string>`DATE(${sessions.startedAt})::text`,
      count: count(),
    })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gte(sessions.startedAt, thirtyDaysAgo)))
    .groupBy(sql`DATE(${sessions.startedAt})`)

  // Recent sessions with exercise info (last 5 completed/failed)
  const recentRows = await db
    .select({
      id: sessions.id,
      status: sessions.status,
      startedAt: sessions.startedAt,
      exerciseTitle: exercises.title,
      exerciseType: exercises.type,
      difficulty: exercises.difficulty,
    })
    .from(sessions)
    .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
    .where(and(eq(sessions.userId, userId), sql`${sessions.status} != 'active'`))
    .orderBy(desc(sessions.startedAt))
    .limit(5)

  // Streak: count consecutive days with any session going back from today
  const streak = calculateStreak(heatmapRows.map((r) => r.date))

  // Today complete: any non-active session today
  const today = new Date().toISOString().slice(0, 10)
  const todayComplete = heatmapRows.some(
    (r) => r.date === today && recentRows.some((s) => s.startedAt.toISOString().slice(0, 10) === today),
  )

  return c.json({
    streak,
    todayComplete,
    activeSessionId: activeSession?.id ?? null,
    heatmapData: heatmapRows.map((r) => ({ date: r.date, count: Number(r.count) })),
    recentSessions: recentRows.map((s) => ({
      id: s.id,
      exerciseTitle: s.exerciseTitle,
      exerciseType: s.exerciseType,
      difficulty: s.difficulty,
      verdict: null, // TODO: join with attempts to get final verdict
      startedAt: s.startedAt.toISOString(),
    })),
  })
})

// ---------------------------------------------------------------------------
// Admin routes (skeleton — Exercise section only in Phase 0)
// ---------------------------------------------------------------------------

adminRoutes.get('/exercises', async (c) => {
  const rows = await db
    .select({
      id: exercises.id,
      title: exercises.title,
      type: exercises.type,
      difficulty: exercises.difficulty,
      duration: exercises.duration,
      status: exercises.status,
      createdAt: exercises.createdAt,
      variationCount: sql<number>`count(distinct ${variations.id})`,
      sessionCount: sql<number>`count(distinct ${sessions.id})`,
      avgScore: sql<number | null>`
        avg(case when ${attempts.isFinalEvaluation} = true then
          case when ${attempts.llmResponse}::jsonb->>'verdict' in ('passed', 'passed_with_notes') then 1.0 else 0.0 end
        end)
      `,
    })
    .from(exercises)
    .leftJoin(variations, eq(variations.exerciseId, exercises.id))
    .leftJoin(sessions, eq(sessions.exerciseId, exercises.id))
    .leftJoin(attempts, eq(attempts.sessionId, sessions.id))
    .groupBy(exercises.id)
    .orderBy(desc(exercises.createdAt))

  return c.json(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      difficulty: r.difficulty,
      duration: r.duration,
      status: r.status,
      variationCount: Number(r.variationCount),
      sessionCount: Number(r.sessionCount),
      avgScore: r.avgScore !== null ? Number(r.avgScore) : null,
      createdAt: r.createdAt.toISOString(),
    })),
  )
})

adminRoutes.post('/exercises', async (c) => {
  // TODO: Spec 014 — implement exercise creation
  return c.json({ error: 'Not implemented' }, 501)
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculateStreak(sessionDates: string[]): number {
  if (sessionDates.length === 0) return 0

  const dateSet = new Set(sessionDates)
  const today = new Date().toISOString().slice(0, 10)
  let streak = 0
  let current = new Date()

  // Start from today; if no session today, start from yesterday
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
