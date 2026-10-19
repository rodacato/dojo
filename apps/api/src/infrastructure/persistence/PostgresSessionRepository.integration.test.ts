import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { PostgresSessionRepository } from './PostgresSessionRepository'
import * as schema from './drizzle/schema'
import { katas, sessions, users, variations } from './drizzle/schema'
import { SessionId } from '../../domain/shared/types'

// Opt-in with TEST_DATABASE_URL, like PostgresKataRepository.integration.test.ts.
const url = process.env['TEST_DATABASE_URL']
if (process.env['REQUIRE_DB_TESTS'] && !url) {
  throw new Error('REQUIRE_DB_TESTS is set but TEST_DATABASE_URL is not')
}

describe.skipIf(!url)('PostgresSessionRepository.activate against Postgres', () => {
  const client = postgres(url ?? '', { max: 2 })
  const db = drizzle(client, { schema })
  const repo = new PostgresSessionRepository(db)

  const userId = randomUUID()
  const kataId = randomUUID()
  const variationId = randomUUID()
  const sessionId = randomUUID()
  const createdAt = new Date(Date.now() - 120_000)

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: join(__dirname, 'drizzle/migrations') })

    await db.insert(users).values({
      id: userId,
      githubId: `integration-${userId}`,
      username: 'integration-learner',
      avatarUrl: 'https://example.test/a.png',
    })
    await db.insert(katas).values({
      id: kataId,
      title: 'integration kata',
      description: 'integration fixture',
      duration: 5,
      difficulty: 'easy',
      category: 'backend',
      type: 'code',
      status: 'published',
      ownerRole: 'role',
      ownerContext: 'context',
      createdBy: userId,
    })
    await db.insert(variations).values({ id: variationId, kataId, ownerRole: 'role', ownerContext: 'context' })
    await db.insert(sessions).values({
      id: sessionId,
      userId,
      kataId,
      variationId,
      body: '',
      status: 'preparing',
      startedAt: createdAt,
    })
  })

  afterAll(async () => {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
    await db.delete(variations).where(eq(variations.id, variationId))
    await db.delete(katas).where(eq(katas.id, kataId))
    await db.delete(users).where(eq(users.id, userId))
    await client.end()
  })

  it('starts the clock when the body is ready, not when the session was created', async () => {
    const beforeActivation = Date.now()
    await repo.activate(SessionId(sessionId), 'the prepared body')

    const session = await repo.findById(SessionId(sessionId))

    expect(session?.status).toBe('active')
    expect(session?.body).toBe('the prepared body')
    expect(session?.startedAt.getTime()).toBeGreaterThanOrEqual(beforeActivation - 1_000)
    expect(session?.isExpired(1)).toBe(false)
  })
})
