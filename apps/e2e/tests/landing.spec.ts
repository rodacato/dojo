import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('shows hero headline, request access link, and footer', async ({ page }) => {
    await page.goto('/')

    // Hero headline (typewriter text — wait for it to appear)
    await expect(
      page.getByRole('heading', { level: 1 }),
    ).toBeVisible()

    // "Request access" link in the hero section
    await expect(
      page.getByRole('link', { name: /request access/i }).first(),
    ).toBeVisible()

    // Footer text
    await expect(
      page.getByText('Not for everyone. Exactly as intended.'),
    ).toBeVisible()
  })

  test('"Try a free course" CTA navigates to /learn (Sprint 015)', async ({ page }) => {
    await page.route('http://localhost:3001/learn/courses', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ courses: [] }),
      }),
    )

    await page.goto('/')
    await page.getByRole('link', { name: /try a free course/i }).first().click()
    await expect(page).toHaveURL('/learn')
  })
})
