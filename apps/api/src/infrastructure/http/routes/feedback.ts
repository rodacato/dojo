import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../../persistence/drizzle/client'
import { kataFeedback, sessions } from '../../persistence/drizzle/schema'
import { saveKataFeedback } from '../../persistence/kata-feedback'
import { requireAuth } from '../middleware/auth'
import { uuidParam } from '../middleware/uuidParam'
import type { AppEnv } from '../app-env'

export const feedbackRoutes = new Hono<AppEnv>()

// ---------------------------------------------------------------------------
// POST /sessions/:id/feedback — Save kata feedback, one vote at a time (D62)
// ---------------------------------------------------------------------------

feedbackRoutes.post('/sessions/:id/feedback', requireAuth, uuidParam('id', { error: 'Session not found' }), async (c) => {
  const user = c.get('user') as { id: string }
  const sessionId = c.req.param('id')!

  // Validate body
  const body = await c.req.json()
  const feedbackSchema = z.object({
    clarity: z.enum(['clear', 'somewhat_unclear', 'confusing']).nullable().optional(),
    timing: z.enum(['too_short', 'about_right', 'too_long']).nullable().optional(),
    evaluation: z.enum(['fair_and_relevant', 'too_generic', 'missed_the_point']).nullable().optional(),
    note: z.string().max(280).nullable().optional(),
  })
  const parsed = feedbackSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid feedback', details: z.flattenError(parsed.error) }, 400)

  // Verify session exists, belongs to user, and is completed
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  })
  if (!session) return c.json({ error: 'Session not found' }, 404)
  if (session.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)
  if (session.status !== 'completed' && session.status !== 'failed') {
    return c.json({ error: 'Session not yet completed' }, 409)
  }

  await saveKataFeedback(
    db,
    { sessionId: session.id, kataId: session.kataId, variationId: session.variationId, userId: user.id },
    parsed.data,
  )

  return c.json({ ok: true }, 200)
})

// ---------------------------------------------------------------------------
// GET /sessions/:id/feedback — Check if feedback exists for a session
// ---------------------------------------------------------------------------

feedbackRoutes.get('/sessions/:id/feedback', requireAuth, uuidParam('id', { error: 'Session not found' }), async (c) => {
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
