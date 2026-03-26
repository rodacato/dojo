import { test, expect } from '@playwright/test'

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
  senseiSuggests: [],
}

test.describe('Dashboard', () => {
  test('shows streak and today kata section for authenticated user', async ({ page }) => {
    // Mock API responses
    await page.route('**/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }),
    )
    await page.route('**/dashboard', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DASHBOARD) }),
    )

    // Set auth token before navigating
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('dojo_token', 'fake-token'))

    await page.goto('/dashboard')

    // Streak number should be visible
    await expect(page.getByText('7')).toBeVisible()

    // "day streak" label should be present
    await expect(page.getByText('day streak')).toBeVisible()

    // Today's kata section (TodayCard) should exist
    await expect(page.getByText(/active_streak/i)).toBeVisible()
  })
})
