import { and, eq, gt } from 'drizzle-orm'
import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { db } from '../../persistence/drizzle/client'
import { userSessions } from '../../persistence/drizzle/schema'

export async function requireAuth(c: Context, next: Next): Promise<void> {
  const sessionId = getCookie(c, 'session')

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
