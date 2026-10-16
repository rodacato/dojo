import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { PostgresKataRepository } from './PostgresKataRepository'
import { katas, users, variations } from './drizzle/schema'
import type { DB } from './drizzle/client'
import { UserId } from '../../domain/shared/types'

// Runs the repository's raw SQL against a real Postgres: the unit tests mock
// db.execute, so type errors in the query (a fractional parameter typed as
// integer, an array sent as a list) only surface here.
//
// Opt-in with TEST_DATABASE_URL, a database this suite may write to (it adds
// and removes its own rows). CI sets REQUIRE_DB_TESTS so a missing database
// fails loudly instead of skipping.
const url = process.env['TEST_DATABASE_URL']
if (process.env['REQUIRE_DB_TESTS'] && !url) {
  throw new Error('REQUIRE_DB_TESTS is set but TEST_DATABASE_URL is not')
}

describe.skipIf(!url)('PostgresKataRepository.findEligible against Postgres', () => {
  const client = postgres(url ?? '', { max: 2 })
  const db = drizzle(client)
  const repo = new PostgresKataRepository(db as unknown as DB)

  const creatorId = randomUUID()
  const seeded = [
    { id: randomUUID(), category: 'backend', difficulty: 'hard', duration: 30 },
    { id: randomUUID(), category: 'frontend', difficulty: 'easy', duration: 15 },
    { id: randomUUID(), category: 'security', difficulty: 'medium', duration: 20 },
  ]
  const learner = UserId(randomUUID())

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: join(__dirname, 'drizzle/migrations') })

    await db.insert(users).values({
      id: creatorId,
      githubId: `integration-${creatorId}`,
      username: 'integration-creator',
      avatarUrl: 'https://example.test/a.png',
    })
    await db.insert(katas).values(
      seeded.map((k) => ({
        id: k.id,
        title: `integration ${k.category}`,
        description: 'integration fixture',
        duration: k.duration,
        difficulty: k.difficulty,
        category: k.category,
        type: 'code',
        status: 'published',
        ownerRole: 'role',
        ownerContext: 'context',
        createdBy: creatorId,
      })),
    )
    await db.insert(variations).values(
      seeded.map((k) => ({ id: randomUUID(), kataId: k.id, ownerRole: 'role', ownerContext: 'context' })),
    )
  })

  afterAll(async () => {
    const ids = seeded.map((k) => k.id)
    await db.delete(variations).where(inArray(variations.kataId, ids))
    await db.delete(katas).where(inArray(katas.id, ids))
    await db.delete(users).where(inArray(users.id, [creatorId]))
    await client.end()
  })

  // The ids this suite seeded, in the order the query returned them.
  async function seededPicks(filters: Parameters<typeof repo.findEligible>[1]) {
    const picks = await repo.findEligible(learner, filters)
    return picks.filter((k) => seeded.some((s) => s.id === k.id))
  }

  it.each([
    { userLevel: 'junior', randomness: 0.25 },
    { userLevel: 'mid', randomness: 0.75 },
    { userLevel: 'senior', randomness: 0.3 },
    { userLevel: 'mid', randomness: 0 },
    { userLevel: 'mid', randomness: 1 },
    { userLevel: 'mid', randomness: 0.75, maxDuration: 30 },
    { userLevel: 'mid', randomness: 0.75, interests: ['backend', 'frontend'] },
    { interests: ['security'], randomness: 0.5, maxDuration: 20 },
  ] as const)('runs with preferences %j', async (filters) => {
    await expect(repo.findEligible(learner, filters as never)).resolves.toBeInstanceOf(Array)
  })

  it('puts a kata in the learner’s interests first when randomness is zero', async () => {
    const picks = await seededPicks({ interests: ['frontend'], randomness: 0 })

    expect(picks[0]?.category).toBe('frontend')
  })

  it('applies the duration cap', async () => {
    const picks = await seededPicks({ maxDuration: 20 })

    expect(picks.map((k) => k.category).sort()).toEqual(['frontend', 'security'])
  })
})
