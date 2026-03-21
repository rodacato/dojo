# Spec 006 — GitHub OAuth

**Experts:** Marta Kowalczyk (security), Tomás Ríos (implementation)
**Depends on:** Phase 2 (`UpsertUser` use case), Phase 3 (database + `PostgresUserRepository`), Phase 5 (rate limiting — `authLimiter`)
**Blocks:** nothing — foundation is complete after this phase

## What and Why

Two OAuth routes (`/auth/github` + `/auth/github/callback`) that authenticate users via GitHub, create or update their User record, establish a server-side session, and set a secure cookie.

The `arctic` library handles OAuth mechanics (state generation, token exchange). Sessions are stored in the database — not in JWTs. JWTs cannot be revoked; for a personal tool, a database session is simpler and more secure.

## Scope

**In:** `user_sessions` table + migration, `arctic` OAuth client, auth routes, `requireAuth` middleware, `container.ts` update
**Out:** logout route (trivial addition later), profile page, session refresh/rotation, multi-provider auth

---

## Packages

Add to `apps/api/package.json` dependencies:
```
arctic@^2.0.0
```

---

## Schema Addition

Add `user_sessions` table to `apps/api/src/infrastructure/persistence/drizzle/schema.ts`:

```ts
export const userSessions = pgTable('user_sessions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, { fields: [userSessions.userId], references: [users.id] }),
}))
```

After adding: run `pnpm --filter=@dojo/api db:generate` to create the migration file, then `db:migrate` to apply it.

---

## File: `src/infrastructure/http/routes/auth.ts`

```ts
import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { GitHub } from 'arctic'
import { config } from '../../../config'
import { db } from '../../persistence/drizzle/client'
import { userSessions, users } from '../../persistence/drizzle/schema'
import { eq, and, gt } from 'drizzle-orm'
import { useCases } from '../../container'

export const authRoutes = new Hono()

const github = new GitHub(
  config.GITHUB_CLIENT_ID,
  config.GITHUB_CLIENT_SECRET,
  `${config.WEB_URL}/auth/github/callback`,   // must match GitHub OAuth App settings
)

// Step 1: Redirect to GitHub
authRoutes.get('/auth/github', async (c) => {
  const state = crypto.randomUUID()

  // Store state in a short-lived cookie for CSRF protection
  setCookie(c, 'oauth_state', state, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'Lax',          // must be Lax — Strict drops cookie on GitHub redirect
    maxAge: 60 * 5,           // 5 minutes
    path: '/',
  })

  const url = github.createAuthorizationURL(state, [])  // no scopes needed — just identity
  return c.redirect(url.toString())
})

// Step 2: GitHub redirects back here
authRoutes.get('/auth/github/callback', async (c) => {
  const { code, state } = c.req.query()
  const storedState = getCookie(c, 'oauth_state')

  // Validate state — CSRF protection
  if (!state || !storedState || state !== storedState) {
    return c.json({ error: 'Invalid OAuth state. Please try again.' }, 400)
  }

  // Exchange code for tokens
  let tokens
  try {
    tokens = await github.validateAuthorizationCode(code)
  } catch {
    return c.json({ error: 'Failed to exchange authorization code.' }, 400)
  }

  // Fetch GitHub user profile
  const githubUserRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokens.accessToken()}`,
      'User-Agent': 'dojo.notdefined.dev',
    },
  })

  if (!githubUserRes.ok) {
    return c.json({ error: 'Failed to fetch GitHub user profile.' }, 500)
  }

  const githubUser = await githubUserRes.json() as {
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

  // Create a server-side session
  const sessionExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days

  const [session] = await db
    .insert(userSessions)
    .values({ userId: user.id, expiresAt: sessionExpiresAt })
    .returning()

  // Clear the state cookie and set the session cookie
  deleteCookie(c, 'oauth_state')
  setCookie(c, 'session', session.id, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'Strict',
    expires: sessionExpiresAt,
    path: '/',
  })

  return c.redirect(config.WEB_URL)
})
```

**Notes:**
- `arctic` `GitHub` class handles PKCE and redirect URI validation
- No access token is stored — GitHub token is only used to fetch the user profile, then discarded
- The session cookie value is the `user_sessions.id` UUID — not a JWT, not a signed token — the database is the source of truth

---

## File: `src/infrastructure/http/middleware/auth.ts`

```ts
import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { db } from '../../persistence/drizzle/client'
import { userSessions, users } from '../../persistence/drizzle/schema'
import { eq, and, gt } from 'drizzle-orm'

export async function requireAuth(c: Context, next: Next) {
  const sessionId = getCookie(c, 'session')

  if (!sessionId) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }

  // Look up the session and eagerly load the user
  const session = await db.query.userSessions.findFirst({
    where: and(
      eq(userSessions.id, sessionId),
      gt(userSessions.expiresAt, new Date()),   // must not be expired
    ),
    with: { user: true },
  })

  if (!session) {
    throw new HTTPException(401, { message: 'Session expired or invalid' })
  }

  c.set('user', session.user)   // available to all downstream route handlers
  await next()
}
```

---

## `container.ts` — Register `UpsertUser` with real `UserRepository`

After Phase 3, `container.ts` already has `PostgresUserRepository`. Ensure `UpsertUser` is wired:

```ts
export const useCases = {
  // ...existing
  upsertUser: new UpsertUser({ userRepo: new PostgresUserRepository(db) }),
}
```

---

## `router.ts` — Register auth routes

```ts
import { authRoutes } from './routes/auth'

// inside createRouter():
app.route('/', authRoutes)
```

`authLimiter` from Phase 5 is already applied to `/auth/*` in the router — no additional wiring needed.

---

## `.env.example` — Ensure these vars exist

```
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
# Callback URL must match what's set in your GitHub OAuth App settings:
# http://localhost:3001/auth/github/callback (dev)
# https://dojo.notdefined.dev/auth/github/callback (prod)
```

---

## GitHub OAuth App Settings

When setting up the GitHub OAuth App:
- **Homepage URL:** `https://dojo.notdefined.dev` (or `http://localhost:5173` for dev)
- **Callback URL:** `http://localhost:3001/auth/github/callback` (dev) — add a separate app or update for production
- **Scope requested:** none (empty scope = just identity — `login` and `id` are always available)

---

## Test: `src/infrastructure/http/routes/auth.test.ts`

Key scenarios:
- `GET /auth/github` redirects to `https://github.com/login/oauth/authorize`
- `GET /auth/github` sets `oauth_state` cookie
- `GET /auth/github/callback` with mismatched state returns 400
- `GET /auth/github/callback` with missing state returns 400

> Full callback flow requires GitHub API — mock `fetch` with `vi.spyOn(global, 'fetch')` returning a fixed user profile.

---

## Acceptance Criteria

- [ ] `GET /auth/github` returns a 302 redirect to `github.com/login/oauth/authorize`
- [ ] The redirect sets an `oauth_state` cookie (`HttpOnly`, `SameSite=Lax`)
- [ ] `GET /auth/github/callback` with a valid mock code creates a `user_sessions` row and sets a `session` cookie (`HttpOnly`, `SameSite=Strict`)
- [ ] `GET /auth/github/callback` with mismatched `state` returns 400
- [ ] An expired or invalid session cookie on a protected route returns 401
- [ ] A valid session cookie passes `requireAuth` and `c.get('user')` is set
- [ ] `pnpm --filter=@dojo/api db:migrate` applies the `user_sessions` migration
- [ ] `pnpm lint` and `pnpm typecheck` pass

## Out of Scope

- Logout route (`DELETE /auth/session` — trivial, add when needed)
- Session refresh / sliding expiration
- Drawhaus cross-service token passing (separate ADR)
- Admin-only routes (Phase 0 is single-user)
- `state` cookie stored in DB instead of a cookie (unnecessary complexity for Phase 0)
