import { defineConfig } from '@playwright/test'

// Smoke config — separate from the PR-time e2e suite. Runs against a
// real deployed environment (prod or staging), never spins up a local
// dev server, and expects a pre-issued bearer token in
// `SMOKE_AUTH_TOKEN`. See docs/specs/027-sprint-022-playground.md §3.

const baseURL = process.env['SMOKE_BASE_URL']
const apiURL = process.env['SMOKE_API_URL']

if (!baseURL || !apiURL) {
  throw new Error(
    'Smoke tests require SMOKE_BASE_URL and SMOKE_API_URL. ' +
      'Example: SMOKE_BASE_URL=https://dojo.notdefined.dev SMOKE_API_URL=https://dojo-api.notdefined.dev',
  )
}

export default defineConfig({
  testDir: './smoke',
  testMatch: /.*\.smoke\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: 'list',
  // Hard cap per S027 §3.3 — if the suite drifts over 3 min on a real
  // deploy, something is wrong with the deploy, not the tests.
  globalTimeout: 3 * 60 * 1000,
  timeout: 30 * 1000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    extraHTTPHeaders: {
      'X-Smoke-Test': '1',
    },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
