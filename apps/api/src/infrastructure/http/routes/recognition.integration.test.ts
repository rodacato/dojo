import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { DEFAULT_PRACTITIONER_LOOK, type PractitionerDTO } from '@dojo/shared'
import * as schema from '../../persistence/drizzle/schema'
import { PostgresSessionRepository } from '../../persistence/PostgresSessionRepository'
import { PostgresPractitionerRepository } from '../../persistence/PostgresPractitionerRepository'
import { AwardPractitionerPieces } from '../../../application/recognition/AwardPractitionerPieces'
import { UserId } from '../../../domain/shared/types'

const url = process.env['TEST_DATABASE_URL']
if (process.env['REQUIRE_DB_TESTS'] && !url) {
  throw new Error('REQUIRE_DB_TESTS is set but TEST_DATABASE_URL is not')
}

const { attempts, katas, practitionerLooks, sessions, userPieces, userSessions, users, variations } = schema
const evaluation = (verdict: string) => JSON.stringify({ verdict, analysis: '', topicsToReview: [] })
// Outside every season window, so seasonal pieces never join the awards whatever day the suite runs.
const OUT_OF_SEASON = new Date('2026-06-15T12:00:00Z')

describe.skipIf(!url)('practitioner pieces against Postgres', () => {
  const client = postgres(url ?? '', { max: 2 })
  const db = drizzle(client, { schema })
  const award = new AwardPractitionerPieces({
    sessionRepo: new PostgresSessionRepository(db),
    practitionerRepo: new PostgresPractitionerRepository(db),
  })

  const learner = randomUUID()
  const idle = randomUUID()
  const token = randomUUID()
  const kataId = randomUUID()
  const variationId = randomUUID()
  const needsWork = randomUUID()
  const timedOut = randomUUID()
  const userIds = [learner, idle]
  const sessionIds = [needsWork, timedOut]

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: join(__dirname, '../../persistence/drizzle/migrations') })
    await db.insert(users).values(userIds.map((id) => ({
      id, githubId: `integration-${id}`, username: `pieces-${id.slice(0, 8)}`, avatarUrl: 'https://example.test/a.png',
    })))
    await db.insert(userSessions).values({ id: token, userId: learner, expiresAt: new Date(Date.now() + 3_600_000) })
    await db.insert(katas).values({
      id: kataId, title: 'integration kata', description: 'fixture', duration: 5, difficulty: 'easy', category: 'backend',
      type: 'review', status: 'published', ownerRole: 'role', ownerContext: 'context', createdBy: learner,
    })
    await db.insert(variations).values({ id: variationId, kataId, ownerRole: 'role', ownerContext: 'context' })
    await db.insert(sessions).values([
      { id: needsWork, userId: learner, kataId, variationId, body: '', status: 'failed', startedAt: OUT_OF_SEASON },
      { id: timedOut, userId: idle, kataId, variationId, body: '', status: 'failed', startedAt: OUT_OF_SEASON },
    ])
    await db.insert(attempts).values({
      id: randomUUID(), sessionId: needsWork, userResponse: 'r', llmResponse: evaluation('needs_work'), isFinalEvaluation: true,
    })
    process.env['DATABASE_URL'] = url
  })

  afterAll(async () => {
    await db.delete(userPieces).where(inArray(userPieces.userId, userIds))
    await db.delete(practitionerLooks).where(inArray(practitionerLooks.userId, userIds))
    await db.delete(attempts).where(inArray(attempts.sessionId, sessionIds))
    await db.delete(sessions).where(inArray(sessions.id, sessionIds))
    await db.delete(variations).where(eq(variations.id, variationId))
    await db.delete(katas).where(eq(katas.id, kataId))
    await db.delete(userSessions).where(eq(userSessions.id, token))
    await db.delete(users).where(inArray(users.id, userIds))
    await client.end()
  })

  const authed = (init: RequestInit = {}) => ({ ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
  const routes = async () => (await import('./recognition')).recognitionRoutes
  const putLook = async (body: unknown) => (await routes()).request('/recognition/practitioner/look', authed({ method: 'PUT', body: JSON.stringify(body) }))

  it('awards the hachimaki for a NEEDS WORK kata, and only once', async () => {
    expect(await award.execute({ userId: UserId(learner), sessionId: needsWork })).toEqual(['hachimaki'])
    expect(await award.execute({ userId: UserId(learner), sessionId: needsWork })).toEqual([])
  })

  it('awards nothing for a session that ended without an evaluation', async () => {
    expect(await award.execute({ userId: UserId(idle), sessionId: timedOut })).toEqual([])
  })

  it('lists the session that earned a piece on GET /sessions/:id', async () => {
    const { practiceRoutes } = await import('./practice')
    const res = await practiceRoutes.request(`/sessions/${needsWork}`, authed())
    expect(res.status).toBe(200)
    expect(((await res.json()) as { earnedPieces: string[] }).earnedPieces).toEqual(['hachimaki'])
  })

  it('returns the look, the rank and every piece with its progress', async () => {
    const res = await (await routes()).request('/recognition/practitioner', authed())
    const body = (await res.json()) as PractitionerDTO

    expect(body.look).toEqual(DEFAULT_PRACTITIONER_LOOK)
    expect(body.belt).toBe('white')
    expect(body.pieces.find((p) => p.id === 'hachimaki')?.earnedAt).not.toBeNull()
    expect(body.pieces.find((p) => p.id === 'kasa')).toMatchObject({ earnedAt: null, progress: { current: 1, target: 3 } })
  })

  it('saves a look with an earned piece and rejects one with a piece not earned', async () => {
    const earned = { ...DEFAULT_PRACTITIONER_LOOK, gi: 'indigo', equip: { ...DEFAULT_PRACTITIONER_LOOK.equip, head: 'hachimaki' } }
    expect((await putLook(earned)).status).toBe(200)

    const notEarned = await putLook({ ...earned, equip: { ...earned.equip, head: 'kasa' } })
    expect(notEarned.status).toBe(400)
    expect(await notEarned.json()).toMatchObject({ pieces: ['kasa'] })

    const res = await (await routes()).request('/recognition/practitioner', authed())
    expect(((await res.json()) as PractitionerDTO).look).toEqual(earned)
  })

  it('rejects a malformed look and an unauthenticated request', async () => {
    expect((await putLook({ ...DEFAULT_PRACTITIONER_LOOK, skin: '#000000' })).status).toBe(400)
    const anonymous = await (await routes()).request('/recognition/practitioner')
    expect(anonymous.status).toBe(401)
  })
})
