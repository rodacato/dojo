import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('shows hero headline, primary CTA, and footer', async ({ page }) => {
    await page.goto('/')

    // Hero headline (GSAP timeline draws the typewriter — wait for it to appear)
    await expect(
      page.getByRole('heading', { level: 1 }),
    ).toBeVisible()

    // Hero CTA "Enter dojo →" — the single conversion link to #access form
    await expect(
      page.getByRole('link', { name: /enter dojo/i }).first(),
    ).toBeVisible()

    // Footer brand line
    await expect(
      page.getByText('Not for everyone. Exactly as intended.'),
    ).toBeVisible()
  })
})
