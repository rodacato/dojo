import { describe, expect, it, vi, afterEach } from 'vitest'
import { createRouter } from '../router'

// Prevent real DB/config imports from breaking tests
vi.mock('../../container', () => ({ useCases: {} }))
vi.mock('../../persistence/drizzle/client', () => ({ db: {} }))

describe('GET /auth/github', () => {
  afterEach(() => vi.restoreAllMocks())

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
