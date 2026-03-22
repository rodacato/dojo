import { describe, expect, it, vi } from 'vitest'
import { createRouter } from '../router'

// Prevent real DB/config imports from breaking tests
vi.mock('../../container', () => ({ useCases: {} }))

vi.mock('../../persistence/drizzle/client', () => ({
  db: {
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  },
}))
vi.mock('../../persistence/drizzle/schema', () => ({
  userSessions: {},
}))

describe('GET /auth/github', () => {
  it('redirects to github.com/login/oauth/authorize', async () => {
    const app = createRouter()
    const res = await app.request('/auth/github')

    expect(res.status).toBe(302)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('github.com/login/oauth/authorize')
  })

  it('sets oauth_state cookie (HttpOnly, SameSite=Lax)', async () => {
    const app = createRouter()
    const res = await app.request('/auth/github')

    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).toContain('oauth_state=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
  })

  it('does NOT set dojo_session cookie (ADR-007: bearer tokens)', async () => {
    const app = createRouter()
    const res = await app.request('/auth/github')

    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).not.toContain('dojo_session')
  })
})

describe('GET /auth/github/callback', () => {
  it('redirects to /?error=auth when state is missing', async () => {
    const app = createRouter()
    const res = await app.request('/auth/github/callback?code=abc')

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('error=auth')
  })

  it('redirects to /?error=auth when state does not match stored cookie', async () => {
    const app = createRouter()
    const res = await app.request('/auth/github/callback?code=abc&state=wrong-state', {
      headers: { cookie: 'oauth_state=correct-state' },
    })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('error=auth')
  })
})

describe('DELETE /auth/session', () => {
  it('returns 401 when no Authorization header is present', async () => {
    const app = createRouter()
    const res = await app.request('/auth/session', { method: 'DELETE' })

    expect(res.status).toBe(401)
  })

  it('returns 401 when Authorization header is not Bearer', async () => {
    const app = createRouter()
    const res = await app.request('/auth/session', {
      method: 'DELETE',
      headers: { Authorization: 'Basic abc123' },
    })

    expect(res.status).toBe(401)
  })

  it('returns 200 when valid Bearer token is provided', async () => {
    const app = createRouter()
    const res = await app.request('/auth/session', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-session-id' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ ok: true })
  })
})
