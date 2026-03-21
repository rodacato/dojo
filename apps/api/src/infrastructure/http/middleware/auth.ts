import { and, eq, gt } from 'drizzle-orm'
import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { config } from '../../../config'
import { db } from '../../persistence/drizzle/client'
import { userSessions } from '../../persistence/drizzle/schema'
import type { AppEnv } from '../app-env'

export async function requireAuth(c: Context<AppEnv>, next: Next): Promise<void> {
  const sessionId = getCookie(c, 'dojo_session')

  if (!sessionId) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }

  const session = await db.query.userSessions.findFirst({
    where: and(eq(userSessions.id, sessionId), gt(userSessions.expiresAt, new Date())),
    with: { user: true },
  })

  if (!session) {
    throw new HTTPException(401, { message: 'Session expired or invalid' })
  }

  c.set('user', session.user)
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
