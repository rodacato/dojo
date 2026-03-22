import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// Mock DB before importing auth middleware
const mockFindFirst = vi.fn()
vi.mock('../../persistence/drizzle/client', () => ({
  db: {
    query: {
      userSessions: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
    },
  },
}))
vi.mock('../../persistence/drizzle/schema', () => ({
  userSessions: { id: 'id', expiresAt: 'expiresAt' },
}))

import { requireAuth } from './auth'

function createTestApp() {
  const app = new Hono()
  app.use('/protected/*', requireAuth)
  app.get('/protected/resource', (c) => c.json({ ok: true }))
  return app
}

describe('requireAuth middleware', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 401 when no Authorization header is present', async () => {
    const app = createTestApp()
    const res = await app.request('/protected/resource')

    expect(res.status).toBe(401)
  })

  it('returns 401 when Authorization header is not Bearer', async () => {
    const app = createTestApp()
    const res = await app.request('/protected/resource', {
      headers: { Authorization: 'Basic abc123' },
    })

    expect(res.status).toBe(401)
  })

  it('returns 401 when Bearer token is empty', async () => {
    const app = createTestApp()
    const res = await app.request('/protected/resource', {
      headers: { Authorization: 'Bearer ' },
    })

    expect(res.status).toBe(401)
  })

  it('returns 401 when session is not found in DB', async () => {
    mockFindFirst.mockResolvedValue(null)

    const app = createTestApp()
    const res = await app.request('/protected/resource', {
      headers: { Authorization: 'Bearer invalid-session-id' },
    })

    expect(res.status).toBe(401)
  })

  it('passes and sets user when session is valid', async () => {
    const fakeUser = { id: 'user-1', username: 'testuser', githubId: '12345' }
    mockFindFirst.mockResolvedValue({ user: fakeUser })

    const app = new Hono()
    app.use('/protected/*', requireAuth)
    app.get('/protected/resource', (c) => {
      const user = c.get('user')
      return c.json({ userId: user.id })
    })

    const res = await app.request('/protected/resource', {
      headers: { Authorization: 'Bearer valid-session-id' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ userId: 'user-1' })
  })

  it('does not read cookies (ADR-007)', async () => {
    mockFindFirst.mockResolvedValue(null)

    const app = createTestApp()
    const res = await app.request('/protected/resource', {
      headers: { cookie: 'dojo_session=some-session-id' },
    })

    // Should still be 401 — cookies are ignored
    expect(res.status).toBe(401)
  })
})
