import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { PostgresKataRepository } from './PostgresKataRepository'
import { katas, sessions, users, variations } from './drizzle/schema'
import type { DB } from './drizzle/client'
import { KataId, UserId } from '../../domain/shared/types'

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
    { id: randomUUID(), category: 'backend', difficulty: 'hard', duration: 30, language: ['go', 'sql'] },
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
        language: k.language ?? [],
        status: 'published',
        ownerRole: 'role',
        ownerContext: 'context',
        createdBy: creatorId,
      })),
    )
    // The frontend kata has three variations, so a limit on joined rows would let it fill every slot.
    await db.insert(variations).values(
      [...seeded, seeded[1]!, seeded[1]!].map((k) => ({ id: randomUUID(), kataId: k.id, ownerRole: 'role', ownerContext: 'context' })),
    )
  })

  afterAll(async () => {
    const ids = seeded.map((k) => k.id)
    await db.delete(sessions).where(inArray(sessions.kataId, ids))
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

  it('offers three different kata even when one has several variations', async () => {
    const picks = await seededPicks({ type: 'code' })

    expect(new Set(picks.map((k) => k.id)).size).toBe(3)
    expect(picks.find((k) => k.category === 'frontend')?.variations).toHaveLength(3)
  })

  it('leaves out the kata it is asked to exclude', async () => {
    const picks = await seededPicks({ excludeKataId: KataId(seeded[1]!.id) })

    expect(picks.map((k) => k.category).sort()).toEqual(['backend', 'security'])
  })

  it('fills the three slots with kata practiced recently, after the fresh ones', async () => {
    const regular = UserId(randomUUID())
    await db.insert(users).values({ id: regular, githubId: `integration-${regular}`, username: `integration-${regular.slice(0, 8)}`, avatarUrl: 'https://example.test/a.png' })
    const practiced = [seeded[0]!, seeded[2]!]
    const variationIds = await db.select({ id: variations.id, kataId: variations.kataId }).from(variations).where(inArray(variations.kataId, practiced.map((k) => k.id)))
    await db.insert(sessions).values(
      practiced.map((k) => ({ id: randomUUID(), userId: regular, kataId: k.id, variationId: variationIds.find((v) => v.kataId === k.id)!.id, body: 'b', status: 'completed', startedAt: new Date() })),
    )

    // Five draws, so a random order passing by luck is a 1 in 243 chance.
    for (let draw = 0; draw < 5; draw++) {
      const picks = (await repo.findEligible(regular, { type: 'code' })).filter((k) => seeded.some((s) => s.id === k.id))
      expect(picks).toHaveLength(3)
      expect(picks[0]?.category).toBe('frontend')
    }
    await db.delete(sessions).where(inArray(sessions.userId, [regular]))
    await db.delete(users).where(inArray(users.id, [regular]))
  })

  it('keeps only kata of the asked type', async () => {
    expect(await seededPicks({ type: 'chat' })).toEqual([])
    expect(await seededPicks({ type: 'code' })).toHaveLength(3)
  })

  it('keeps only kata that list the asked language', async () => {
    const picks = await seededPicks({ language: 'sql' })

    expect(picks.map((k) => k.category)).toEqual(['backend'])
  })
})

describe.skipIf(!url)('PostgresKataRepository.findDailyCandidates against Postgres', () => {
  const client = postgres(url ?? '', { max: 2 })
  const db = drizzle(client)
  const repo = new PostgresKataRepository(db as unknown as DB)

  const creatorId = randomUUID()
  const learner = randomUUID()
  const otherLearner = randomUUID()
  const micro = { id: randomUUID(), duration: 5, status: 'published' }
  const dailyMicro = { id: randomUUID(), duration: 5, status: 'published' }
  const long = { id: randomUUID(), duration: 15, status: 'published' }
  const draft = { id: randomUUID(), duration: 5, status: 'draft' }
  const practicedAt = new Date('2026-10-18T09:00:00Z')
  const todayStart = new Date(Date.now() - 60 * 60 * 1000)
  const fixtures = [micro, dailyMicro, long, draft]

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: join(__dirname, 'drizzle/migrations') })
    await db.insert(users).values(
      [creatorId, learner, otherLearner].map((id) => ({
        id,
        githubId: `integration-${id}`,
        username: `integration-${id.slice(0, 8)}`,
        avatarUrl: 'https://example.test/a.png',
      })),
    )
    await db.insert(katas).values(
      fixtures.map((k) => ({
        id: k.id,
        title: 'integration daily',
        description: 'integration fixture',
        duration: k.duration,
        difficulty: 'easy',
        category: 'debugging',
        type: 'review',
        status: k.status,
        ownerRole: 'role',
        ownerContext: 'context',
        createdBy: creatorId,
      })),
    )
    const variationRows = fixtures.map((k) => ({ id: randomUUID(), kataId: k.id, ownerRole: 'role', ownerContext: 'context' }))
    await db.insert(variations).values(variationRows)
    const [microVariation, dailyVariation] = variationRows.map((v) => v.id)
    await db.insert(sessions).values([
      { id: randomUUID(), userId: learner, kataId: micro.id, variationId: microVariation!, body: 'b', status: 'completed', startedAt: practicedAt },
      { id: randomUUID(), userId: learner, kataId: micro.id, variationId: microVariation!, body: 'b', status: 'completed', startedAt: new Date() },
      { id: randomUUID(), userId: learner, kataId: dailyMicro.id, variationId: dailyVariation!, body: 'b', status: 'completed', isDaily: true, startedAt: new Date() },
      { id: randomUUID(), userId: otherLearner, kataId: micro.id, variationId: microVariation!, body: 'b', status: 'completed', isDaily: true, startedAt: new Date() },
    ])
  })

  afterAll(async () => {
    const kataIds = fixtures.map((k) => k.id)
    await db.delete(sessions).where(inArray(sessions.kataId, kataIds))
    await db.delete(variations).where(inArray(variations.kataId, kataIds))
    await db.delete(katas).where(inArray(katas.id, kataIds))
    await db.delete(users).where(inArray(users.id, [creatorId, learner, otherLearner]))
    await client.end()
  })

  it('lists published micro kata with when this learner last practiced each, before today too', async () => {
    const { candidates } = await repo.findDailyCandidates(UserId(learner), todayStart)
    const ours = candidates.filter((c) => fixtures.some((k) => k.id === c.kataId))

    expect(ours.map((c) => c.kataId).sort()).toEqual([micro.id, dailyMicro.id].sort())
    const practiced = ours.find((c) => c.kataId === micro.id)!
    expect(practiced.lastPracticedAt!.getTime()).toBeGreaterThanOrEqual(todayStart.getTime())
    expect(practiced.lastPracticedBeforeToday).toEqual(practicedAt)
    expect(ours.find((c) => c.kataId === dailyMicro.id)!.lastPracticedBeforeToday).toBeNull()
  })

  it('names today\'s daily kata from this learner\'s daily sessions only', async () => {
    expect((await repo.findDailyCandidates(UserId(learner), todayStart)).todaysDailyKataId).toBe(dailyMicro.id)
    expect((await repo.findDailyCandidates(UserId(randomUUID()), todayStart)).todaysDailyKataId).toBeNull()
  })
})
