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

const MOCK_KATAS = ['Off-by-one in pagination', 'Zero emails sent', 'Stuck at nine'].map((title, i) => ({
  id: `k${i + 1}`,
  title,
  description: 'Pages are 1-based.',
  duration: 5,
  difficulty: 'easy',
  type: 'review',
  language: ['typescript'],
  tags: [],
}))

test.describe('Kata flow (Choose a kata)', () => {
  test('finds up to three katas with the first selected, and starts nothing before Start', async ({ page }) => {
    let sessionsStarted = 0
    await page.route(`${API_BASE}/auth/me`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }),
    )
    await page.route(`${API_BASE}/dashboard`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DASHBOARD) }),
    )
    await page.route(`${API_BASE}/preferences`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PREFERENCES) }),
    )
    await page.route(`${API_BASE}/katas?*`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_KATAS) }),
    )
    await page.route(`${API_BASE}/sessions`, (route) => {
      sessionsStarted++
      return route.abort()
    })

    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('dojo_token', 'fake-token'))
    await page.goto('/katas')

    const find = page.getByRole('button', { name: 'Find katas →' })
    await expect(find).toBeDisabled()
    await expect(page.getByLabel('Type')).toHaveValue('')
    await expect(page.getByLabel('Language')).toHaveValue('')

    await page.getByRole('group', { name: 'Maximum duration' }).getByRole('button', { name: '5m' }).click()
    await find.click()

    await expect(page.getByRole('radio')).toHaveCount(3)
    await expect(page.getByRole('radio', { name: /Off-by-one/ })).toBeChecked()
    expect(sessionsStarted).toBe(0)
  })
})
