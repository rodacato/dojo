// Drives the reference scroll (fixtures/reference-scroll) inside the real web host, with the API mocked.
// Needs data-testid="scroll-frame" (iframe) and "scroll-status" (text: loading | connected | error) on /scrolls/:slug.
import { test, expect, type Page, type Request } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const API_BASE = 'http://localhost:3001'
const SLUG = 'reference-scroll'
const ANONYMOUS_ID = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60'
const manifest = JSON.parse(readFileSync(join(__dirname, '../fixtures/reference-scroll/scroll.json'), 'utf8'))

const USER = {
  id: 'user-1',
  username: 'testdev',
  email: 'test@example.com',
  avatarUrl: 'https://example.com/avatar.png',
  role: 'user',
  createdAt: '2025-01-01T00:00:00.000Z',
}

interface ApiOptions {
  signedIn?: boolean
  units?: Record<string, { completed: boolean; state?: unknown }>
}

async function mockApi(page: Page, { signedIn = false, units = {} }: ApiOptions = {}) {
  const writes: Request[] = []
  const executions: Request[] = []
  const merges: Request[] = []
  const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })

  if (signedIn) {
    await page.route(`${API_BASE}/auth/me`, (route) => route.fulfill(json(USER)))
    await page.route(`${API_BASE}/scrolls/execution/status`, (route) => route.fulfill(json({ enabled: true })))
  }
  await page.route(`${API_BASE}/scrolls/${SLUG}`, (route) =>
    route.fulfill(
      json({
        id: '00000000-0000-4000-8000-000000000001',
        slug: SLUG,
        status: 'published',
        visibility: 'public',
        manifest,
        createdAt: '2026-10-03T00:00:00.000Z',
        updatedAt: '2026-10-03T00:00:00.000Z',
      }),
    ),
  )
  await page.route(`${API_BASE}/scrolls/${SLUG}/progress`, (route) => {
    if (route.request().method() === 'POST') writes.push(route.request())
    return route.fulfill(json({ userRef: 'e2e-user-ref', completed: false, units, updatedAt: null }))
  })
  await page.route(`${API_BASE}/scrolls/${SLUG}/execute`, (route) => {
    executions.push(route.request())
    return route.fulfill(
      json({ kind: 'ok', exitCode: 0, stdout: 'hello from the reference scroll\n', stderr: '', durationMs: 12 }),
    )
  })
  await page.route(`${API_BASE}/scrolls/progress/merge`, (route) => {
    merges.push(route.request())
    return route.fulfill({ status: 204 })
  })

  return { writes, executions, merges }
}

async function seedStorage(page: Page, entries: Record<string, string>) {
  await page.goto('/')
  await page.evaluate((values) => {
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value)
  }, entries)
}

async function openScroll(page: Page) {
  await page.goto(`/scrolls/${SLUG}`)
  await expect(page.getByTestId('scroll-status')).toHaveText('connected')
  const frame = page.frameLocator('[data-testid="scroll-frame"]')
  await expect(frame.locator('#mode')).toHaveText('embedded')
  return frame
}

test.describe('Scroll host with the reference scroll', () => {
  test('an anonymous visitor saves progress under their anonymous id and is not offered code execution', { tag: '@smoke' }, async ({ page }) => {
    const api = await mockApi(page)
    const frame = await openScroll(page)

    await expect(frame.locator('#capabilities')).toHaveText('progress')
    await expect(frame.locator('#run')).toBeDisabled()
    await expect(frame.locator('#run-note')).toHaveText('Sign in to Dojo to run code here.')

    await frame.locator('#progress').click()
    await frame.locator('#complete').click()

    await expect.poll(() => api.writes.map((request) => request.postDataJSON())).toEqual([
      { type: 'progress', unitId: 'unit-1', state: { steps: 1 } },
      { type: 'complete', unitId: 'unit-1' },
    ])
    const anonymousId = await page.evaluate(() => localStorage.getItem('dojo-anon-id'))
    expect(anonymousId).toBeTruthy()
    expect(api.writes.map((request) => request.headers()['x-anonymous-id'])).toEqual([anonymousId, anonymousId])
    expect(api.executions).toHaveLength(0)
  })

  test('saved progress comes back to the scroll in init', async ({ page }) => {
    const api = await mockApi(page, { units: { 'unit-1': { completed: false, state: { steps: 2 } } } })
    const frame = await openScroll(page)

    await expect(frame.locator('#steps')).toHaveText('2')
    await frame.locator('#progress').click()

    await expect.poll(() => api.writes.map((request) => request.postDataJSON())).toEqual([
      { type: 'progress', unitId: 'unit-1', state: { steps: 3 } },
    ])
  })

  test('a signed-in user runs code through the host and gets the result back in the scroll', async ({ page }) => {
    const api = await mockApi(page, { signedIn: true })
    await seedStorage(page, { dojo_token: 'fake-token' })
    const frame = await openScroll(page)

    await expect(frame.locator('#capabilities')).toHaveText('progress, run')
    await frame.locator('#run').click()

    await expect(frame.locator('#output')).toHaveText('ok: hello from the reference scroll')
    expect(api.executions.map((request) => request.postDataJSON())).toEqual([
      {
        language: 'javascript',
        files: [{ name: 'main.js', content: 'console.log("hello from the reference scroll")' }],
      },
    ])
    await expect.poll(() => api.writes.map((request) => request.postDataJSON())).toEqual([
      { type: 'complete', unitId: 'unit-2' },
    ])
    expect(api.writes[0]?.headers()['x-anonymous-id']).toBeUndefined()
  })

  test('signing in merges the progress saved as an anonymous visitor', async ({ page }) => {
    const api = await mockApi(page, { signedIn: true })
    await seedStorage(page, { dojo_token: 'fake-token', 'dojo-anon-id': ANONYMOUS_ID })
    await openScroll(page)

    expect(api.merges.map((request) => request.headers()['x-anonymous-id'])).toEqual([ANONYMOUS_ID])
    expect(await page.evaluate(() => localStorage.getItem('dojo-anon-id'))).toBeNull()
  })
})
