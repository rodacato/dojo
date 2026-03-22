import { GitHub } from 'arctic'
import { and, eq, gt } from 'drizzle-orm'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { config } from '../../../config'
import { useCases } from '../../container'
import { db } from '../../persistence/drizzle/client'
import { userSessions } from '../../persistence/drizzle/schema'

export const authRoutes = new Hono()

const github = new GitHub(
  config.GITHUB_CLIENT_ID,
  config.GITHUB_CLIENT_SECRET,
  config.GITHUB_CALLBACK_URL,
)

// Step 1: Redirect to GitHub
authRoutes.get('/auth/github', async (c) => {
  const state = crypto.randomUUID()

  // Store state in a short-lived cookie for CSRF protection
  setCookie(c, 'oauth_state', state, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'Lax', // must be Lax — Strict drops cookie on GitHub redirect
    maxAge: 60 * 5, // 5 minutes
    path: '/',
  })

  const url = github.createAuthorizationURL(state, []) // no scopes — just identity
  return c.redirect(url.toString())
})

// Step 2: GitHub redirects back here
authRoutes.get('/auth/github/callback', async (c) => {
  const { code, state } = c.req.query()
  const storedState = getCookie(c, 'oauth_state')

  // Validate state — CSRF protection
  if (!state || !storedState || state !== storedState) {
    return c.redirect(`${config.WEB_URL}?error=auth`)
  }

  // Exchange code for tokens
  let tokens
  try {
    tokens = await github.validateAuthorizationCode(code ?? '')
  } catch {
    return c.redirect(`${config.WEB_URL}?error=auth`)
  }

  // Fetch GitHub user profile
  const githubUserRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokens.accessToken()}`,
      'User-Agent': 'dojo.notdefined.dev',
    },
  })

  if (!githubUserRes.ok) {
    return c.redirect(`${config.WEB_URL}?error=auth`)
  }

  const githubUser = (await githubUserRes.json()) as {
    id: number
    login: string
    avatar_url: string
  }

  // Create or update the user record
  const user = await useCases.upsertUser.execute({
    githubId: String(githubUser.id),
    username: githubUser.login,
    avatarUrl: githubUser.avatar_url,
  })

  // Create a server-side session (30 days)
  const sessionExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)

  const [session] = await db
    .insert(userSessions)
    .values({ userId: user.id, expiresAt: sessionExpiresAt })
    .returning()

  // Clear state cookie and redirect with token (ADR-007)
  deleteCookie(c, 'oauth_state')
  return c.redirect(`${config.WEB_URL}/auth/callback?token=${session!.id}`)
})

// Logout
authRoutes.delete('/auth/session', async (c) => {
  const authHeader = c.req.header('Authorization')
  const sessionId = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!sessionId) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }

  await db.delete(userSessions).where(and(eq(userSessions.id, sessionId), gt(userSessions.expiresAt, new Date())))
  return c.json({ ok: true })
})
