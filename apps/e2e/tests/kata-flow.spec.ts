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
  streak: 3,
  totalCompleted: 5,
  todayComplete: false,
  todaySession: null,
  activeSessionId: null,
  heatmapData: [],
  recentSessions: [],
  weakAreas: [],
  practicePatterns: {
    avgTimeMinutes: 15,
    mostAvoidedType: null,
    sessionsTimedOut: 0,
  },
  senseiSuggests: [],
  weeklyGoal: { target: 3, completed: 1 },
}

const MOCK_PREFERENCES = {
  reminderEnabled: false,
  reminderHour: 9,
  email: null,
  level: 'mid',
  interests: [],
  randomness: 0.3,
}

test.describe('Kata flow (Day Start page)', () => {
  test('select mood and duration, then "Show my kata" becomes enabled', async ({ page }) => {
    await page.route(`${API_BASE}/auth/me`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }),
    )
    await page.route(`${API_BASE}/dashboard`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DASHBOARD) }),
    )
    await page.route(`${API_BASE}/preferences`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PREFERENCES) }),
    )

    // Set auth token before navigating
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('dojo_token', 'fake-token'))

    await page.goto('/start')

    // Mood buttons should be visible
    await expect(page.getByRole('button', { name: /on a roll/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /just okay/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /half here/i })).toBeVisible()

    // "Show my kata" button should be disabled initially
    const submitButton = page.getByRole('button', { name: /show my kata/i })
    await expect(submitButton).toBeDisabled()

    // Click a mood
    await page.getByRole('button', { name: /on a roll/i }).click()

    // Click a duration
    await page.getByRole('button', { name: '20 min' }).click()

    // "Show my kata" button should now be enabled
    await expect(submitButton).toBeEnabled()
  })
})
