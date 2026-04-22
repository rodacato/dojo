import { test, expect } from '@playwright/test'

// Course-step execution smoke — exercises the full Piston pipeline
// against a real public course and its first step. Anonymous (no auth),
// read-the-course then execute. Validates the execution pipeline, not
// a specific pass/fail outcome — starter code in a first step is
// allowed to fail its tests; what matters is that the runtime
// responded with a structured result.
//
// Guards: Piston outages, API/Piston wiring, deploy-time regressions
// in /learn/execute, language whitelist drift.

const API_URL = process.env['SMOKE_API_URL']!

interface CourseSummary {
  slug: string
  language: string
  isPublic: boolean
}

interface StepDetail {
  id: string
  starterCode: string
  testCode: string
}

interface CourseDetail {
  slug: string
  language: string
  lessons: { steps: StepDetail[] }[]
}

interface ExecutionResult {
  stdout: string
  stderr: string
  exitCode: number
  timedOut: boolean
  executionTimeMs: number
}

test.describe('smoke: complete course step', () => {
  test('first public step executes end-to-end through Piston', async ({ request }) => {
    // Preflight — Piston health check. If Piston is down this test's
    // failure is otherwise indistinguishable from an app bug.
    const pistonHealth = await request.get(`${API_URL}/health/piston`)
    expect(pistonHealth.status(), '/health/piston should return 2xx').toBeLessThan(300)

    // Pick a public course we can reach without auth.
    const coursesRes = await request.get(`${API_URL}/learn/courses`)
    expect(coursesRes.status(), 'GET /learn/courses should return 200').toBe(200)
    const courses = (await coursesRes.json()) as CourseSummary[]
    const publicCourse = courses.find((c) => c.isPublic)
    expect(publicCourse, 'at least one public course should exist').toBeTruthy()

    // Fetch the course detail to extract the first step's starter + test code.
    const courseRes = await request.get(`${API_URL}/learn/courses/${publicCourse!.slug}`)
    expect(courseRes.status()).toBe(200)
    const course = (await courseRes.json()) as CourseDetail
    const firstStep = course.lessons[0]?.steps[0]
    expect(firstStep, 'first course lesson should have at least one step').toBeTruthy()

    // Execute the first step with its starter code. We do NOT assert
    // exitCode=0 — first-step starters often intentionally fail until
    // the learner writes the fix. We assert the pipeline ran at all.
    const execRes = await request.post(`${API_URL}/learn/execute`, {
      data: {
        language: course.language,
        code: firstStep!.starterCode,
        testCode: firstStep!.testCode,
      },
    })
    expect(execRes.status(), 'POST /learn/execute should return 200').toBe(200)
    const result = (await execRes.json()) as ExecutionResult

    expect(result).toHaveProperty('stdout')
    expect(result).toHaveProperty('stderr')
    expect(result).toHaveProperty('exitCode')
    expect(result).toHaveProperty('executionTimeMs')
    expect(result.timedOut, 'execution must not time out on a first-step starter').toBe(false)
    // Realistic upper bound — if a trivial starter takes >5s, Piston is
    // degraded even if it technically returned.
    expect(result.executionTimeMs).toBeLessThan(5_000)
  })
})
