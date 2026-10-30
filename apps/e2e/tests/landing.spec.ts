import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('shows hero headline, primary CTA, and footer', { tag: '@smoke' }, async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { level: 1 }),
    ).toBeVisible()

    await expect(page.getByRole('link', { name: 'Sign in with GitHub' })).toBeVisible()

    // Footer brand line
    await expect(
      page.getByText('Not for everyone. Exactly as intended.'),
    ).toBeVisible()
  })
})
