import { test, expect } from '@playwright/test'

const API_BASE = 'http://localhost:3001'
const SESSION_ID = 'session-abc-123'

const MOCK_USER = {
  id: 'user-1',
  username: 'testdev',
  email: 'test@example.com',
  avatarUrl: 'https://example.com/avatar.png',
  role: 'user',
  createdAt: '2025-01-01T00:00:00.000Z',
}

// Sensei analysis with the structured insight tags introduced in Sprint 012.
const ANALYSIS_WITH_INSIGHT = `You identified the root cause quickly and your fix was minimal.

<strengths>
- Correctly identified the off-by-one in the slice math
- Chose \`(page - 1) * limit\` rather than patching the symptom
- Preserved the function signature
</strengths>

<improvements>
- Could add a guard for non-positive page values
- Consider what happens when \`limit > items.length\`
</improvements>

<approach_note>
A well-typed \`Pagination\` record type would encode the preconditions at the boundary rather than inside the function.
</approach_note>`

const MOCK_SESSION = {
  id: SESSION_ID,
  body: 'Fix the pagination bug below.',
  status: 'completed',
  startedAt: '2026-04-15T10:00:00.000Z',
  completedAt: '2026-04-15T10:12:00.000Z',
  exercise: {
    id: 'exercise-1',
    title: 'Fix: Off-by-one in pagination',
    type: 'code',
    difficulty: 'easy',
    language: ['typescript'],
    tags: ['pagination', 'debugging'],
  },
  variationId: 'var-1',
  ownerRole: 'Principal Engineer',
  finalAttempt: {
    id: 'attempt-1',
    userResponse: 'const start = (page - 1) * limit',
    verdict: 'passed_with_notes',
    analysis: ANALYSIS_WITH_INSIGHT,
    topicsToReview: ['off-by-one-errors'],
    isFinalEvaluation: true,
    submittedAt: '2026-04-15T10:12:00.000Z',
  },
}

test.describe('Results page — post-kata insight (Sprint 012)', () => {
  test('renders verdict, sensei analysis and strengths/improvements/approach cards', async ({ page }) => {
    await page.route(`${API_BASE}/auth/me`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }),
    )
    await page.route(`${API_BASE}/sessions/${SESSION_ID}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SESSION) }),
    )
    await page.route(`${API_BASE}/sessions/${SESSION_ID}/feedback`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ submitted: false }) }),
    )

    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('dojo_token', 'fake-token'))

    await page.goto(`/kata/${SESSION_ID}/result`)

    // Verdict heading — underscores replaced with spaces
    await expect(
      page.getByRole('heading', { level: 1, name: /passed with notes/i }),
    ).toBeVisible()

    // Insight card headers
    await expect(page.getByText(/^strengths$/i)).toBeVisible()
    await expect(page.getByText(/^improvements$/i)).toBeVisible()
    await expect(page.getByText(/alternative approach/i)).toBeVisible()

    // A specific bullet to ensure the parser extracted list items, not the raw markup
    await expect(
      page.getByRole('listitem').filter({ hasText: /identified the off-by-one/i }),
    ).toBeVisible()
  })
})
