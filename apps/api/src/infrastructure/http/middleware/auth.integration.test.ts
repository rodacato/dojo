import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq, inArray, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from '../../persistence/drizzle/schema'
import { issueSessionToken } from '../../auth/session-token'
import type { findActiveSession as FindActiveSession } from './auth'

const url = process.env['TEST_DATABASE_URL']
if (process.env['REQUIRE_DB_TESTS'] && !url) {
  throw new Error('REQUIRE_DB_TESTS is set but TEST_DATABASE_URL is not')
}

const { userSessions, users } = schema
const migrations = join(__dirname, '../../persistence/drizzle/migrations')
const BACKFILL = `encode(sha256(convert_to("id"::text, 'UTF8')), 'hex')`

describe.skipIf(!url)('session tokens against Postgres', () => {
  const client = postgres(url ?? '', { max: 2 })
  const db = drizzle(client, { schema })

  const userId = randomUUID()
  const legacyToken = randomUUID()
  const current = issueSessionToken()
  const expired = issueSessionToken()
  let findActiveSession: typeof FindActiveSession

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: migrations })
    await db.insert(users).values({ id: userId, githubId: `integration-${userId}`, username: `token-${userId.slice(0, 8)}`, avatarUrl: 'https://example.test/a.png' })
    const inAMonth = new Date(Date.now() + 30 * 86_400_000)
    await db.insert(userSessions).values([
      { id: legacyToken, userId, tokenHash: `pending-${legacyToken}`, expiresAt: inAMonth },
      { userId, tokenHash: current.tokenHash, expiresAt: inAMonth },
      { userId, tokenHash: expired.tokenHash, expiresAt: new Date(Date.now() - 1000) },
    ])
    await db.execute(sql.raw(`UPDATE "user_sessions" SET "token_hash" = ${BACKFILL} WHERE "id" = '${legacyToken}'`))
    process.env['DATABASE_URL'] = url
    findActiveSession = (await import('./auth')).findActiveSession
  })

  afterAll(async () => {
    await db.delete(userSessions).where(eq(userSessions.userId, userId))
    await db.delete(users).where(inArray(users.id, [userId]))
    await client.end()
  })

  it('backfills with the expression the migration ships', () => {
    const migration = readFileSync(join(migrations, '0032_session_token_hash.sql'), 'utf8')
    expect(migration).toContain(`SET "token_hash" = ${BACKFILL};`)
  })

  it('keeps a session issued before the migration, whose token was its uuid', async () => {
    expect((await findActiveSession(legacyToken))?.userId).toBe(userId)
  })

  it('finds a session by the token the browser holds', async () => {
    expect((await findActiveSession(current.token))?.userId).toBe(userId)
  })

  it('does not accept the stored hash as a token', async () => {
    expect(await findActiveSession(current.tokenHash)).toBeUndefined()
  })

  it('does not return an expired session', async () => {
    expect(await findActiveSession(expired.token)).toBeUndefined()
  })
})
