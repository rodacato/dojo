import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter } from '../router'

// ---------------------------------------------------------------------------
// Hoisted state the mock factories close over. The real boundaries we control:
//   - arctic GitHub (token exchange)
//   - global fetch (GitHub /user and /user/emails)
//   - drizzle db (existing-user lookup, invitation lookup, session insert)
//   - useCases.upsertUser
//   - config (to flip CREATOR_GITHUB_ID / RESEND_API_KEY per test)
// Everything inside auth.ts (state check, invite gate, redirect targets) is the
// real code under test.
// ---------------------------------------------------------------------------
const {
  mockConfig,
  validateAuthorizationCode,
  accessToken,
  upsertUser,
  findFirstUser,
  findFirstInvitation,
  sessionInsertReturning,
  invitationsUpdateWhere,
  usersUpdateWhere,
  reportError,
} = vi.hoisted(() => ({
  mockConfig: {
    GITHUB_CLIENT_ID: 'test-client-id',
    GITHUB_CLIENT_SECRET: 'test-client-secret',
    GITHUB_CALLBACK_URL: 'http://localhost:3001/auth/github/callback',
    WEB_URL: 'http://localhost:5173',
    NODE_ENV: 'test' as 'test' | 'production' | 'development',
    CREATOR_GITHUB_ID: '',
    RESEND_API_KEY: '',
    RESEND_FROM_EMAIL: 'dojo <noreply@notdefined.dev>',
  },
  validateAuthorizationCode: vi.fn(),
  accessToken: vi.fn(() => 'gh-access-token'),
  upsertUser: vi.fn(),
  findFirstUser: vi.fn(),
  findFirstInvitation: vi.fn(),
  sessionInsertReturning: vi.fn(),
  invitationsUpdateWhere: vi.fn(),
  usersUpdateWhere: vi.fn(),
  reportError: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../config', () => ({ config: mockConfig }))

// arctic GitHub: real-ish authorization URL (so the redirect tests still see
// github.com), controllable token exchange.
vi.mock('arctic', () => ({
  GitHub: class {
    createAuthorizationURL(state: string, scopes: string[]) {
      const u = new URL('https://github.com/login/oauth/authorize')
      u.searchParams.set('state', state)
      u.searchParams.set('scope', scopes.join(' '))
      return u
    }
    validateAuthorizationCode(...args: unknown[]) {
      return validateAuthorizationCode(...args)
    }
  },
}))

vi.mock('../../container', () => ({
  useCases: { upsertUser: { execute: upsertUser } },
  errorReporter: { report: reportError },
}))

vi.mock('../../persistence/drizzle/client', () => ({
  db: {
    query: {
      users: { findFirst: findFirstUser },
      invitations: { findFirst: findFirstInvitation },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ returning: sessionInsertReturning })),
    })),
    update: vi.fn(() => ({
      set: vi.fn((patch: Record<string, unknown>) => ({
        where: 'email' in patch ? usersUpdateWhere : invitationsUpdateWhere,
      })),
    })),
    delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
  },
}))

vi.mock('../../persistence/drizzle/schema', () => ({
  userSessions: {},
  users: { githubId: 'users.githubId', id: 'users.id' },
  invitations: { token: 'inv.token', usedBy: 'inv.usedBy', expiresAt: 'inv.expiresAt' },
}))

// Token exchange returns an object whose accessToken() yields the token.
function okTokenExchange() {
  validateAuthorizationCode.mockResolvedValue({ accessToken })
}

// Drive global.fetch per URL: /user and /user/emails.
function mockGithubFetch(opts: {
  userOk?: boolean
  user?: Record<string, unknown>
  emailsOk?: boolean
  emails?: unknown
}) {
  const {
    userOk = true,
    user = { id: 4242, login: 'octocat', avatar_url: 'https://avatars/octocat.png' },
    emailsOk = true,
    emails = [{ email: 'octo@github.com', primary: true, verified: true }],
  } = opts
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url === 'https://api.github.com/user') {
        return { ok: userOk, json: async () => user } as Response
      }
      if (url === 'https://api.github.com/user/emails') {
        return { ok: emailsOk, json: async () => emails } as Response
      }
      throw new Error(`unexpected fetch: ${url}`)
    }),
  )
}

// The auth/* rate limiter keeps an in-memory bucket keyed by client IP and is
// shared across createRouter() instances. Give every request a unique IP so the
// limiter never trips between tests (we're not testing the limiter here).
let ipCounter = 0
function freshIp(): string {
  ipCounter += 1
  return `10.0.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`
}
function authRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = { 'x-forwarded-for': freshIp(), ...(init.headers as Record<string, string>) }
  return createRouter().request(path, { ...init, headers })
}

const STATE = 'csrf-state-123'
function callback(extraCookies = ''): Promise<Response> {
  const cookie = [`oauth_state=${STATE}`, extraCookies].filter(Boolean).join('; ')
  return authRequest(`/auth/github/callback?code=valid-code&state=${STATE}`, {
    headers: { cookie },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockConfig.NODE_ENV = 'test'
  mockConfig.CREATOR_GITHUB_ID = ''
  mockConfig.RESEND_API_KEY = ''
  okTokenExchange()
  mockGithubFetch({})
  findFirstUser.mockResolvedValue(undefined)
  findFirstInvitation.mockResolvedValue(undefined)
  upsertUser.mockResolvedValue({ id: 'user-1' })
  sessionInsertReturning.mockResolvedValue([{ id: 'session-abc' }])
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GET /auth/github', () => {
  it('redirects to github.com/login/oauth/authorize', async () => {
    const res = await authRequest('/auth/github')
    expect(res.status).toBe(302)
    expect(res.headers.get('location') ?? '').toContain('github.com/login/oauth/authorize')
  })

  it('sets oauth_state cookie (HttpOnly, SameSite=Lax)', async () => {
    const res = await authRequest('/auth/github')
    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).toContain('oauth_state=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
  })

  it('does NOT set dojo_session cookie (ADR-007: bearer tokens)', async () => {
    const res = await authRequest('/auth/github')
    expect(res.headers.get('set-cookie') ?? '').not.toContain('dojo_session')
  })
})

describe('GET /auth/github/callback — CSRF state gate', () => {
  it('redirects to ?error=auth when state is missing', async () => {
    const res = await authRequest('/auth/github/callback?code=abc')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('error=auth')
  })

  it('redirects to ?error=auth when state does not match stored cookie', async () => {
    const res = await authRequest('/auth/github/callback?code=abc&state=wrong', {
      headers: { cookie: 'oauth_state=right' },
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('error=auth')
    // The state mismatch must short-circuit BEFORE any token exchange.
    expect(validateAuthorizationCode).not.toHaveBeenCalled()
  })
})

describe('GET /auth/github/callback — token + profile failures', () => {
  it('redirects to ?error=auth when the code exchange throws', async () => {
    validateAuthorizationCode.mockRejectedValue(new Error('bad_verification_code'))
    const res = await callback()
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('error=auth')
    expect(upsertUser).not.toHaveBeenCalled()
  })

  it('redirects to ?error=auth when GET /user is not ok', async () => {
    mockGithubFetch({ userOk: false })
    const res = await callback()
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('error=auth')
    expect(upsertUser).not.toHaveBeenCalled()
  })
})

describe('GET /auth/github/callback — invite gate for new users', () => {
  it('redirects to ?error=invite_required when a new user has no invite cookie', async () => {
    findFirstUser.mockResolvedValue(undefined) // brand-new user
    const res = await callback() // no oauth_invite cookie
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('error=invite_required')
    expect(upsertUser).not.toHaveBeenCalled()
  })

  it('redirects to ?error=invite_invalid when the invite cookie matches no valid invitation', async () => {
    findFirstUser.mockResolvedValue(undefined)
    findFirstInvitation.mockResolvedValue(undefined) // token expired/used/unknown
    const res = await callback('oauth_invite=stale-token')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('error=invite_invalid')
    expect(upsertUser).not.toHaveBeenCalled()
  })

  it('clears the oauth_invite cookie when the invitation is invalid', async () => {
    findFirstUser.mockResolvedValue(undefined)
    findFirstInvitation.mockResolvedValue(undefined)
    const res = await callback('oauth_invite=stale-token')
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toMatch(/oauth_invite=;|oauth_invite=deleted|Max-Age=0/i)
  })
})

describe('GET /auth/github/callback — success paths', () => {
  it('a returning user logs in without an invite and redirects with the session token', async () => {
    findFirstUser.mockResolvedValue({ id: 'user-1', githubId: '4242' })
    const res = await callback()
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('http://localhost:5173/auth/callback?token=session-abc')
    expect(upsertUser).toHaveBeenCalledWith({
      githubId: '4242',
      username: 'octocat',
      avatarUrl: 'https://avatars/octocat.png',
    })
  })

  it('the creator logs in without an invite even when no user row exists yet', async () => {
    mockConfig.CREATOR_GITHUB_ID = '4242'
    findFirstUser.mockResolvedValue(undefined)
    const res = await callback()
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('/auth/callback?token=session-abc')
    expect(findFirstInvitation).not.toHaveBeenCalled()
    expect(upsertUser).toHaveBeenCalledTimes(1)
  })

  it('a new user with a valid invitation logs in and the invite is marked used', async () => {
    findFirstUser.mockResolvedValue(undefined)
    findFirstInvitation.mockResolvedValue({ token: 'good-token', usedBy: null })
    const res = await callback('oauth_invite=good-token')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('/auth/callback?token=session-abc')
    // invitation marked used (the non-email update branch)
    expect(invitationsUpdateWhere).toHaveBeenCalledTimes(1)
  })

  it('persists the resolved primary email on the users row', async () => {
    findFirstUser.mockResolvedValue({ id: 'user-1', githubId: '4242' })
    await callback()
    expect(usersUpdateWhere).toHaveBeenCalledTimes(1)
  })

  it('skips the email update when GitHub exposes no primary email', async () => {
    findFirstUser.mockResolvedValue({ id: 'user-1', githubId: '4242' })
    mockGithubFetch({ emails: [{ email: 'x@y.z', primary: false, verified: true }] })
    await callback()
    expect(usersUpdateWhere).not.toHaveBeenCalled()
  })

  it('still logs in when the /user/emails lookup fails (email is optional)', async () => {
    findFirstUser.mockResolvedValue({ id: 'user-1', githubId: '4242' })
    mockGithubFetch({ emailsOk: false })
    const res = await callback()
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('/auth/callback?token=session-abc')
    expect(usersUpdateWhere).not.toHaveBeenCalled()
  })

  it('clears the oauth_state cookie on success', async () => {
    findFirstUser.mockResolvedValue({ id: 'user-1', githubId: '4242' })
    const res = await callback()
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toMatch(/oauth_state=;|oauth_state=deleted|Max-Age=0/i)
  })
})

describe('GET /auth/invite/:token', () => {
  it('redirects to ?error=invite_invalid for an unknown/expired token', async () => {
    findFirstInvitation.mockResolvedValue(undefined)
    const res = await authRequest('/auth/invite/nope')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('error=invite_invalid')
  })

  it('sets the oauth_invite cookie and starts the OAuth flow for a valid token', async () => {
    findFirstInvitation.mockResolvedValue({ token: 'good', usedBy: null })
    const res = await authRequest('/auth/invite/good')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('github.com/login/oauth/authorize')
    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).toContain('oauth_invite=good')
    expect(cookie).toContain('oauth_state=')
  })
})

describe('DELETE /auth/session', () => {
  it('returns 401 when no Authorization header is present', async () => {
    const res = await authRequest('/auth/session', { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  it('returns 401 when Authorization header is not Bearer', async () => {
    const res = await authRequest('/auth/session', {
      method: 'DELETE',
      headers: { Authorization: 'Basic abc123' },
    })
    expect(res.status).toBe(401)
  })

  it('returns 200 when a valid Bearer token is provided', async () => {
    const res = await authRequest('/auth/session', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-session-id' },
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})
