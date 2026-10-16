import { test, expect } from '@playwright/test'

const API_BASE = 'http://localhost:3001'
const WEB_ORIGIN = 'http://localhost:5173'

const CORS = {
  'access-control-allow-origin': WEB_ORIGIN,
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': 'content-type, authorization',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
}

// Mirrors RUNTIMES in EngawaPage.tsx: the language the picker offers and the version it pins.
const LANGUAGES = [
  { language: 'typescript', version: '5.0.3' },
  { language: 'python', version: '3.12.0' },
  { language: 'go', version: '1.16.2' },
  { language: 'ruby', version: '3.0.1' },
  { language: 'rust', version: '1.68.2' },
  { language: 'sql', version: '3.36.0' },
]

test.describe('Engawa playground — every language', () => {
  for (const { language, version } of LANGUAGES) {
    test(`${language}: picker updates the URL and Run reaches /engawa/run with ${version}`, async ({ page }) => {
      await page.route(`${API_BASE}/auth/me`, (route) =>
        route.fulfill({ status: 401, headers: CORS, contentType: 'application/json', body: '{"error":"Unauthorized"}' }),
      )

      const runBodies: Array<{ language: string; version: string }> = []
      await page.route(`${API_BASE}/engawa/run`, async (route) => {
        const request = route.request()
        if (request.method() === 'OPTIONS') {
          return route.fulfill({ status: 204, headers: CORS })
        }
        runBodies.push(request.postDataJSON())
        return route.fulfill({
          status: 200,
          headers: CORS,
          contentType: 'application/json',
          body: JSON.stringify({ stdout: `ran ${language}\n`, stderr: '', exitCode: 0, runtimeMs: 12, timedOut: false }),
        })
      })

      await page.goto('/engawa')
      await page.getByLabel('Language').selectOption(language)

      await expect(page).toHaveURL(new RegExp(`/engawa/${language}$`))
      await expect(page.getByLabel('Version')).toHaveValue(version)

      await page.getByRole('button', { name: /Run/ }).click()

      await expect(page.getByText(/OK · exit 0/)).toBeVisible()
      expect(runBodies).toHaveLength(1)
      expect(runBodies[0]).toMatchObject({ language, version })
    })
  }

  test('a language URL opens with that language selected', async ({ page }) => {
    await page.route(`${API_BASE}/auth/me`, (route) =>
      route.fulfill({ status: 401, headers: CORS, contentType: 'application/json', body: '{"error":"Unauthorized"}' }),
    )

    await page.goto('/engawa/ruby')

    await expect(page.getByLabel('Language')).toHaveValue('ruby')
    await expect(page.getByText('Page not defined.')).toHaveCount(0)
  })
})
