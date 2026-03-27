import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../../persistence/drizzle/client'
import { kataFeedback, sessions } from '../../persistence/drizzle/schema'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../app-env'

export const feedbackRoutes = new Hono<AppEnv>()

// ---------------------------------------------------------------------------
// POST /sessions/:id/feedback — Submit kata feedback
// ---------------------------------------------------------------------------

feedbackRoutes.post('/sessions/:id/feedback', requireAuth, async (c) => {
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

feedbackRoutes.get('/sessions/:id/feedback', requireAuth, async (c) => {
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
