import { GitHub } from 'arctic'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { config } from '../../../config'
import { useCases } from '../../container'
import { db } from '../../persistence/drizzle/client'
import { invitations, userSessions, users } from '../../persistence/drizzle/schema'

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

  const githubId = String(githubUser.id)
  const isCreator = !!config.CREATOR_GITHUB_ID && githubId === config.CREATOR_GITHUB_ID

  // Check if user already exists (returning users always allowed)
  const existingUser = await db.query.users.findFirst({
    where: eq(users.githubId, githubId),
  })

  // New users must be the creator or have a valid invitation
  if (!existingUser && !isCreator) {
    // Check for pending invitation by looking at oauth_invite cookie
    const inviteToken = getCookie(c, 'oauth_invite')
    if (!inviteToken) {
      return c.redirect(`${config.WEB_URL}?error=invite_required`)
    }

    const invitation = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.token, inviteToken),
        isNull(invitations.usedBy),
        gt(invitations.expiresAt, new Date()),
      ),
    })

    if (!invitation) {
      deleteCookie(c, 'oauth_invite')
      return c.redirect(`${config.WEB_URL}?error=invite_invalid`)
    }
  }

  // Create or update the user record
  const user = await useCases.upsertUser.execute({
    githubId,
    username: githubUser.login,
    avatarUrl: githubUser.avatar_url,
  })

  // Mark invitation as used (if this was a new user via invite)
  if (!existingUser && !isCreator) {
    const inviteToken = getCookie(c, 'oauth_invite')
    if (inviteToken) {
      await db
        .update(invitations)
        .set({ usedBy: user.id })
        .where(eq(invitations.token, inviteToken))
      deleteCookie(c, 'oauth_invite')
    }
  }

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

// Redeem invitation — validates token and starts OAuth flow
authRoutes.get('/auth/invite/:token', async (c) => {
  const token = c.req.param('token')!

  const invitation = await db.query.invitations.findFirst({
    where: and(
      eq(invitations.token, token),
      isNull(invitations.usedBy),
      gt(invitations.expiresAt, new Date()),
    ),
  })

  if (!invitation) {
    return c.redirect(`${config.WEB_URL}?error=invite_invalid`)
  }

  // Store invite token in cookie so callback can read it
  setCookie(c, 'oauth_invite', token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  // Start normal OAuth flow
  const state = crypto.randomUUID()
  setCookie(c, 'oauth_state', state, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 60 * 5,
    path: '/',
  })

  const url = github.createAuthorizationURL(state, [])
  return c.redirect(url.toString())
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
