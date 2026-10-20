import { and, count, eq, gte, sql } from 'drizzle-orm'
import type { SessionCompleted, SessionFailed } from '../../domain/practice/events'
import type { Verdict } from '../../domain/practice/values'
import type { KataType } from '@dojo/shared'
import type { InMemoryEventBus } from './InMemoryEventBus'
import { attempts, katas, sessions, userMilestones } from '../persistence/drizzle/schema'
import type { DB } from '../persistence/drizzle/client'
import { isEligiblePractice } from '../persistence/eligible-practice'

export function registerMilestoneHandlers(eventBus: InMemoryEventBus, db: DB) {
  const awardMilestones = async (event: SessionCompleted | SessionFailed) => {
    const { userId, aggregateId: sessionId } = event

    const earned = await getEarnedSlugs(db, userId)
    const tryAward = (slug: string, qualifies: () => Promise<boolean>) =>
      awardWhen(db, earned, userId, sessionId, slug, qualifies)

    await tryAward('FIRST_KATA', async () => true)
    await tryAward('5_STREAK', async () => (await getCurrentStreak(db, userId)) >= 5)
    await tryAward('CONSISTENT', async () => (await getCurrentStreak(db, userId)) >= 30)
    await tryAward('POLYGLOT', () => hasPracticedDistinctTypes(db, userId, 3))
    await tryAward('ARCHITECT', () => practicedKataTypeCount(db, userId, 'whiteboard', 3))
    await tryAward('RUBBER_DUCK', () => practicedKataTypeCount(db, userId, 'chat', 3))
    await tryAward('BRUTAL_TRUTH', () => finalVerdictCount(db, userId, 'needs_work', 3))
    await tryAward('SENSEI_APPROVED', () => finalVerdictCount(db, userId, 'passed', 5))
    await tryAward('SQL_SURVIVOR', () => practicedSqlTopicCount(db, userId, 3))
    await tryAward('UNDEFINED_NO_MORE', () => practicedSessionCount(db, userId, 50))
  }

  eventBus.subscribe<SessionCompleted>('SessionCompleted', awardMilestones)
  eventBus.subscribe<SessionFailed>('SessionFailed', awardMilestones)
}

// Only runs `qualifies` (and its query) when the slug isn't already earned,
// preserving the original short-circuit and query order.
async function awardWhen(
  db: DB,
  earned: Set<string>,
  userId: string,
  sessionId: string,
  slug: string,
  qualifies: () => Promise<boolean>,
): Promise<void> {
  if (earned.has(slug)) return
  if (await qualifies()) await award(db, userId, slug, sessionId)
}

async function hasPracticedDistinctTypes(db: DB, userId: string, min: number): Promise<boolean> {
  const types = await db
    .selectDistinct({ type: katas.type })
    .from(sessions)
    .innerJoin(katas, eq(sessions.kataId, katas.id))
    .where(and(eq(sessions.userId, userId), isEligiblePractice()))
  return types.length >= min
}

async function practicedKataTypeCount(
  db: DB,
  userId: string,
  type: KataType,
  min: number,
): Promise<boolean> {
  const [row] = await db
    .select({ count: count() })
    .from(sessions)
    .innerJoin(katas, eq(sessions.kataId, katas.id))
    .where(and(eq(sessions.userId, userId), isEligiblePractice(), eq(katas.type, type)))
  return Number(row?.count ?? 0) >= min
}

async function finalVerdictCount(
  db: DB,
  userId: string,
  verdict: Verdict,
  min: number,
): Promise<boolean> {
  const [row] = await db
    .select({ count: count() })
    .from(attempts)
    .innerJoin(sessions, eq(attempts.sessionId, sessions.id))
    .where(
      and(
        eq(sessions.userId, userId),
        eq(attempts.isFinalEvaluation, true),
        sql`lower(${attempts.llmResponse}::jsonb->>'verdict') = ${verdict}`,
      ),
    )
  return Number(row?.count ?? 0) >= min
}

async function practicedSqlTopicCount(db: DB, userId: string, min: number): Promise<boolean> {
  const [row] = await db
    .select({ count: count() })
    .from(sessions)
    .innerJoin(katas, eq(sessions.kataId, katas.id))
    .where(
      and(
        eq(sessions.userId, userId),
        isEligiblePractice(),
        sql`${katas.topics}::jsonb ?| ARRAY['sql', 'SQL', 'database', 'postgresql', 'postgres', 'mysql', 'queries']`,
      ),
    )
  return Number(row?.count ?? 0) >= min
}

async function practicedSessionCount(db: DB, userId: string, min: number): Promise<boolean> {
  const [row] = await db
    .select({ count: count() })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isEligiblePractice()))
  return Number(row?.count ?? 0) >= min
}

async function getEarnedSlugs(db: DB, userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ slug: userMilestones.milestoneSlug })
    .from(userMilestones)
    .where(eq(userMilestones.userId, userId))
  return new Set(rows.map((r) => r.slug))
}

async function award(db: DB, userId: string, slug: string, sessionId: string) {
  await db.insert(userMilestones).values({ userId, milestoneSlug: slug, sessionId })
}

async function getCurrentStreak(db: DB, userId: string): Promise<number> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const heatmapRows = await db
    .select({ date: sql<string>`DATE(${sessions.startedAt})::text` })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isEligiblePractice(), gte(sessions.startedAt, thirtyDaysAgo)))
    .groupBy(sql`DATE(${sessions.startedAt})`)

  const dates = heatmapRows.map((r) => r.date)
  if (dates.length === 0) return 0

  const dateSet = new Set(dates)
  const today = new Date().toISOString().slice(0, 10)
  let streak = 0
  const current = new Date()
  if (!dateSet.has(today)) current.setDate(current.getDate() - 1)

  while (true) {
    const dateStr = current.toISOString().slice(0, 10)
    if (!dateSet.has(dateStr)) break
    streak++
    current.setDate(current.getDate() - 1)
  }

  return streak
}
