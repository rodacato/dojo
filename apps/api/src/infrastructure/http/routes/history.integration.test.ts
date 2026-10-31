import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import type { HistoryOutcomeFilter, HistoryPageDTO } from '@dojo/shared'
import * as schema from '../../persistence/drizzle/schema'
import type { dashboardRoutes } from './dashboard'

const url = process.env['TEST_DATABASE_URL']
if (process.env['REQUIRE_DB_TESTS'] && !url) {
  throw new Error('REQUIRE_DB_TESTS is set but TEST_DATABASE_URL is not')
}

const { attempts, katas, sessions, userSessions, users, variations } = schema
const evaluation = (verdict: string) => JSON.stringify({ verdict, analysis: '', topicsToReview: [] })
const day = (n: number) => new Date(Date.UTC(2026, 0, n, 12))

describe.skipIf(!url)('GET /history against Postgres', () => {
  const client = postgres(url ?? '', { max: 2 })
  const db = drizzle(client, { schema })

  const learner = randomUUID()
  const stranger = randomUUID()
  const token = randomUUID()
  const variationId = randomUUID()
  const cacheKata = randomUUID()
  const literalKata = randomUUID()
  const slashKata = randomUUID()
  const kataIds = [cacheKata, literalKata, slashKata]
  let routes: typeof dashboardRoutes

  const passed = randomUUID()
  const withNotes = randomUUID()
  const needsWork = randomUUID()
  const timedOut = randomUUID()
  const evaluationBroke = randomUUID()
  const closedWithoutVerdict = randomUUID()
  const running = randomUUID()
  const strangers = randomUUID()
  const sessionIds = [passed, withNotes, needsWork, timedOut, evaluationBroke, closedWithoutVerdict, running, strangers]

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: join(__dirname, '../../persistence/drizzle/migrations') })
    await db.insert(users).values([learner, stranger].map((id) => ({
      id, githubId: `integration-${id}`, username: `history-${id.slice(0, 8)}`, avatarUrl: 'https://example.test/a.png',
    })))
    await db.insert(userSessions).values({ id: token, userId: learner, expiresAt: new Date(Date.now() + 3_600_000) })
    const kata = (id: string, title: string) => ({
      id, title, description: 'fixture', duration: 5, difficulty: 'easy', category: 'backend',
      type: 'review', status: 'published', ownerRole: 'role', ownerContext: 'context', createdBy: learner,
    })
    await db.insert(katas).values([
      kata(cacheKata, 'Cache invalidation'),
      kata(literalKata, '100% of user_ids'),
      kata(slashKata, 'Back\\slash paths'),
    ])
    await db.insert(variations).values({ id: variationId, kataId: cacheKata, ownerRole: 'role', ownerContext: 'context' })
    const session = (id: string, kataId: string, status: string, n: number, userId = learner) => ({
      id, userId, kataId, variationId, body: '', status, startedAt: day(n),
    })
    await db.insert(sessions).values([
      session(passed, cacheKata, 'completed', 1),
      session(withNotes, cacheKata, 'completed', 2),
      session(needsWork, literalKata, 'failed', 3),
      session(timedOut, slashKata, 'failed', 4),
      session(evaluationBroke, cacheKata, 'failed', 5),
      session(closedWithoutVerdict, cacheKata, 'completed', 6),
      session(running, cacheKata, 'active', 7),
      session(strangers, cacheKata, 'completed', 8, stranger),
    ])
    const attempt = (sessionId: string, llmResponse: string, isFinalEvaluation = true) => ({
      id: randomUUID(), sessionId, userResponse: 'answer', llmResponse, isFinalEvaluation,
    })
    await db.insert(attempts).values([
      attempt(passed, evaluation('passed')),
      attempt(withNotes, evaluation('passed_with_notes')),
      attempt(needsWork, evaluation('needs_work')),
      attempt(evaluationBroke, 'partial stream', false),
      attempt(strangers, evaluation('passed')),
    ])
    process.env['DATABASE_URL'] = url
    routes = (await import('./dashboard')).dashboardRoutes
  }, 60_000)

  afterAll(async () => {
    await db.delete(attempts).where(inArray(attempts.sessionId, sessionIds))
    await db.delete(sessions).where(inArray(sessions.id, sessionIds))
    await db.delete(variations).where(eq(variations.id, variationId))
    await db.delete(katas).where(inArray(katas.id, kataIds))
    await db.delete(userSessions).where(eq(userSessions.id, token))
    await db.delete(users).where(inArray(users.id, [learner, stranger]))
    await client.end()
  })

  const request = (query: Record<string, string> = {}, headers: Record<string, string> = { Authorization: `Bearer ${token}` }) =>
    routes.request(`/history?${new URLSearchParams(query)}`, { headers })
  const page = async (query: Record<string, string> = {}) => (await (await request(query)).json()) as HistoryPageDTO

  it('derives each outcome, newest first, from the learner\'s closed sessions only', async () => {
    const body = await page()

    expect(body.sessions.map((s) => [s.id, s.outcome])).toEqual([
      [closedWithoutVerdict, 'no_evaluation'],
      [evaluationBroke, 'no_evaluation'],
      [timedOut, 'expired'],
      [needsWork, 'needs_work'],
      [withNotes, 'passed_with_notes'],
      [passed, 'passed'],
    ])
    expect(body).toMatchObject({ total: 6, recordTotal: 6, page: 1, totalPages: 1 })
  })

  it.each<[HistoryOutcomeFilter, string[]]>([
    ['passed', [passed]],
    ['passed_with_notes', [withNotes]],
    ['needs_work', [needsWork]],
    ['expired', [timedOut]],
    ['no_evaluation', [closedWithoutVerdict, evaluationBroke]],
  ])('filters by the %s outcome and keeps the record total', async (outcome, ids) => {
    const body = await page({ outcome })

    expect(body.sessions.map((s) => s.id)).toEqual(ids)
    expect(body).toMatchObject({ total: ids.length, recordTotal: 6 })
  })

  it('matches titles case-insensitively after trimming', async () => {
    const body = await page({ q: '  cache INVAL ' })

    expect(body.total).toBe(4)
    expect(body.sessions.every((s) => s.kataTitle === 'Cache invalidation')).toBe(true)
  })

  it.each([
    ['%', '100% of user_ids'],
    ['_', '100% of user_ids'],
    ['\\', 'Back\\slash paths'],
  ])('treats %s as a literal character', async (q, title) => {
    const body = await page({ q })

    expect(body.sessions.map((s) => s.kataTitle)).toEqual([title])
  })

  it('combines search and outcome before paginating', async () => {
    const first = await page({ q: 'cache', outcome: 'no_evaluation', limit: '1' })
    const second = await page({ q: 'cache', outcome: 'no_evaluation', limit: '1', page: '2' })

    expect(first).toMatchObject({ total: 2, recordTotal: 6, totalPages: 2, page: 1 })
    expect(first.sessions.map((s) => s.id)).toEqual([closedWithoutVerdict])
    expect(second.sessions.map((s) => s.id)).toEqual([evaluationBroke])
  })

  it('tells no match from no record', async () => {
    const body = await page({ q: 'nothing like this' })

    expect(body).toMatchObject({ sessions: [], total: 0, recordTotal: 6, totalPages: 0, page: 1 })
  })

  it('moves a page past the end back to the last one', async () => {
    const body = await page({ limit: '4', page: '9' })

    expect(body.page).toBe(2)
    expect(body.sessions.map((s) => s.id)).toEqual([withNotes, passed])
  })

  it('rejects an unknown outcome or a query over 120 characters', async () => {
    expect((await request({ outcome: 'failed' })).status).toBe(400)
    expect((await request({ q: 'x'.repeat(121) })).status).toBe(400)
    expect((await request({ q: `  ${'x'.repeat(120)}  ` })).status).toBe(200)
  })

  it('stays behind authentication', async () => {
    expect((await request({}, {})).status).toBe(401)
  })
})
