import { test, expect } from '@playwright/test'

const API_BASE = 'http://localhost:3001'

const SQL_COURSE_SUMMARY = {
  id: 'course-sql-1',
  slug: 'sql-deep-cuts',
  title: 'SQL Deep Cuts',
  description: 'The queries nobody taught you. Window functions, CTEs, and real-world analysis patterns.',
  language: 'sql',
  accentColor: '#336791',
  isPublic: true,
  lessonCount: 3,
  stepCount: 9,
}

const SQL_COURSE_DETAIL = {
  id: 'course-sql-1',
  slug: 'sql-deep-cuts',
  title: 'SQL Deep Cuts',
  description: 'The queries nobody taught you.',
  language: 'sql',
  accentColor: '#336791',
  status: 'published',
  isPublic: true,
  lessonCount: 3,
  stepCount: 3,
  lessons: [
    {
      id: 'lesson-1',
      order: 1,
      title: 'Window Functions',
      steps: [
        {
          id: 'step-1-1',
          order: 1,
          type: 'read',
          instruction: '# Beyond GROUP BY\n\nA window function computes a value across rows without collapsing them.',
          starterCode: null,
          testCode: null,
          hint: null,
        },
        {
          id: 'step-1-2',
          order: 2,
          type: 'challenge',
          instruction: '# Rank employees\n\nWrite a query that ranks employees within their department.',
          starterCode: 'SELECT employee_name FROM employees',
          testCode: '-- tests',
          hint: null,
        },
      ],
    },
  ],
}

test.describe('Public courses (anonymous)', () => {
  test('anonymous visitor sees SQL Deep Cuts in the catalog with Public badge', async ({ page }) => {
    await page.route(`${API_BASE}/learn/courses`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ courses: [SQL_COURSE_SUMMARY] }),
      }),
    )

    await page.goto('/learn')

    await expect(page.getByRole('heading', { level: 2, name: 'SQL Deep Cuts' })).toBeVisible()
    await expect(page.getByText(/public/i).first()).toBeVisible()
    await expect(page.getByText(/3 lessons/)).toBeVisible()
  })

  test('course player renders a read step without the code editor', async ({ page }) => {
    await page.route(`${API_BASE}/learn/courses/sql-deep-cuts`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ course: SQL_COURSE_DETAIL }),
      }),
    )
    // GetProgress with anonymousSessionId query — empty response
    await page.route(`${API_BASE}/learn/progress/*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ completedSteps: [] }),
      }),
    )

    await page.goto('/learn/sql-deep-cuts')

    // The read step's markdown header should render
    await expect(page.getByRole('heading', { name: 'Beyond GROUP BY' })).toBeVisible()

    // The Continue button is the primary CTA for read steps (no Run button)
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^\s*▶\s*run\s*$/i })).toHaveCount(0)
  })

  test('private course returns 404 for anonymous visitor (Sprint 017 invariant)', async ({ page }) => {
    await page.route(`${API_BASE}/learn/courses/typescript-fundamentals`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Course not found' }),
      }),
    )

    await page.goto('/learn/typescript-fundamentals')

    // CoursePlayerPage surfaces a "Course not found" state with a back link
    await expect(page.getByText(/course not found/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /back to courses/i })).toBeVisible()
  })

  test('anonymous session id is persisted to localStorage on public course', async ({ page }) => {
    await page.route(`${API_BASE}/learn/courses/sql-deep-cuts`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ course: SQL_COURSE_DETAIL }),
      }),
    )
    await page.route(`${API_BASE}/learn/progress/*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ completedSteps: [] }),
      }),
    )

    await page.goto('/learn/sql-deep-cuts')

    // Wait for the course to load so the anonymous-id effect has run
    await expect(page.getByRole('heading', { name: 'Beyond GROUP BY' })).toBeVisible()

    const anonId = await page.evaluate(() => localStorage.getItem('dojo-anon-id'))
    expect(anonId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })
})
