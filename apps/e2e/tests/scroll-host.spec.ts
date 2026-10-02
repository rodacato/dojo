// Needs data-testid="scroll-frame" (iframe) and "scroll-status" (text: loading | connected | error) on /scrolls/:slug.
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const API_BASE = 'http://localhost:3001'
const SLUG = 'e2e-fixture'
const manifest = JSON.parse(
  readFileSync(new URL('../fixtures/scroll/scroll.json', import.meta.url), 'utf8'),
)

declare global {
  interface Window {
    __scrollMessages: Array<{ origin: string; data: { type?: string } }>
  }
}

test.describe('Scroll host', () => {
  test('completes the handshake and receives progress and complete from a cross-origin scroll', async ({
    page,
  }) => {
    // Existing specs mock the API (no real auth helper exists); the response shape follows the scrolls detail route.
    await page.route(`${API_BASE}/scrolls/${SLUG}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          slug: SLUG,
          status: 'published',
          visibility: 'public',
          manifest,
        }),
      }),
    )

    await page.addInitScript(() => {
      window.__scrollMessages = []
      window.addEventListener('message', (event) => {
        window.__scrollMessages.push({ origin: event.origin, data: event.data })
      })
    })

    await page.goto(`/scrolls/${SLUG}`)

    await expect(page.getByTestId('scroll-status')).toHaveText('connected')

    const frame = page.frameLocator('[data-testid="scroll-frame"]')
    await expect(frame.locator('#state')).toHaveText('init')

    await frame.locator('#progress').click()
    await frame.locator('#complete').click()

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.__scrollMessages
            .filter((m) => m.origin === 'http://localhost:4010')
            .map((m) => m.data.type),
        ),
      )
      .toEqual(expect.arrayContaining(['hello', 'progress', 'complete']))
  })
})
