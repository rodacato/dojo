import { desc, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { config } from '../../../config'
import { ExerciseId, UserId } from '../../../domain/shared/types'
import { useCases } from '../../container'
import { db } from '../../persistence/drizzle/client'
import { attempts, exercises, invitations, kataFeedback, sessions, users, variations } from '../../persistence/drizzle/schema'
import { requireAuth, requireCreator } from '../middleware/auth'
import type { AppEnv } from '../app-env'
import type { Difficulty, ExerciseType } from '../../../domain/content/values'

export const adminRoutes = new Hono<AppEnv>()

// Apply requireCreator to all admin routes
adminRoutes.use('*', requireAuth, requireCreator)

// ---------------------------------------------------------------------------
// GET /exercises
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

// ---------------------------------------------------------------------------
// GET /exercises/:id
// ---------------------------------------------------------------------------

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
// GET /exercises/:id/feedback — Aggregated feedback for exercise
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

// ---------------------------------------------------------------------------
// PUT /exercises/:id
// ---------------------------------------------------------------------------

const updateExerciseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  duration: z.number().int().positive(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  type: z.enum(['code', 'chat', 'whiteboard']),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  languages: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  adminNotes: z.string().nullable().optional(),
  variations: z
    .array(z.object({ ownerRole: z.string().min(1), ownerContext: z.string().min(1) }))
    .min(1),
})

adminRoutes.put('/exercises/:id', async (c) => {
  const exerciseId = c.req.param('id')!
  const body = await c.req.json()
  const parsed = updateExerciseSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request body' }, 400)

  const { title, description, duration, difficulty, type, languages, tags, topics, status, adminNotes } = parsed.data

  // Update exercise fields + increment version
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
      ...(status ? { status } : {}),
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      version: sql`${exercises.version} + 1`,
      updatedAt: new Date(),
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

// ---------------------------------------------------------------------------
// POST /exercises/:id/archive — Archive an exercise
// ---------------------------------------------------------------------------

adminRoutes.post('/exercises/:id/archive', async (c) => {
  const exerciseId = c.req.param('id')!
  await db
    .update(exercises)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(exercises.id, exerciseId))
  return c.json({ ok: true })
})

// ---------------------------------------------------------------------------
// POST /exercises — Create a new exercise
// ---------------------------------------------------------------------------

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
// Invitations
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
            <p style="color: #64748B; font-size: 12px; margin-top: 32px;">
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
