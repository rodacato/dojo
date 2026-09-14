import { and, eq, gt } from 'drizzle-orm'
import type { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { config } from '../../../config'
import { db } from '../../persistence/drizzle/client'
import { userSessions } from '../../persistence/drizzle/schema'
import type { AppEnv } from '../app-env'

const sessionIdSchema = z.uuid()

// user_sessions.id is a uuid column: a malformed token must be rejected here,
// or Postgres fails the cast and the request surfaces as a 500.
export function isSessionId(token: string): boolean {
  return sessionIdSchema.safeParse(token).success
}

export async function findActiveSession(token: string) {
  if (!isSessionId(token)) return undefined
  return db.query.userSessions.findFirst({
    where: and(eq(userSessions.id, token), gt(userSessions.expiresAt, new Date())),
    with: { user: true },
  })
}

export async function requireAuth(c: Context<AppEnv>, next: Next): Promise<void> {
  const authHeader = c.req.header('Authorization')
  const sessionId = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!sessionId) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }

  const session = await findActiveSession(sessionId)

  if (!session) {
    throw new HTTPException(401, { message: 'Session expired or invalid' })
  }

  c.set('user', session.user)
  await next()
}

export async function optionalAuth(c: Context<AppEnv>, next: Next): Promise<void> {
  const authHeader = c.req.header('Authorization')
  const sessionId = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (sessionId) {
    const session = await findActiveSession(sessionId)
    if (session) {
      c.set('user', session.user)
    }
  }

  await next()
}

export async function requireCreator(c: Context<AppEnv>, next: Next): Promise<void> {
  const user = c.get('user') as { githubId: string } | undefined
  if (!user) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }
  if (!config.CREATOR_GITHUB_ID || user.githubId !== config.CREATOR_GITHUB_ID) {
    throw new HTTPException(403, { message: 'Forbidden' })
  }
  await next()
}
