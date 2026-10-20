import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { PostgresSessionRepository } from './PostgresSessionRepository'
import * as schema from './drizzle/schema'
import { attempts, katas, sessions, users, variations } from './drizzle/schema'
import { UserId } from '../../domain/shared/types'

const url = process.env['TEST_DATABASE_URL']
if (process.env['REQUIRE_DB_TESTS'] && !url) {
  throw new Error('REQUIRE_DB_TESTS is set but TEST_DATABASE_URL is not')
}

const day = (n: number) => new Date(Date.UTC(2026, 0, n, 12))
const evaluation = (verdict: string) => JSON.stringify({ verdict, analysis: '', topicsToReview: [] })

describe.skipIf(!url)('eligible practice against Postgres', () => {
  const client = postgres(url ?? '', { max: 2 })
  const db = drizzle(client, { schema })
  const repo = new PostgresSessionRepository(db)

  const userId = randomUUID()
  const kataId = randomUUID()
  const variationId = randomUUID()
  const passed = randomUUID()
  const needsWork = randomUUID()
  const timedOut = randomUUID()
  const streamBroke = randomUUID()
  const sessionIds = [passed, needsWork, timedOut, streamBroke]

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: join(__dirname, 'drizzle/migrations') })
    await db.insert(users).values({
      id: userId,
      githubId: `integration-${userId}`,
      username: `eligible-${userId.slice(0, 8)}`,
      avatarUrl: 'https://example.test/a.png',
    })
    await db.insert(katas).values({
      id: kataId,
      title: 'integration kata',
      description: 'integration fixture',
      duration: 5,
      difficulty: 'hard',
      category: 'backend',
      type: 'review',
      status: 'published',
      ownerRole: 'role',
      ownerContext: 'context',
      createdBy: userId,
      topics: ['indexes'],
    })
    await db.insert(variations).values({ id: variationId, kataId, ownerRole: 'role', ownerContext: 'context' })

    const session = (id: string, status: string, startedAt: Date) => ({ id, userId, kataId, variationId, body: '', status, startedAt })
    await db.insert(sessions).values([
      session(passed, 'completed', day(1)),
      session(needsWork, 'failed', day(2)),
      session(timedOut, 'failed', day(3)),
      session(streamBroke, 'active', day(4)),
    ])
    await db.insert(attempts).values([
      { id: randomUUID(), sessionId: passed, userResponse: 'a', llmResponse: evaluation('passed'), isFinalEvaluation: true },
      { id: randomUUID(), sessionId: needsWork, userResponse: 'b', llmResponse: evaluation('needs_work'), isFinalEvaluation: true },
      { id: randomUUID(), sessionId: streamBroke, userResponse: 'c', llmResponse: 'partial stream', isFinalEvaluation: false },
    ])
  })

  afterAll(async () => {
    await db.delete(attempts).where(inArray(attempts.sessionId, sessionIds))
    await db.delete(sessions).where(inArray(sessions.id, sessionIds))
    await db.delete(variations).where(eq(variations.id, variationId))
    await db.delete(katas).where(eq(katas.id, kataId))
    await db.delete(users).where(eq(users.id, userId))
    await client.end()
  })

  it('counts a NEEDS WORK session toward the belt history', async () => {
    const history = await repo.listPracticeHistory(UserId(userId))

    expect(history.map((entry) => entry.startedAt)).toEqual([day(1), day(2)])
    expect(history[1]!.topics).toEqual(['indexes'])
  })

  it('never counts a session that ended without a final evaluation', async () => {
    const history = await repo.listPracticeHistory(UserId(userId))

    expect(history.map((entry) => entry.startedAt)).not.toContainEqual(day(3))
    expect(history.map((entry) => entry.startedAt)).not.toContainEqual(day(4))
  })
})
