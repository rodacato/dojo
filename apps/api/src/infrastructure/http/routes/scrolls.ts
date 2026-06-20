import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../app-env'
import { executionLimiter, nudgeLimiter } from '../middleware/rateLimiter'
import { optionalAuth, requireAuth } from '../middleware/auth'
import { scrollRepo, useCases } from '../../container'
import { config } from '../../../config'
import { db } from '../../persistence/drizzle/client'
import { steps as stepsTable } from '../../persistence/drizzle/schema'
import {
  executeStepSchema,
  mergeAnonymousProgressSchema,
  trackProgressSchema,
  scrollSlugSchema,
} from '@dojo/shared'
import type { ProgressOwner } from '../../../domain/learning/ports'
import { StepNotFoundError } from '../../../application/learning/GenerateNudge'

// Languages permitted for anonymous (unauthenticated) code execution.
// Authenticated users may execute any supported runtime. ruby + rust joined
// when their scrolls went public (S029) so logged-out visitors can run the
// katas, matching python/typescript. All run in the sandboxed, rate-limited
// Piston; the incremental surface over the already-allowed python is ~nil.
const PUBLIC_LANGUAGE_WHITELIST = new Set(['sql', 'typescript', 'python', 'javascript-dom', 'ruby', 'rust', 'go'])

export const scrollRoutes = new Hono<AppEnv>()

// ── Scroll discovery ────────────────────────────────────────────────

scrollRoutes.get('/scrolls', optionalAuth, async (c) => {
  // The catalog is the same for anon and authed users — published AND public.
  // /admin/scrolls is the only path to drafts and private scrolls; mixing
  // them into /scrolls based on auth state (the prior behavior) leaked
  // private scrolls into authed users' catalog views inconsistently.
  const scrolls = await useCases.getScrollList.execute({ publicOnly: true })
  return c.json({ scrolls })
})

// Batch progress for the catalog — one round-trip, a completed-step count per
// scroll the caller has touched. Registered before /scrolls/:slug so the static
// path is never shadowed by the slug param. ScrollDTO stays pure Content; the
// catalog derives binary state client-side. Anonymous callers pass
// ?anonymousSessionId; a fresh anon (no session) legitimately has no progress.
scrollRoutes.get('/scrolls/progress', optionalAuth, async (c) => {
  const user = c.get('user')
  let owner: ProgressOwner
  if (user) {
    owner = { kind: 'user', userId: user.id }
  } else {
    const anonymousSessionId = c.req.query('anonymousSessionId')
    if (!anonymousSessionId) {
      return c.json({ progress: [] })
    }
    owner = { kind: 'anonymous', sessionId: anonymousSessionId }
  }

  const progress = await useCases.getAllScrollProgress.execute(owner)
  return c.json({ progress })
})

scrollRoutes.get('/scrolls/:slug', optionalAuth, async (c) => {
  const parsed = scrollSlugSchema.safeParse({ slug: c.req.param('slug') })
  if (!parsed.success) {
    return c.json({ error: 'Invalid slug' }, 422)
  }

  const scroll = await useCases.getScrollBySlug.execute(parsed.data.slug)
  if (!scroll) {
    return c.json({ error: 'Scroll not found' }, 404)
  }

  const user = c.get('user')
  if (!scroll.isPublic && !user) {
    return c.json({ error: 'Scroll not found' }, 404)
  }

  const lessonCount = scroll.lessons.length
  const stepCount = scroll.lessons.reduce((sum, l) => sum + l.steps.length, 0)

  return c.json({
    scroll: {
      id: scroll.id,
      slug: scroll.slug,
      title: scroll.title,
      description: scroll.description,
      language: scroll.language,
      accentColor: scroll.accentColor,
      status: scroll.status,
      isPublic: scroll.isPublic,
      estimatedMinutes: scroll.estimatedMinutes,
      externalReferences: scroll.externalReferences,
      lessonCount,
      stepCount,
      lessons: scroll.lessons.map((l) => ({
        id: l.id,
        order: l.order,
        title: l.title,
        outcome: l.outcome,
        steps: l.steps.map((s) => ({
          id: s.id,
          order: s.order,
          type: s.type,
          title: s.title,
          instruction: s.instruction,
          starterCode: s.starterCode,
          testCode: s.testCode,
          hint: s.hint,
          hints: s.hints ?? null,
          data: s.data,
        })),
      })),
    },
  })
})

// ── Code execution ──────────────────────────────────────────────────

// Rate limited per IP (10/min). Anonymous callers are restricted to a
// language whitelist to shrink the attack surface.
scrollRoutes.post('/scrolls/execute', optionalAuth, executionLimiter, async (c) => {
  const body = await c.req.json()
  const parsed = executeStepSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 422)
  }

  const user = c.get('user')
  if (!user && !PUBLIC_LANGUAGE_WHITELIST.has(parsed.data.language)) {
    return c.json({ error: 'Language requires authentication' }, 401)
  }

  const result = await useCases.executeStep.execute(parsed.data)
  return c.json(result)
})

// ── Progress tracking ───────────────────────────────────────────────

type ResolveResult = ProgressOwner | { error: string; status: 401 | 404 }

async function resolveProgressOwner(
  userId: string | null,
  anonymousSessionIdFromBody: string | undefined,
  scrollId: string,
): Promise<ResolveResult> {
  if (userId) {
    return { kind: 'user', userId }
  }

  const scroll = await scrollRepo.findById(scrollId)
  if (!scroll) {
    return { error: 'Scroll not found', status: 404 }
  }
  if (!scroll.isPublic) {
    return { error: 'Authentication required', status: 401 }
  }
  if (!anonymousSessionIdFromBody) {
    return { error: 'anonymousSessionId required', status: 401 }
  }
  return { kind: 'anonymous', sessionId: anonymousSessionIdFromBody }
}

scrollRoutes.post('/scrolls/progress', optionalAuth, async (c) => {
  const body = await c.req.json()
  const parsed = trackProgressSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 422)
  }

  const user = c.get('user')
  const owner = await resolveProgressOwner(
    user?.id ?? null,
    parsed.data.anonymousSessionId,
    parsed.data.scrollId,
  )
  if ('error' in owner) {
    return c.json({ error: owner.error }, owner.status)
  }

  await useCases.trackProgress.execute({
    owner,
    scrollId: parsed.data.scrollId,
    stepId: parsed.data.stepId,
  })
  return c.json({ ok: true })
})

scrollRoutes.get('/scrolls/progress/:scrollId', optionalAuth, async (c) => {
  const scrollId = c.req.param('scrollId') as string
  const anonymousSessionId = c.req.query('anonymousSessionId')

  const user = c.get('user')
  const owner = await resolveProgressOwner(user?.id ?? null, anonymousSessionId, scrollId)
  if ('error' in owner) {
    return c.json({ error: owner.error }, owner.status)
  }

  const completedSteps = await useCases.getScrollProgress.execute(owner, scrollId)
  return c.json({ completedSteps })
})

scrollRoutes.post('/scrolls/progress/merge', requireAuth, async (c) => {
  const body = await c.req.json()
  const parsed = mergeAnonymousProgressSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 422)
  }

  const user = c.get('user')
  await useCases.mergeAnonymousProgress.execute({
    userId: user.id,
    anonymousSessionId: parsed.data.anonymousSessionId,
  })
  return c.json({ ok: true })
})

// ── Reference solution (post-pass) ──────────────────────────────────
//
// GET /scrolls/:slug/steps/:stepId/solution
//   ?anonymousSessionId=<uuid>   (only used when no Bearer is present)
//
// Returns 403 until the caller has the step in their completedSteps for
// this scroll. Never returns the solution to a learner who hasn't passed.
// Reads from the steps table directly to avoid leaking solution into the
// scroll-list DTO surface (where it must NEVER appear).
scrollRoutes.get('/scrolls/:slug/steps/:stepId/solution', optionalAuth, async (c) => {
  const slug = c.req.param('slug') as string
  const stepId = c.req.param('stepId') as string
  const anonymousSessionId = c.req.query('anonymousSessionId')

  const slugCheck = scrollSlugSchema.safeParse({ slug })
  if (!slugCheck.success) return c.json({ error: 'Invalid slug' }, 422)

  const scroll = await useCases.getScrollBySlug.execute(slug)
  if (!scroll) return c.json({ error: 'Scroll not found' }, 404)

  const user = c.get('user')
  if (!scroll.isPublic && !user) {
    return c.json({ error: 'Scroll not found' }, 404)
  }

  // Make sure the step is actually part of this scroll before authorising.
  const stepBelongsToScroll = scroll.lessons.some((l) =>
    l.steps.some((s) => s.id === stepId),
  )
  if (!stepBelongsToScroll) {
    return c.json({ error: 'Step not found' }, 404)
  }

  const owner = await resolveProgressOwner(user?.id ?? null, anonymousSessionId, scroll.id)
  if ('error' in owner) {
    return c.json({ error: owner.error }, owner.status)
  }

  const completed = await useCases.getScrollProgress.execute(owner, scroll.id)
  if (!completed.includes(stepId)) {
    return c.json({ error: 'Solution available after passing this step' }, 403)
  }

  const row = await db.query.steps.findFirst({ where: eq(stepsTable.id, stepId) })
  return c.json({
    solution: row?.solution ?? null,
    alternativeApproach: row?.alternativeApproach ?? null,
  })
})

// ── Ask the sensei — scroll-player nudge ───────────────────────────
//
// POST /scrolls/nudge
//   { scrollSlug, stepId, userCode, stdout?, stderr? }
//
// Gated by FF_COURSE_NUDGE_ENABLED so the feature can be killed without a
// redeploy if prompt quality regresses. Auth-optional — public scrolls
// should not punish anonymous learners for asking. Rate-limited by IP.

const nudgeRequestSchema = z.object({
  scrollSlug: z.string().min(1).max(100),
  stepId: z.string().uuid(),
  userCode: z.string().max(8_000),
  stdout: z.string().max(4_000).optional(),
  stderr: z.string().max(4_000).optional(),
})

scrollRoutes.post('/scrolls/nudge', nudgeLimiter, optionalAuth, async (c) => {
  if (!config.FF_COURSE_NUDGE_ENABLED) {
    return c.json({ error: 'Nudges are not enabled.' }, 404)
  }

  const body = await c.req.json().catch(() => null)
  const parsed = nudgeRequestSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 422)
  }

  const user = c.get('user')

  try {
    const result = await useCases.generateNudge.execute({
      ...parsed.data,
      userId: user?.id ?? null,
    })
    return c.json(result)
  } catch (err) {
    if (err instanceof StepNotFoundError) {
      return c.json({ error: err.message }, 404)
    }
    throw err
  }
})

// POST /scrolls/nudge/:id/feedback — thumbs up / down for prompt iteration.
const nudgeFeedbackSchema = z.object({
  feedback: z.enum(['up', 'down']),
})

scrollRoutes.post('/scrolls/nudge/:id/feedback', nudgeLimiter, optionalAuth, async (c) => {
  const id = c.req.param('id')
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return c.json({ error: 'Invalid nudge id' }, 422)
  }

  const body = await c.req.json().catch(() => null)
  const parsed = nudgeFeedbackSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 422)
  }

  await useCases.submitNudgeFeedback.execute({ id, feedback: parsed.data.feedback })
  return c.json({ ok: true })
})
