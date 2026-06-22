import { and, count, eq, gte, sql } from 'drizzle-orm'
import type { SessionCompleted } from '../../domain/practice/events'
import type { ScrollCompleted } from '../../domain/learning/events'
import type { InMemoryEventBus } from './InMemoryEventBus'
import { attempts, katas, sessions, userMilestones } from '../persistence/drizzle/schema'
import type { DB } from '../persistence/drizzle/client'

// Per-scroll completion milestones. Adding a new scroll means: create its
// definition row via migration and extend this map. Keeping the mapping in
// infrastructure (not domain) because it's awarding policy, not a domain
// invariant.
const SCROLL_MILESTONE_BY_SLUG: Record<string, string> = {
  'javascript-dom-fundamentals': 'COURSE_JAVASCRIPT_DOM_FUNDAMENTALS',
  'sql-deep-cuts': 'COURSE_SQL_DEEP_CUTS',
}

export function registerMilestoneHandlers(eventBus: InMemoryEventBus, db: DB) {
  eventBus.subscribe<SessionCompleted>('SessionCompleted', async (event) => {
    const { userId, aggregateId: sessionId } = event

    const earned = await getEarnedSlugs(db, userId)
    const tryAward = (slug: string, qualifies: () => Promise<boolean>) =>
      awardWhen(db, earned, userId, sessionId, slug, qualifies)

    await tryAward('FIRST_KATA', async () => true)
    await tryAward('5_STREAK', async () => (await getCurrentStreak(db, userId)) >= 5)
    await tryAward('CONSISTENT', async () => (await getCurrentStreak(db, userId)) >= 30)
    await tryAward('POLYGLOT', () => hasCompletedDistinctTypes(db, userId, 3))
    await tryAward('ARCHITECT', () => completedKataTypeCount(db, userId, 'WHITEBOARD', 3))
    await tryAward('RUBBER_DUCK', () => completedKataTypeCount(db, userId, 'CHAT', 3))
    await tryAward('BRUTAL_TRUTH', () => finalVerdictCount(db, userId, 'NEEDS_WORK', 3))
    await tryAward('SENSEI_APPROVED', () => finalVerdictCount(db, userId, 'PASSED', 5))
    await tryAward('SQL_SURVIVOR', () => completedSqlTopicCount(db, userId, 3))
    await tryAward('UNDEFINED_NO_MORE', () => completedSessionCount(db, userId, 50))
  })

  eventBus.subscribe<ScrollCompleted>('ScrollCompleted', async (event) => {
    const milestoneSlug = SCROLL_MILESTONE_BY_SLUG[event.scrollSlug]
    if (!milestoneSlug) return // unknown scroll — no milestone configured, skip silently

    const earned = await getEarnedSlugs(db, event.userId)
    if (earned.has(milestoneSlug)) return

    // session_id is kata-only — scroll completion milestones leave it null.
    await db.insert(userMilestones).values({ userId: event.userId, milestoneSlug })
  })
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

async function hasCompletedDistinctTypes(db: DB, userId: string, min: number): Promise<boolean> {
  const types = await db
    .selectDistinct({ type: katas.type })
    .from(sessions)
    .innerJoin(katas, eq(sessions.kataId, katas.id))
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed')))
  return types.length >= min
}

async function completedKataTypeCount(
  db: DB,
  userId: string,
  type: string,
  min: number,
): Promise<boolean> {
  const [row] = await db
    .select({ count: count() })
    .from(sessions)
    .innerJoin(katas, eq(sessions.kataId, katas.id))
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed'), eq(katas.type, type)))
  return Number(row?.count ?? 0) >= min
}

async function finalVerdictCount(
  db: DB,
  userId: string,
  verdict: string,
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
        sql`${attempts.llmResponse}::jsonb->>'verdict' = ${verdict}`,
      ),
    )
  return Number(row?.count ?? 0) >= min
}

async function completedSqlTopicCount(db: DB, userId: string, min: number): Promise<boolean> {
  const [row] = await db
    .select({ count: count() })
    .from(sessions)
    .innerJoin(katas, eq(sessions.kataId, katas.id))
    .where(
      and(
        eq(sessions.userId, userId),
        eq(sessions.status, 'completed'),
        sql`${katas.topics}::jsonb ?| ARRAY['sql', 'SQL', 'database', 'postgresql', 'postgres', 'mysql', 'queries']`,
      ),
    )
  return Number(row?.count ?? 0) >= min
}

async function completedSessionCount(db: DB, userId: string, min: number): Promise<boolean> {
  const [row] = await db
    .select({ count: count() })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed')))
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
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed'), gte(sessions.startedAt, thirtyDaysAgo)))
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
