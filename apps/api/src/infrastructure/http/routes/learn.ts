import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../app-env'
import { executionLimiter, nudgeLimiter } from '../middleware/rateLimiter'
import { optionalAuth, requireAuth } from '../middleware/auth'
import { courseRepo, useCases } from '../../container'
import { config } from '../../../config'
import { db } from '../../persistence/drizzle/client'
import { steps as stepsTable } from '../../persistence/drizzle/schema'
import {
  executeStepSchema,
  mergeAnonymousProgressSchema,
  trackProgressSchema,
  courseSlugSchema,
} from '@dojo/shared'
import type { ProgressOwner } from '../../../domain/learning/ports'
import { StepNotFoundError } from '../../../application/learning/GenerateNudge'

// Languages permitted for anonymous (unauthenticated) code execution.
// Authenticated users may execute any supported runtime.
const PUBLIC_LANGUAGE_WHITELIST = new Set(['sql', 'typescript', 'python', 'javascript-dom'])

export const learnRoutes = new Hono<AppEnv>()

// ── Course discovery ────────────────────────────────────────────────

learnRoutes.get('/learn/courses', optionalAuth, async (c) => {
  const user = c.get('user')
  const courses = await useCases.getCourseList.execute({ publicOnly: !user })
  return c.json({ courses })
})

learnRoutes.get('/learn/courses/:slug', optionalAuth, async (c) => {
  const parsed = courseSlugSchema.safeParse({ slug: c.req.param('slug') })
  if (!parsed.success) {
    return c.json({ error: 'Invalid slug' }, 422)
  }

  const course = await useCases.getCourseBySlug.execute(parsed.data.slug)
  if (!course) {
    return c.json({ error: 'Course not found' }, 404)
  }

  const user = c.get('user')
  if (!course.isPublic && !user) {
    return c.json({ error: 'Course not found' }, 404)
  }

  const lessonCount = course.lessons.length
  const stepCount = course.lessons.reduce((sum, l) => sum + l.steps.length, 0)

  return c.json({
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      language: course.language,
      accentColor: course.accentColor,
      status: course.status,
      isPublic: course.isPublic,
      externalReferences: course.externalReferences,
      lessonCount,
      stepCount,
      lessons: course.lessons.map((l) => ({
        id: l.id,
        order: l.order,
        title: l.title,
        steps: l.steps.map((s) => ({
          id: s.id,
          order: s.order,
          type: s.type,
          title: s.title,
          instruction: s.instruction,
          starterCode: s.starterCode,
          testCode: s.testCode,
          hint: s.hint,
        })),
      })),
    },
  })
})

// ── Code execution ──────────────────────────────────────────────────

// Rate limited per IP (10/min). Anonymous callers are restricted to a
// language whitelist to shrink the attack surface.
learnRoutes.post('/learn/execute', optionalAuth, executionLimiter, async (c) => {
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
  courseId: string,
): Promise<ResolveResult> {
  if (userId) {
    return { kind: 'user', userId }
  }

  const course = await courseRepo.findById(courseId)
  if (!course) {
    return { error: 'Course not found', status: 404 }
  }
  if (!course.isPublic) {
    return { error: 'Authentication required', status: 401 }
  }
  if (!anonymousSessionIdFromBody) {
    return { error: 'anonymousSessionId required', status: 401 }
  }
  return { kind: 'anonymous', sessionId: anonymousSessionIdFromBody }
}

learnRoutes.post('/learn/progress', optionalAuth, async (c) => {
  const body = await c.req.json()
  const parsed = trackProgressSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 422)
  }

  const user = c.get('user')
  const owner = await resolveProgressOwner(
    user?.id ?? null,
    parsed.data.anonymousSessionId,
    parsed.data.courseId,
  )
  if ('error' in owner) {
    return c.json({ error: owner.error }, owner.status)
  }

  await useCases.trackProgress.execute({
    owner,
    courseId: parsed.data.courseId,
    stepId: parsed.data.stepId,
  })
  return c.json({ ok: true })
})

learnRoutes.get('/learn/progress/:courseId', optionalAuth, async (c) => {
  const courseId = c.req.param('courseId') as string
  const anonymousSessionId = c.req.query('anonymousSessionId')

  const user = c.get('user')
  const owner = await resolveProgressOwner(user?.id ?? null, anonymousSessionId, courseId)
  if ('error' in owner) {
    return c.json({ error: owner.error }, owner.status)
  }

  const completedSteps = await useCases.getCourseProgress.execute(owner, courseId)
  return c.json({ completedSteps })
})

learnRoutes.post('/learn/progress/merge', requireAuth, async (c) => {
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
// GET /learn/courses/:slug/steps/:stepId/solution
//   ?anonymousSessionId=<uuid>   (only used when no Bearer is present)
//
// Returns 403 until the caller has the step in their completedSteps for
// this course. Never returns the solution to a learner who hasn't passed.
// Reads from the steps table directly to avoid leaking solution into the
// course-list DTO surface (where it must NEVER appear).
learnRoutes.get('/learn/courses/:slug/steps/:stepId/solution', optionalAuth, async (c) => {
  const slug = c.req.param('slug') as string
  const stepId = c.req.param('stepId') as string
  const anonymousSessionId = c.req.query('anonymousSessionId')

  const slugCheck = courseSlugSchema.safeParse({ slug })
  if (!slugCheck.success) return c.json({ error: 'Invalid slug' }, 422)

  const course = await useCases.getCourseBySlug.execute(slug)
  if (!course) return c.json({ error: 'Course not found' }, 404)

  const user = c.get('user')
  if (!course.isPublic && !user) {
    return c.json({ error: 'Course not found' }, 404)
  }

  // Make sure the step is actually part of this course before authorising.
  const stepBelongsToCourse = course.lessons.some((l) =>
    l.steps.some((s) => s.id === stepId),
  )
  if (!stepBelongsToCourse) {
    return c.json({ error: 'Step not found' }, 404)
  }

  const owner = await resolveProgressOwner(user?.id ?? null, anonymousSessionId, course.id)
  if ('error' in owner) {
    return c.json({ error: owner.error }, owner.status)
  }

  const completed = await useCases.getCourseProgress.execute(owner, course.id)
  if (!completed.includes(stepId)) {
    return c.json({ error: 'Solution available after passing this step' }, 403)
  }

  const row = await db.query.steps.findFirst({ where: eq(stepsTable.id, stepId) })
  return c.json({
    solution: row?.solution ?? null,
    alternativeApproach: row?.alternativeApproach ?? null,
  })
})

// ── Ask the sensei — course-player nudge ───────────────────────────
//
// POST /learn/nudge
//   { courseSlug, stepId, userCode, stdout?, stderr? }
//
// Gated by COURSE_NUDGE_ENABLED so the feature can be killed without a
// redeploy if prompt quality regresses. Auth-optional — public courses
// should not punish anonymous learners for asking. Rate-limited by IP.

const nudgeRequestSchema = z.object({
  courseSlug: z.string().min(1).max(100),
  stepId: z.string().uuid(),
  userCode: z.string().max(8_000),
  stdout: z.string().max(4_000).optional(),
  stderr: z.string().max(4_000).optional(),
})

learnRoutes.post('/learn/nudge', nudgeLimiter, optionalAuth, async (c) => {
  if (!config.COURSE_NUDGE_ENABLED) {
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

// POST /learn/nudge/:id/feedback — thumbs up / down for prompt iteration.
const nudgeFeedbackSchema = z.object({
  feedback: z.enum(['up', 'down']),
})

learnRoutes.post('/learn/nudge/:id/feedback', nudgeLimiter, optionalAuth, async (c) => {
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
