import { test, expect } from '@playwright/test'

// Public profile smoke — unauthenticated, read-only. Requires
// SMOKE_PUBLIC_USERNAME to identify a profile known to exist on the
// target environment (typically the creator's own handle).
//
// This route is the one that broke in the 2026-04-22 post-deploy
// chunk-load incident; keeping it in the smoke suite is how we catch
// that class of regression early.

const API_URL = process.env['SMOKE_API_URL']!
const PUBLIC_USERNAME = process.env['SMOKE_PUBLIC_USERNAME']

test.describe('smoke: view public profile', () => {
  test.skip(!PUBLIC_USERNAME, 'SMOKE_PUBLIC_USERNAME is required')

  test('renders public profile without auth', async ({ page }) => {
    // API-level preflight: the public profile endpoint answers before
    // we involve the browser.
    const apiResponse = await page.request.get(`${API_URL}/u/${PUBLIC_USERNAME}`)
    expect(apiResponse.status(), `GET /u/${PUBLIC_USERNAME} should return 200`).toBe(200)

    await page.goto(`/u/${PUBLIC_USERNAME}`)

    // The route should not have redirected or navigated elsewhere.
    await expect(page).toHaveURL(new RegExp(`/u/${PUBLIC_USERNAME}$`))

    // Negative assertions for the two failure modes this test exists to catch.
    await expect(page.getByText(/practitioner not found/i)).toHaveCount(0)
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0)

    // Structural anchors that render on every profile regardless of data:
    // the username heading (h1) and the "day streak" label next to the
    // accented streak number.
    await expect(page.getByRole('heading', { level: 1, name: PUBLIC_USERNAME })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText(/day streak/i).first()).toBeVisible()
  })
})
