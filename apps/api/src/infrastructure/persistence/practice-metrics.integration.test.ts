import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { loadPracticeMetrics } from './practice-metrics'
import * as schema from './drizzle/schema'
import { attempts, katas, sessions, users, variations } from './drizzle/schema'

const url = process.env['TEST_DATABASE_URL']
if (process.env['REQUIRE_DB_TESTS'] && !url) {
  throw new Error('REQUIRE_DB_TESTS is set but TEST_DATABASE_URL is not')
}

const day = (n: number) => new Date(Date.UTC(2026, 0, n, 12))
const minutesAfter = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60 * 1000)
const evaluation = (verdict: string) => JSON.stringify({ verdict, analysis: '', topicsToReview: [] })

describe.skipIf(!url)('practice metrics against Postgres', () => {
  const client = postgres(url ?? '', { max: 4 })
  const db = drizzle(client, { schema })

  const userId = randomUUID()
  const otherUserId = randomUUID()
  const codeKataId = randomUUID()
  const reviewKataId = randomUUID()
  const variationId = randomUUID()
  const reviewVariationId = randomUUID()
  const passedLastMonth = randomUUID()
  const needsWorkThisWeek = randomUUID()
  const passedThisWeek = randomUUID()
  const timedOut = randomUUID()
  const streamBroke = randomUUID()
  const someoneElse = randomUUID()
  const sessionIds = [passedLastMonth, needsWorkThisWeek, passedThisWeek, timedOut, streamBroke, someoneElse]
  const weekStart = day(20)

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: join(__dirname, 'drizzle/migrations') })
    await db.insert(users).values([userId, otherUserId].map((id) => ({
      id,
      githubId: `integration-${id}`,
      username: `metrics-${id.slice(0, 8)}`,
      avatarUrl: 'https://example.test/a.png',
    })))
    const kata = (id: string, type: string) => ({
      id,
      title: 'integration kata',
      description: 'integration fixture',
      duration: 5,
      difficulty: 'hard',
      category: 'backend',
      type,
      status: 'published',
      ownerRole: 'role',
      ownerContext: 'context',
      createdBy: userId,
      topics: ['indexes'],
    })
    await db.insert(katas).values([kata(codeKataId, 'code'), kata(reviewKataId, 'review')])
    await db.insert(variations).values([
      { id: variationId, kataId: codeKataId, ownerRole: 'role', ownerContext: 'context' },
      { id: reviewVariationId, kataId: reviewKataId, ownerRole: 'role', ownerContext: 'context' },
    ])

    const session = (id: string, status: string, startedAt: Date, minutes: number, onReview = false, owner = userId) => ({
      id,
      userId: owner,
      kataId: onReview ? reviewKataId : codeKataId,
      variationId: onReview ? reviewVariationId : variationId,
      body: '',
      status,
      startedAt,
      completedAt: minutesAfter(startedAt, minutes),
    })
    await db.insert(sessions).values([
      session(passedLastMonth, 'completed', day(1), 4),
      session(needsWorkThisWeek, 'failed', day(21), 8, true),
      session(passedThisWeek, 'completed', day(22), 6),
      session(timedOut, 'failed', day(23), 5),
      session(streamBroke, 'failed', day(24), 5),
      session(someoneElse, 'failed', day(21), 5, false, otherUserId),
    ])
    const attempt = (sessionId: string, llmResponse: string, isFinalEvaluation = true) => ({
      id: randomUUID(),
      sessionId,
      userResponse: 'answer',
      llmResponse,
      isFinalEvaluation,
    })
    await db.insert(attempts).values([
      attempt(passedLastMonth, evaluation('passed')),
      attempt(needsWorkThisWeek, evaluation('needs_work')),
      attempt(passedThisWeek, evaluation('passed')),
      attempt(streamBroke, 'partial stream', false),
    ])
  })

  afterAll(async () => {
    await db.delete(attempts).where(inArray(attempts.sessionId, sessionIds))
    await db.delete(sessions).where(inArray(sessions.id, sessionIds))
    await db.delete(variations).where(inArray(variations.id, [variationId, reviewVariationId]))
    await db.delete(katas).where(inArray(katas.id, [codeKataId, reviewKataId]))
    await db.delete(users).where(eq(users.id, userId))
    await db.delete(users).where(eq(users.id, otherUserId))
    await client.end()
  })

  it('counts every verdict as practice', async () => {
    const metrics = await loadPracticeMetrics(db, userId, weekStart)

    expect(metrics.total).toBe(3)
    expect(metrics.typeCounts).toEqual(expect.arrayContaining([
      { type: 'code', count: 2 },
      { type: 'review', count: 1 },
    ]))
  })

  it('counts NEEDS WORK toward the weekly goal, from the start of the week only', async () => {
    const metrics = await loadPracticeMetrics(db, userId, weekStart)

    expect(metrics.weekly).toBe(2)
  })

  it('does not count NEEDS WORK as a timeout', async () => {
    const metrics = await loadPracticeMetrics(db, userId, weekStart)

    expect(metrics.timedOut).toBe(2)
  })

  it('averages the time of every practiced session and nothing else', async () => {
    const metrics = await loadPracticeMetrics(db, userId, weekStart)

    expect(metrics.avgTimeMinutes).toBe(6)
  })

  it('reports nothing for a learner with no sessions', async () => {
    const metrics = await loadPracticeMetrics(db, randomUUID(), weekStart)

    expect(metrics).toEqual({ total: 0, weekly: 0, avgTimeMinutes: 0, typeCounts: [], timedOut: 0 })
  })
})
