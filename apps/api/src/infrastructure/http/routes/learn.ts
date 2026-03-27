import { Hono } from 'hono'
import type { AppEnv } from '../app-env'
import { executionLimiter } from '../middleware/rateLimiter'
import { requireAuth } from '../middleware/auth'
import { useCases } from '../../container'
import { executeStepSchema, trackProgressSchema, courseSlugSchema } from '@dojo/shared'

export const learnRoutes = new Hono<AppEnv>()

// ── Public routes — no auth required ────────────────────────────────

learnRoutes.get('/learn/courses', async (c) => {
  const courses = await useCases.getCourseList.execute()
  return c.json({ courses })
})

learnRoutes.get('/learn/courses/:slug', async (c) => {
  const parsed = courseSlugSchema.safeParse({ slug: c.req.param('slug') })
  if (!parsed.success) {
    return c.json({ error: 'Invalid slug' }, 422)
  }

  const course = await useCases.getCourseBySlug.execute(parsed.data.slug)
  if (!course) {
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

// Code execution for courses — rate limited per IP (10/min anonymous)
learnRoutes.post('/learn/execute', executionLimiter, async (c) => {
  const body = await c.req.json()
  const parsed = executeStepSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 422)
  }

  const result = await useCases.executeStep.execute(parsed.data)
  return c.json(result)
})

// ── Authenticated routes — progress tracking ────────────────────────

learnRoutes.post('/learn/progress', requireAuth, async (c) => {
  const body = await c.req.json()
  const parsed = trackProgressSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 422)
  }

  const user = c.get('user')
  await useCases.trackProgress.execute({
    userId: user.id,
    courseId: parsed.data.courseId,
    stepId: parsed.data.stepId,
  })
  return c.json({ ok: true })
})

learnRoutes.get('/learn/progress/:courseId', requireAuth, async (c) => {
  const courseId = c.req.param('courseId') as string
  const user = c.get('user')

  const completedSteps = await useCases.getCourseProgress.execute(user.id, courseId)
  return c.json({ completedSteps })
})
