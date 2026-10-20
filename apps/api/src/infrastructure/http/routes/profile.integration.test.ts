import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from '../../persistence/drizzle/schema'

const url = process.env['TEST_DATABASE_URL']
if (process.env['REQUIRE_DB_TESTS'] && !url) {
  throw new Error('REQUIRE_DB_TESTS is set but TEST_DATABASE_URL is not')
}

const { attempts, katas, sessions, userMilestones, users, variations } = schema
const evaluation = (verdict: string) => JSON.stringify({ verdict, analysis: '', topicsToReview: [] })

describe.skipIf(!url)('GET /u/:username against Postgres', () => {
  const client = postgres(url ?? '', { max: 2 })
  const db = drizzle(client, { schema })

  const userId = randomUUID()
  const username = `profile-${userId.slice(0, 8)}`
  const kataId = randomUUID()
  const variationId = randomUUID()
  const verdicts = ['passed', 'passed_with_notes', 'needs_work', 'needs_work']
  const evaluatedIds = verdicts.map(() => randomUUID())
  const timedOutId = randomUUID()
  const sessionIds = [...evaluatedIds, timedOutId]

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: join(__dirname, '../../persistence/drizzle/migrations') })
    await db.insert(users).values({ id: userId, githubId: `integration-${userId}`, username, avatarUrl: 'https://example.test/a.png' })
    await db.insert(katas).values({
      id: kataId, title: 'integration kata', description: 'fixture', duration: 5, difficulty: 'easy', category: 'backend',
      type: 'review', status: 'published', ownerRole: 'role', ownerContext: 'context', createdBy: userId, topics: ['indexes'],
    })
    await db.insert(variations).values({ id: variationId, kataId, ownerRole: 'role', ownerContext: 'context' })
    const now = Date.now()
    await db.insert(sessions).values(sessionIds.map((id, i) => ({
      id, userId, kataId, variationId, body: '',
      status: verdicts[i] === undefined || verdicts[i] === 'needs_work' ? 'failed' : 'completed',
      startedAt: new Date(now - i * 60_000),
      completedAt: new Date(now - i * 60_000 + 30_000),
    })))
    await db.insert(attempts).values(evaluatedIds.map((sessionId, i) => ({
      id: randomUUID(), sessionId, userResponse: 'r', llmResponse: evaluation(verdicts[i]!), isFinalEvaluation: true,
    })))
    await db.insert(userMilestones).values({ userId, milestoneSlug: 'FIRST_KATA', sessionId: evaluatedIds[0]! })
  })

  afterAll(async () => {
    await db.delete(userMilestones).where(eq(userMilestones.userId, userId))
    await db.delete(attempts).where(inArray(attempts.sessionId, sessionIds))
    await db.delete(sessions).where(inArray(sessions.id, sessionIds))
    await db.delete(variations).where(eq(variations.id, variationId))
    await db.delete(katas).where(eq(katas.id, kataId))
    await db.delete(users).where(eq(users.id, userId))
    await client.end()
  })

  async function fetchProfile() {
    process.env['DATABASE_URL'] = url
    const { profileRoutes } = await import('./profile')
    const res = await profileRoutes.request(`/u/${username}`)
    expect(res.status).toBe(200)
    return (await res.json()) as {
      stats: { totalKata: number; passRate: number }
      heatmapData: Array<{ count: number }>
      recentSessions: Array<{ id: string }>
      milestones: Array<{ slug: string }>
    }
  }

  it('counts every evaluated session, any verdict, and passes over that total', async () => {
    const profile = await fetchProfile()

    expect(profile.stats.totalKata).toBe(4)
    expect(profile.stats.passRate).toBe(50)
    expect(profile.milestones.map((m) => m.slug)).toEqual(['FIRST_KATA'])
  })

  it('leaves out a session that timed out without an evaluation', async () => {
    const profile = await fetchProfile()

    expect(profile.recentSessions.map((s) => s.id)).not.toContain(timedOutId)
    expect(profile.heatmapData.reduce((sum, d) => sum + d.count, 0)).toBe(4)
  })
})
