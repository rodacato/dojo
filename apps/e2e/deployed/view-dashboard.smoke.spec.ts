import { test, expect } from '@playwright/test'

// First smoke test — read-only against a live deploy. Seeds a valid
// bearer token into localStorage, loads /dashboard, and asserts the
// page rendered without the session-expired redirect or the global
// error boundary. No data assertions — numbers change on a live env.

const API_URL = process.env['SMOKE_API_URL']!
const AUTH_TOKEN = process.env['SMOKE_AUTH_TOKEN']

test.describe('smoke: view dashboard', () => {
  test.skip(!AUTH_TOKEN, 'SMOKE_AUTH_TOKEN is required')

  test('renders dashboard for an authenticated creator', async ({ page }) => {
    // Preflight: API is reachable. If this fails, the rest is noise.
    const health = await page.request.get(`${API_URL}/health`)
    expect(health.status(), 'API /health should return 2xx').toBeLessThan(300)

    // Seed the bearer token before any page navigates to a protected route.
    await page.goto('/')
    await page.evaluate((token) => {
      window.localStorage.setItem('dojo_token', token)
    }, AUTH_TOKEN!)

    await page.goto('/dashboard')

    // Session-expired redirect would push us back to `/?error=session_expired`.
    await expect(page).toHaveURL(/\/dashboard$/)

    // The global ErrorBoundary renders an ErrorPage when something bad
    // happens during bootstrap — no page-level crash.
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0)

    // Structural landmark — the streak widget label is present on every
    // dashboard render regardless of data shape.
    await expect(page.getByText(/active_streak/i)).toBeVisible({ timeout: 10_000 })
  })
})
