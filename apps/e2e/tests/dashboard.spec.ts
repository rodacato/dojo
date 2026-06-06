import { test, expect } from '@playwright/test'

const API_BASE = 'http://localhost:3001'

const MOCK_USER = {
  id: 'user-1',
  username: 'testdev',
  email: 'test@example.com',
  avatarUrl: 'https://example.com/avatar.png',
  role: 'user',
  createdAt: '2025-01-01T00:00:00.000Z',
}

const MOCK_DASHBOARD = {
  streak: 7,
  totalCompleted: 15,
  todayComplete: false,
  todaySession: null,
  activeSessionId: null,
  heatmapData: [],
  recentSessions: [],
  weakAreas: [],
  practicePatterns: {
    avgTimeMinutes: 20,
    mostAvoidedType: null,
    sessionsTimedOut: 0,
  },
  weeklyGoal: { target: 3, completed: 1 },
  belt: {
    rank: 'yellow',
    factors: { completed: 15, distinctClusters: 2, activeDays30: 6, daysAtRank: 8 },
  },
}

test.describe('Dashboard', () => {
  test('shows streak and today kata section for authenticated user', async ({ page }) => {
    // Scope mocks to the API host so they don't intercept the app's own
    // /dashboard frontend route (which shares the same path).
    await page.route(`${API_BASE}/auth/me`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }),
    )
    await page.route(`${API_BASE}/dashboard`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DASHBOARD) }),
    )

    // Set auth token before navigating
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('dojo_token', 'fake-token'))

    await page.goto('/dashboard')

    // StreakCard renders the count + the "Current streak" eyebrow + "days" label
    await expect(page.getByText('Current streak')).toBeVisible()
    await expect(page.getByText('7')).toBeVisible()

    // BeltStrip renders the rank text
    await expect(page.getByText(/yellow belt/i)).toBeVisible()

    // TodayCard surfaces the brand microcopy for an existing user
    await expect(
      page.getByText(/the dojo opens again whether you show up or not/i),
    ).toBeVisible()
  })
})
