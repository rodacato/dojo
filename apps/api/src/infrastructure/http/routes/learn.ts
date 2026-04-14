import { Hono } from 'hono'
import type { AppEnv } from '../app-env'
import { executionLimiter } from '../middleware/rateLimiter'
import { optionalAuth, requireAuth } from '../middleware/auth'
import { courseRepo, useCases } from '../../container'
import {
  executeStepSchema,
  mergeAnonymousProgressSchema,
  trackProgressSchema,
  courseSlugSchema,
} from '@dojo/shared'
import type { ProgressOwner } from '../../../domain/learning/ports'

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
