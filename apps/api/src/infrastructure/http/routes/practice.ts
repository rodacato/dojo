import { and, count, desc, eq, gte, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { config } from '../../../config'
import { SessionExpiredError } from '../../../domain/shared/errors'
import { ExerciseId, SessionId, UserId } from '../../../domain/shared/types'
import { useCases } from '../../container'
import { db } from '../../persistence/drizzle/client'
import { attempts, exercises, invitations, sessions, users, variations } from '../../persistence/drizzle/schema'
import { requireAuth, requireCreator } from '../middleware/auth'
import type { AppEnv } from '../app-env'
import type { Difficulty, ExerciseType } from '../../../domain/content/values'
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

  // Generate kata body in background — don't block the response
  void useCases.generateSessionBody
    .execute({ sessionId: session.id, exerciseId: session.exerciseId, variationId: session.variationId })
    .catch((err) => console.error('Failed to generate session body:', err))

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

  // Fetch attempts for this session
  const sessionAttempts = await db
    .select()
    .from(attempts)
    .where(eq(attempts.sessionId, sessionId))
    .orderBy(desc(attempts.submittedAt))

  const finalAttempt = sessionAttempts.find((a) => a.isFinalEvaluation) ?? sessionAttempts[0] ?? null

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
    finalAttempt: finalAttempt
      ? {
          id: finalAttempt.id,
          userResponse: finalAttempt.userResponse,
          ...parseLlmResponse(finalAttempt.llmResponse),
          isFinalEvaluation: finalAttempt.isFinalEvaluation,
          submittedAt: finalAttempt.submittedAt.toISOString(),
        }
      : null,
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

  // Recent sessions with exercise info + verdict (last 5 completed/failed)
  const recentRows = await db
    .select({
      id: sessions.id,
      status: sessions.status,
      startedAt: sessions.startedAt,
      exerciseTitle: exercises.title,
      exerciseType: exercises.type,
      difficulty: exercises.difficulty,
      verdict: sql<string | null>`(
        SELECT ${attempts.llmResponse}::jsonb->>'verdict'
        FROM ${attempts}
        WHERE ${attempts.sessionId} = ${sessions.id} AND ${attempts.isFinalEvaluation} = true
        LIMIT 1
      )`,
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

  // Today complete: any non-active session today
  const today = new Date().toISOString().slice(0, 10)
  const todayComplete = heatmapRows.some(
    (r) => r.date === today && recentRows.some((s) => s.startedAt.toISOString().slice(0, 10) === today),
  )

  return c.json({
    streak,
    totalCompleted,
    todayComplete,
    activeSessionId: activeSession?.id ?? null,
    heatmapData: heatmapRows.map((r) => ({ date: r.date, count: Number(r.count) })),
    recentSessions: recentRows.map((s) => ({
      id: s.id,
      exerciseTitle: s.exerciseTitle,
      exerciseType: s.exerciseType,
      difficulty: s.difficulty,
      verdict: s.verdict ?? null,
      startedAt: s.startedAt.toISOString(),
    })),
  })
})

// ---------------------------------------------------------------------------
// GET /history
// ---------------------------------------------------------------------------

const historySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

practiceRoutes.get('/history', requireAuth, async (c) => {
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
      verdict: sql<string | null>`(
        SELECT ${attempts.llmResponse}::jsonb->>'verdict'
        FROM ${attempts}
        WHERE ${attempts.sessionId} = ${sessions.id} AND ${attempts.isFinalEvaluation} = true
        LIMIT 1
      )`,
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

adminRoutes.get('/exercises/:id', async (c) => {
  const exerciseId = c.req.param('id')!
  const exercise = await useCases.getExerciseById.execute(ExerciseId(exerciseId))
  if (!exercise) return c.json({ error: 'Exercise not found' }, 404)

  return c.json({
    id: exercise.id,
    title: exercise.title,
    description: exercise.description,
    duration: exercise.durationMinutes,
    difficulty: exercise.difficulty,
    type: exercise.type,
    languages: exercise.languages,
    tags: exercise.tags,
    topics: exercise.topics,
    status: exercise.status,
    variations: exercise.variations.map((v) => ({
      id: v.id,
      ownerRole: v.ownerRole,
      ownerContext: v.ownerContext,
    })),
  })
})

const updateExerciseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  duration: z.number().int().positive(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  type: z.enum(['code', 'chat', 'whiteboard']),
  languages: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  variations: z
    .array(z.object({ ownerRole: z.string().min(1), ownerContext: z.string().min(1) }))
    .min(1),
})

adminRoutes.put('/exercises/:id', async (c) => {
  const exerciseId = c.req.param('id')!
  const body = await c.req.json()
  const parsed = updateExerciseSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request body' }, 400)

  const { title, description, duration, difficulty, type, languages, tags, topics } = parsed.data

  // Update exercise fields
  await db
    .update(exercises)
    .set({
      title,
      description,
      duration,
      difficulty,
      type,
      language: JSON.stringify(languages),
      tags: JSON.stringify(tags),
      topics: JSON.stringify(topics),
    })
    .where(eq(exercises.id, exerciseId))

  // Replace variations: delete old, insert new
  await db.delete(variations).where(eq(variations.exerciseId, exerciseId))
  for (const v of parsed.data.variations) {
    await db.insert(variations).values({
      id: crypto.randomUUID(),
      exerciseId,
      ownerRole: v.ownerRole,
      ownerContext: v.ownerContext,
    })
  }

  return c.json({ ok: true })
})

const createExerciseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  duration: z.number().int().positive(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  type: z.enum(['code', 'chat', 'whiteboard']),
  languages: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  variations: z
    .array(z.object({ ownerRole: z.string().min(1), ownerContext: z.string().min(1) }))
    .min(1),
})

adminRoutes.post('/exercises', async (c) => {
  const user = c.get('user') as { id: string }
  const body = await c.req.json()
  const parsed = createExerciseSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request body' }, 400)

  const { title, description, duration, difficulty, type, languages, tags, topics, variations } =
    parsed.data
  const result = await useCases.createExercise.execute({
    title,
    description,
    durationMinutes: duration,
    difficulty: difficulty as Difficulty,
    type: type as ExerciseType,
    languages,
    tags,
    topics,
    createdBy: UserId(user.id),
    variations,
  })

  return c.json({ id: result.id }, 201)
})

// ---------------------------------------------------------------------------
// Admin: Invitations
// ---------------------------------------------------------------------------

adminRoutes.post('/invitations', async (c) => {
  const user = c.get('user') as { id: string }

  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days

  const [invitation] = await db
    .insert(invitations)
    .values({ token, createdBy: user.id, expiresAt })
    .returning()

  return c.json({
    id: invitation!.id,
    token: invitation!.token,
    url: `${config.WEB_URL}/invite/${invitation!.token}`,
    expiresAt: invitation!.expiresAt.toISOString(),
  }, 201)
})

adminRoutes.get('/invitations', async (c) => {
  const rows = await db
    .select({
      id: invitations.id,
      token: invitations.token,
      usedBy: invitations.usedBy,
      usedByUsername: users.username,
      expiresAt: invitations.expiresAt,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .leftJoin(users, eq(invitations.usedBy, users.id))
    .orderBy(desc(invitations.createdAt))

  return c.json(
    rows.map((r) => ({
      id: r.id,
      token: r.token,
      status: r.usedBy ? 'used' : new Date(r.expiresAt) < new Date() ? 'expired' : 'pending',
      usedBy: r.usedByUsername ?? null,
      expiresAt: r.expiresAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
  )
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseLlmResponse(raw: string): { verdict: string | null; analysis: string; topicsToReview: string[] } {
  try {
    const parsed = JSON.parse(raw) as { verdict?: string; analysis?: string; topicsToReview?: string[] }
    return {
      verdict: parsed.verdict ?? null,
      analysis: parsed.analysis ?? '',
      topicsToReview: parsed.topicsToReview ?? [],
    }
  } catch {
    return { verdict: null, analysis: raw, topicsToReview: [] }
  }
}

function calculateStreak(sessionDates: string[]): number {
  if (sessionDates.length === 0) return 0

  const dateSet = new Set(sessionDates)
  const today = new Date().toISOString().slice(0, 10)
  let streak = 0
  const current = new Date()

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
