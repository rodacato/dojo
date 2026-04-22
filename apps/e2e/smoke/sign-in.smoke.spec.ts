import { test, expect } from '@playwright/test'

// Sign-in smoke — verifies the GitHub OAuth initiation flow without
// actually contacting github.com. We check that GET /auth/github:
//   1. returns a 302 redirect
//   2. sends us to github.com/login/oauth/authorize
//   3. includes the required OAuth params (client_id, state, redirect_uri, scope)
//   4. sets the oauth_state cookie that the callback handler later verifies
//
// The full happy-path (callback → session token → dashboard) requires
// an OAuth mock and will land as a staging-only spec alongside the
// rest of Part 3.

const API_URL = process.env['SMOKE_API_URL']!

test.describe('smoke: sign-in initiation', () => {
  test('GET /auth/github redirects to github.com with the expected params', async ({ request }) => {
    const res = await request.get(`${API_URL}/auth/github`, { maxRedirects: 0 })

    expect(res.status(), '/auth/github should respond 302').toBe(302)

    const location = res.headers()['location']
    expect(location, 'Location header missing').toBeTruthy()
    expect(location).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize/)

    const params = new URL(location!).searchParams
    expect(params.get('client_id'), 'client_id missing').toBeTruthy()
    expect(params.get('state'), 'state missing').toBeTruthy()
    expect(params.get('redirect_uri'), 'redirect_uri missing').toBeTruthy()
    // user:email is required for the welcome-on-redeem flow (commit 381d1a5).
    expect(params.get('scope') ?? '', 'scope should include user:email').toContain('user:email')

    // The state CSRF cookie must be set — the callback handler reads it
    // to verify the returned state. Without this the OAuth round trip
    // fails closed.
    const setCookie = res.headers()['set-cookie'] ?? ''
    expect(setCookie, 'oauth_state cookie must be set').toMatch(/oauth_state=/i)
  })
})
