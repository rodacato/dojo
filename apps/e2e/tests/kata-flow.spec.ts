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
  dailyKataMinutes: null,
  heatmapData: [],
  recentSessions: [],
  weakAreas: [],
  practicePatterns: {
    avgTimeMinutes: 15,
    mostAvoidedType: null,
    sessionsTimedOut: 0,
  },
  weeklyGoal: { target: 3, completed: 1 },
  belt: {
    rank: 'white',
    factors: { completed: 5, distinctClusters: 1, activeDays30: 3, daysAtRank: 2 },
  },
}

const MOCK_PREFERENCES = {
  reminderEnabled: false,
  reminderHour: 9,
  email: null,
  level: 'mid',
  interests: [],
  randomness: 0.3,
  goalWeeklyTarget: 3,
}

test.describe('Kata flow (Advanced page)', () => {
  test('Start waits for a duration; type and language default to Any', async ({ page }) => {
    await page.route(`${API_BASE}/auth/me`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }),
    )
    await page.route(`${API_BASE}/dashboard`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DASHBOARD) }),
    )
    await page.route(`${API_BASE}/preferences`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PREFERENCES) }),
    )

    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('dojo_token', 'fake-token'))
    await page.goto('/katas')

    const start = page.getByRole('button', { name: /start/i })
    await expect(start).toBeDisabled()
    await expect(page.getByRole('group', { name: 'Type' }).getByRole('button', { name: 'Any' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'Any' })).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('group', { name: 'How long?' }).getByRole('button', { name: '20m' }).click()
    await expect(start).toBeEnabled()
  })
})
