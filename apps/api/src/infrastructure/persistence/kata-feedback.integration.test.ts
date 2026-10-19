import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { kataFeedback, katas, sessions, users, variations } from './drizzle/schema'
import { saveKataFeedback } from './kata-feedback'

// Opt-in with TEST_DATABASE_URL, like the repository integration tests.
const url = process.env['TEST_DATABASE_URL']
if (process.env['REQUIRE_DB_TESTS'] && !url) {
  throw new Error('REQUIRE_DB_TESTS is set but TEST_DATABASE_URL is not')
}

describe.skipIf(!url)('saveKataFeedback against Postgres', () => {
  const client = postgres(url ?? '', { max: 2 })
  const db = drizzle(client)
  const userId = randomUUID()
  const kataId = randomUUID()
  const variationId = randomUUID()
  const sessionIds: string[] = []

  async function newSession() {
    const id = randomUUID()
    sessionIds.push(id)
    await db.insert(sessions).values({ id, userId, kataId, variationId, body: 'b', status: 'completed' })
    return { sessionId: id, kataId, variationId, userId }
  }

  async function rowFor(sessionId: string) {
    return db.select().from(kataFeedback).where(eq(kataFeedback.sessionId, sessionId))
  }

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: join(__dirname, 'drizzle/migrations') })
    await db.insert(users).values({ id: userId, githubId: `feedback-${userId}`, username: 'feedback-test', avatarUrl: 'https://example.test/a.png' })
    await db.insert(katas).values({
      id: kataId, title: 'feedback fixture', description: 'd', duration: 5, difficulty: 'easy', category: 'debugging',
      type: 'review', language: [], status: 'draft', ownerRole: 'r', ownerContext: 'c', createdBy: userId,
    })
    await db.insert(variations).values({ id: variationId, kataId, ownerRole: 'r', ownerContext: 'c' })
  })

  afterAll(async () => {
    for (const id of sessionIds) {
      await db.delete(kataFeedback).where(eq(kataFeedback.sessionId, id))
      await db.delete(sessions).where(eq(sessions.id, id))
    }
    await db.delete(variations).where(eq(variations.id, variationId))
    await db.delete(katas).where(eq(katas.id, kataId))
    await db.delete(users).where(eq(users.id, userId))
    await client.end()
  })

  it('keeps every vote when each arrives on its own tap, in one row', async () => {
    const owner = await newSession()

    await saveKataFeedback(db, owner, { timing: 'about_right' })
    await saveKataFeedback(db, owner, { evaluation: 'too_generic' })
    await saveKataFeedback(db, owner, { note: 'shorter code next time' })

    const rows = await rowFor(owner.sessionId)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ timing: 'about_right', evaluation: 'too_generic', note: 'shorter code next time', clarity: null })
  })

  it('lets the learner change a vote', async () => {
    const owner = await newSession()

    await saveKataFeedback(db, owner, { timing: 'too_long' })
    await saveKataFeedback(db, owner, { timing: 'about_right' })

    expect((await rowFor(owner.sessionId))[0]?.timing).toBe('about_right')
  })
})
