import { and, desc, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { config } from '../../../config'
import { SessionExpiredError } from '../../../domain/shared/errors'
import { ExerciseId, SessionId, UserId } from '../../../domain/shared/types'
import { useCases } from '../../container'
import { db } from '../../persistence/drizzle/client'
import { attempts, sessions, users } from '../../persistence/drizzle/schema'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../app-env'
import { pendingAttempts } from './pending-attempts'

export const practiceRoutes = new Hono<AppEnv>()

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

  // Timer enforcement — domain method encapsulates 10% grace window
  const exercise = await useCases.getExerciseById.execute(session.exerciseId)
  if (!exercise) return c.json({ error: 'Exercise not found' }, 404)

  if (session.isExpired(exercise.durationMinutes)) {
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
    } catch (err) {
      console.warn(`Failed to send reminder email to user ${user.id}:`, err)
    }
  }

  return c.json({ sent })
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
