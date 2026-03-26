import { test, expect } from '@playwright/test'

test.describe('Auth redirect', () => {
  test('unauthenticated user on /dashboard is redirected to landing', async ({ page }) => {
    // No token in localStorage means AuthProvider will set user=null,
    // and RequireAuth will redirect to /
    await page.goto('/dashboard')

    // Should end up on the landing page
    await expect(page).toHaveURL('/')

    // Verify we see the landing page content
    await expect(
      page.getByRole('heading', { level: 1 }),
    ).toBeVisible()
  })
})
