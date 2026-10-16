import { test, expect, type Page } from '@playwright/test'

// Browser smoke for what only a real browser against a real deploy can break:
// the CSP the web container serves, the WebSocket to the API, and every
// signed-in screen rendering. It never starts a kata or calls the LLM.

const API_URL = process.env['SMOKE_API_URL']!
const AUTH_TOKEN = process.env['SMOKE_AUTH_TOKEN']

const SIGNED_IN_PAGES = ['/dashboard', '/katas', '/history', '/belts', '/settings', '/kumite', '/scrolls', '/engawa/ruby']

// Known noise, not ours to fix: Turnstile opens a data: URL, and zod v4 probes
// for eval with Function('') inside a try/catch (it falls back without it).
const KNOWN_NOISE = new Set(['data', 'eval'])

async function trackCspViolations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] }
    w.__csp = []
    document.addEventListener('securitypolicyviolation', (e) => {
      w.__csp.push(`${e.violatedDirective} -> ${e.blockedURI}`)
    })
  })
}

async function cspViolations(page: Page): Promise<string[]> {
  const all = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)
  return all.filter((v) => !KNOWN_NOISE.has(v.split(' -> ')[1] ?? ''))
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate((token) => window.localStorage.setItem('dojo_token', token), AUTH_TOKEN!)
}

test.describe('smoke: the CSP lets the web reach its API', () => {
  test('a public page loads with no CSP violation', async ({ page }) => {
    await trackCspViolations(page)
    await page.goto('/engawa')
    await expect(page.getByLabel('Language')).toBeVisible()

    expect(await cspViolations(page), 'the CSP blocked something the app needs').toEqual([])
  })

  test('the browser can open a WebSocket to the API', async ({ page }) => {
    await page.goto('/engawa')

    const result = await page.evaluate(
      (apiUrl) =>
        new Promise<{ opened: boolean; code?: number }>((resolve) => {
          const ws = new WebSocket(`${apiUrl.replace(/^http/, 'ws')}/ws/sessions/00000000-0000-0000-0000-000000000000?token=smoke`)
          const timer = setTimeout(() => resolve({ opened: false }), 8_000)
          let opened = false
          ws.onopen = () => {
            opened = true
          }
          ws.onclose = (e) => {
            clearTimeout(timer)
            resolve({ opened, code: e.code })
          }
          ws.onerror = () => {
            clearTimeout(timer)
            resolve({ opened })
          }
        }),
      API_URL,
    )

    // A bad token is rejected after the handshake (4001), so reaching onopen
    // proves the CSP and the proxy allow the upgrade.
    expect(result.opened, 'the WebSocket was blocked before it opened').toBe(true)
  })
})

test.describe('smoke: signed-in pages', () => {
  test.skip(!AUTH_TOKEN, 'SMOKE_AUTH_TOKEN is required')

  for (const path of SIGNED_IN_PAGES) {
    test(`${path} renders for a signed-in user without CSP violations`, async ({ page }) => {
      await trackCspViolations(page)
      await signIn(page)
      await page.goto(path)

      await expect(page.getByText('Page not defined.')).toHaveCount(0)
      await expect(page.getByText(/something went wrong/i)).toHaveCount(0)
      await expect(page).not.toHaveURL(/session_expired/)
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 })

      expect(await cspViolations(page), 'the CSP blocked something on this page').toEqual([])
    })
  }
})
