import { and, count, desc, eq, gte, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { config } from '../../../config'
import { SessionExpiredError } from '../../../domain/shared/errors'
import { ExerciseId, SessionId, UserId } from '../../../domain/shared/types'
import { useCases } from '../../container'
import { db } from '../../persistence/drizzle/client'
import { attempts, exercises, invitations, kataFeedback, sessions, userBadges, users, variations } from '../../persistence/drizzle/schema'
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
// POST /access-requests (public — no auth required)
// ---------------------------------------------------------------------------

const accessRequestSchema = z.object({
  githubHandle: z.string().min(1).max(100),
  reason: z.string().max(1000).optional(),
})

practiceRoutes.post('/access-requests', async (c) => {
  const body = await c.req.json()
  const parsed = accessRequestSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request' }, 400)

  const { githubHandle, reason } = parsed.data

  // Notify creator via email (no DB storage — privacy first)
  if (config.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(config.RESEND_API_KEY)
      await resend.emails.send({
        from: config.RESEND_FROM_EMAIL,
        to: config.RESEND_FROM_EMAIL.replace(/.*<(.+)>/, '$1'), // extract email from "name <email>"
        subject: `dojo_ access request: ${githubHandle}`,
        html: `
          <div style="font-family: monospace; padding: 20px;">
            <p><strong>GitHub:</strong> ${githubHandle}</p>
            <p><strong>Why:</strong> ${reason || '(not provided)'}</p>
            <p><strong>Profile:</strong> <a href="https://github.com/${githubHandle.replace('@', '')}">github.com/${githubHandle.replace('@', '')}</a></p>
          </div>
        `,
      })
    } catch (err) {
      console.error('Failed to send access request notification:', err)
    }
  }

  return c.json({ ok: true })
})

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
// POST /sessions/:id/retry-evaluation — Re-evaluate when LLM failed
// ---------------------------------------------------------------------------

practiceRoutes.post('/sessions/:id/retry-evaluation', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const sessionId = c.req.param('id')!

  const session = await useCases.getSession.execute(SessionId(sessionId))
  if (!session) return c.json({ error: 'Session not found' }, 404)
  if (session.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)

  // Only allow retry on sessions with unevaluated attempts
  const lastAttempt = session.attempts[session.attempts.length - 1]
  if (!lastAttempt) return c.json({ error: 'No attempt to retry' }, 400)

  const hasEvaluation = lastAttempt.evaluationResult !== null
  if (hasEvaluation) return c.json({ error: 'Session already has evaluation' }, 409)

  // Delete the failed attempt so the WS handler doesn't count it
  await db.delete(attempts).where(eq(attempts.id, lastAttempt.id))

  // Re-queue the attempt for WebSocket evaluation
  const attemptId = crypto.randomUUID()
  pendingAttempts.set(attemptId, { sessionId, userResponse: lastAttempt.userResponse })
  setTimeout(() => pendingAttempts.delete(attemptId), 5 * 60 * 1000)

  // Reset session to active so the WS handler can process it
  if (session.status === 'failed' || session.status === 'completed') {
    await db
      .update(sessions)
      .set({ status: 'active', completedAt: null })
      .where(eq(sessions.id, sessionId))
  }

  return c.json({ attemptId }, 202)
})

// ---------------------------------------------------------------------------
// POST /sessions/:id/feedback — Submit kata feedback
// ---------------------------------------------------------------------------

practiceRoutes.post('/sessions/:id/feedback', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const sessionId = c.req.param('id')!

  // Validate body
  const body = await c.req.json()
  const feedbackSchema = z.object({
    clarity: z.enum(['clear', 'somewhat_unclear', 'confusing']).nullable().default(null),
    timing: z.enum(['too_short', 'about_right', 'too_long']).nullable().default(null),
    evaluation: z.enum(['fair_and_relevant', 'too_generic', 'missed_the_point']).nullable().default(null),
    note: z.string().max(280).nullable().default(null),
  })
  const parsed = feedbackSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid feedback', details: parsed.error.flatten() }, 400)

  // Verify session exists, belongs to user, and is completed
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  })
  if (!session) return c.json({ error: 'Session not found' }, 404)
  if (session.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)
  if (session.status !== 'completed' && session.status !== 'failed') {
    return c.json({ error: 'Session not yet completed' }, 409)
  }

  // Check for existing feedback (UNIQUE constraint will also catch this)
  const existing = await db.query.kataFeedback.findFirst({
    where: eq(kataFeedback.sessionId, sessionId),
  })
  if (existing) return c.json({ error: 'Feedback already submitted' }, 409)

  // Insert feedback
  const { clarity, timing, evaluation, note } = parsed.data
  await db.insert(kataFeedback).values({
    sessionId: session.id,
    exerciseId: session.exerciseId,
    variationId: session.variationId,
    userId: user.id,
    clarity,
    timing,
    evaluation,
    note,
  })

  return c.json({ ok: true }, 201)
})

// ---------------------------------------------------------------------------
// GET /sessions/:id/feedback — Check if feedback exists for a session
// ---------------------------------------------------------------------------

practiceRoutes.get('/sessions/:id/feedback', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const sessionId = c.req.param('id')!

  const feedback = await db.query.kataFeedback.findFirst({
    where: and(eq(kataFeedback.sessionId, sessionId), eq(kataFeedback.userId, user.id)),
  })

  if (!feedback) return c.json({ submitted: false }, 200)
  return c.json({
    submitted: true,
    clarity: feedback.clarity,
    timing: feedback.timing,
    evaluation: feedback.evaluation,
    note: feedback.note,
  }, 200)
})

// ---------------------------------------------------------------------------
// GET /preferences — User reminder preferences
// ---------------------------------------------------------------------------

practiceRoutes.get('/preferences', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const row = await db.query.users.findFirst({ where: eq(users.id, user.id) })
  if (!row) return c.json({ error: 'User not found' }, 404)
  return c.json({
    reminderEnabled: row.reminderEnabled,
    reminderHour: row.reminderHour,
    email: row.email,
  })
})

// ---------------------------------------------------------------------------
// PUT /preferences — Update reminder preferences
// ---------------------------------------------------------------------------

const preferencesSchema = z.object({
  reminderEnabled: z.boolean(),
  reminderHour: z.number().int().min(0).max(23),
  email: z.string().email().optional().nullable(),
})

practiceRoutes.put('/preferences', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const body = await c.req.json()
  const parsed = preferencesSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid preferences' }, 400)

  await db
    .update(users)
    .set({
      reminderEnabled: parsed.data.reminderEnabled,
      reminderHour: parsed.data.reminderHour,
      email: parsed.data.email ?? null,
    })
    .where(eq(users.id, user.id))

  return c.json({ ok: true })
})

// ---------------------------------------------------------------------------
// POST /cron/reminders — Send daily kata reminders (called by cron)
// ---------------------------------------------------------------------------

practiceRoutes.post('/cron/reminders', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (authHeader !== `Bearer ${config.CRON_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentHour = new Date().getUTCHours()

  // Find users who have reminders enabled for this hour and haven't completed today
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const eligibleUsers = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
    })
    .from(users)
    .where(
      and(
        eq(users.reminderEnabled, true),
        eq(users.reminderHour, currentHour),
        sql`${users.email} IS NOT NULL`,
        sql`${users.id} NOT IN (
          SELECT user_id FROM sessions
          WHERE started_at >= ${todayStart}
        )`,
      ),
    )

  if (!config.RESEND_API_KEY || eligibleUsers.length === 0) {
    return c.json({ sent: 0 })
  }

  const { Resend } = await import('resend')
  const resend = new Resend(config.RESEND_API_KEY)
  let sent = 0

  for (const user of eligibleUsers) {
    if (!user.email) continue
    try {
      await resend.emails.send({
        from: config.RESEND_FROM_EMAIL,
        to: user.email,
        subject: 'The dojo is waiting.',
        html: `
          <div style="font-family: 'JetBrains Mono', monospace; background: #0F172A; color: #F8FAFC; padding: 40px; max-width: 480px;">
            <p style="color: #6366F1; font-size: 18px; margin-bottom: 24px;">dojo_</p>
            <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">
              Hey @${user.username}, you haven't done today's kata yet.
            </p>
            <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">
              The streak doesn't build itself.
            </p>
            <a href="${config.WEB_URL}/start" style="display: inline-block; background: #6366F1; color: #F8FAFC; padding: 10px 24px; text-decoration: none; font-size: 14px; margin-top: 16px; border-radius: 2px;">
              Enter the dojo →
            </a>
            <p style="color: #475569; font-size: 11px; margin-top: 32px;">
              <a href="${config.WEB_URL}/dashboard" style="color: #475569;">Unsubscribe from reminders</a>
            </p>
          </div>
        `,
      })
      sent++
    } catch {
      // Silently skip failed sends
    }
  }

  return c.json({ sent })
})

// ---------------------------------------------------------------------------
// GET /dashboard
// ---------------------------------------------------------------------------

practiceRoutes.get('/dashboard', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const userId = user.id

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Active session — exclude expired ones (duration + 10% grace exceeded)
  const activeSessionCandidate = await db.query.sessions.findFirst({
    where: and(eq(sessions.userId, userId), eq(sessions.status, 'active')),
  })

  let activeSession = activeSessionCandidate
  if (activeSessionCandidate) {
    const exercise = await db.query.exercises.findFirst({
      where: eq(exercises.id, activeSessionCandidate.exerciseId),
    })
    if (exercise) {
      const limitMs = exercise.duration * 60 * 1000 * 1.1
      const elapsedMs = Date.now() - activeSessionCandidate.startedAt.getTime()
      if (elapsedMs > limitMs) {
        // Check if session has a final evaluation before marking as failed
        const finalAttempt = await db.query.attempts.findFirst({
          where: and(
            eq(attempts.sessionId, activeSessionCandidate.id),
            eq(attempts.isFinalEvaluation, true),
          ),
        })
        const hasEvaluation = finalAttempt && finalAttempt.llmResponse !== ''
        await db
          .update(sessions)
          .set({ status: hasEvaluation ? 'completed' : 'failed', completedAt: new Date() })
          .where(eq(sessions.id, activeSessionCandidate.id))
        activeSession = undefined
      }
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

  // Today complete: any completed/failed session started today
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayCompleteRow = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.userId, userId),
      sql`${sessions.status} IN ('completed', 'failed')`,
      gte(sessions.startedAt, todayStart),
    ),
  })
  const todayComplete = !!todayCompleteRow

  // Today's completed session (for today card)
  let todaySession: { id: string; exerciseTitle: string; verdict: string | null } | null = null
  if (todayComplete && todayCompleteRow) {
    const todayExercise = await db.query.exercises.findFirst({
      where: eq(exercises.id, todayCompleteRow.exerciseId),
    })
    const [todayAttempt] = await db
      .select({ verdict: sql<string | null>`${attempts.llmResponse}::jsonb->>'verdict'` })
      .from(attempts)
      .where(and(eq(attempts.sessionId, todayCompleteRow.id), eq(attempts.isFinalEvaluation, true)))
      .limit(1)
    todaySession = {
      id: todayCompleteRow.id,
      exerciseTitle: todayExercise?.title ?? '',
      verdict: todayAttempt?.verdict ?? null,
    }
  }

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
    version: exercise.version ?? 1,
    adminNotes: exercise.adminNotes ?? null,
    variations: exercise.variations.map((v) => ({
      id: v.id,
      ownerRole: v.ownerRole,
      ownerContext: v.ownerContext,
    })),
  })
})

// ---------------------------------------------------------------------------
// GET /admin/exercises/:id/feedback — Aggregated feedback for exercise
// ---------------------------------------------------------------------------

adminRoutes.get('/exercises/:id/feedback', async (c) => {
  const exerciseId = c.req.param('id')!

  const feedbackRows = await db
    .select()
    .from(kataFeedback)
    .where(eq(kataFeedback.exerciseId, exerciseId))
    .orderBy(desc(kataFeedback.submittedAt))

  if (feedbackRows.length === 0) {
    return c.json({ total: 0, clarity: {}, timing: {}, evaluation: {}, notes: [], byVariation: {} })
  }

  // Aggregate signals
  const agg = (field: 'clarity' | 'timing' | 'evaluation') => {
    const counts: Record<string, number> = {}
    for (const row of feedbackRows) {
      const val = row[field]
      if (val) counts[val] = (counts[val] ?? 0) + 1
    }
    return counts
  }

  // Group by variation
  const byVariation: Record<string, { total: number; clarity: Record<string, number>; timing: Record<string, number>; evaluation: Record<string, number> }> = {}
  for (const row of feedbackRows) {
    if (!byVariation[row.variationId]) {
      byVariation[row.variationId] = { total: 0, clarity: {}, timing: {}, evaluation: {} }
    }
    const v = byVariation[row.variationId]!
    v.total++
    if (row.clarity) v.clarity[row.clarity] = (v.clarity[row.clarity] ?? 0) + 1
    if (row.timing) v.timing[row.timing] = (v.timing[row.timing] ?? 0) + 1
    if (row.evaluation) v.evaluation[row.evaluation] = (v.evaluation[row.evaluation] ?? 0) + 1
  }

  const notes = feedbackRows
    .filter((r) => r.note)
    .map((r) => ({
      note: r.note!,
      variationId: r.variationId,
      submittedAt: r.submittedAt.toISOString(),
    }))

  return c.json({
    total: feedbackRows.length,
    clarity: agg('clarity'),
    timing: agg('timing'),
    evaluation: agg('evaluation'),
    notes,
    byVariation,
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

const createInvitationSchema = z.object({
  email: z.string().email().optional(),
})

adminRoutes.post('/invitations', async (c) => {
  const user = c.get('user') as { id: string }
  const body = await c.req.json().catch(() => ({}))
  const parsed = createInvitationSchema.safeParse(body)
  const email = parsed.success ? parsed.data.email : undefined

  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days
  const inviteUrl = `${config.WEB_URL}/invite/${token}`

  const [invitation] = await db
    .insert(invitations)
    .values({ token, createdBy: user.id, expiresAt })
    .returning()

  // Send invite email if Resend is configured and email provided
  let emailSent = false
  if (email && config.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(config.RESEND_API_KEY)
      await resend.emails.send({
        from: config.RESEND_FROM_EMAIL,
        to: email,
        subject: 'You\'ve been invited to the dojo',
        html: `
          <div style="font-family: 'JetBrains Mono', monospace; background: #0F172A; color: #F8FAFC; padding: 40px; max-width: 500px;">
            <p style="color: #94A3B8; font-size: 14px;">dojo_</p>
            <h1 style="font-size: 20px; margin: 24px 0;">Someone opened the doors for you.</h1>
            <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">
              You've been invited to the dojo — a daily kata for software engineers
              who want to keep the skill, not just the output.
            </p>
            <a href="${inviteUrl}" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #6366F1; color: #F8FAFC; text-decoration: none; font-size: 14px; border-radius: 2px;">
              Enter the dojo →
            </a>
            <p style="color: #475569; font-size: 12px; margin-top: 32px;">
              This invitation expires in 7 days. No newsletter. No notifications.
            </p>
          </div>
        `,
      })
      emailSent = true
    } catch (err) {
      console.error('Failed to send invite email:', err)
    }
  }

  return c.json({
    id: invitation!.id,
    token: invitation!.token,
    url: inviteUrl,
    expiresAt: invitation!.expiresAt.toISOString(),
    emailSent,
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

// ---------------------------------------------------------------------------
// GET /leaderboard — Consistency-ranked practitioners
// ---------------------------------------------------------------------------

const leaderboardSchema = z.object({
  period: z.enum(['month', 'all-time']).default('month'),
})

practiceRoutes.get('/leaderboard', requireAuth, async (c) => {
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

practiceRoutes.get('/u/:username', async (c) => {
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
      verdict: sql<string | null>`(
        SELECT ${attempts.llmResponse}::jsonb->>'verdict'
        FROM ${attempts}
        WHERE ${attempts.sessionId} = ${sessions.id} AND ${attempts.isFinalEvaluation} = true
        LIMIT 1
      )`,
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
