import { inArray, like } from 'drizzle-orm'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {
  SCROLL_PROTOCOL_VERSION,
  registerScrollSchema,
  type PieceId,
  type ScrollManifest,
} from '@dojo/shared'
import * as schema from './drizzle/schema'
import { KATAS, uuidv5 } from './katas'
import type { SeedKata } from './katas'
import { composePointAnswer } from '../../domain/practice/point-answer'

const LOCAL_HOSTS = ['localhost', '127.0.0.1', 'db']
const INSERT_BATCH = 200
const DAY_MS = 86_400_000
const MINUTE_MS = 60_000

type Outcome = 'passed' | 'passed_with_notes' | 'needs_work' | 'expired' | 'no_evaluation'
type Today = 'none' | 'done' | 'active'

export interface Persona {
  key: string
  username: string
  /** The screens and states this account exists to show. */
  shows: string
  spanDays: number
  density: number
  secondKataOdds: number
  streak: number
  quietDays: number
  today: Today
  outcomes: Record<Outcome, number>
  pieces: PieceId[]
  milestones: number
  feedbackOdds: number
  preferences?: { level: string; interests: string[]; randomness: number; goalWeeklyTarget: number }
  reminderEmail?: string
}

const STEADY: Persona['outcomes'] = {
  passed: 0.55,
  passed_with_notes: 0.25,
  needs_work: 0.12,
  expired: 0.05,
  no_evaluation: 0.03,
}
const STRUGGLING: Persona['outcomes'] = {
  passed: 0.15,
  passed_with_notes: 0.2,
  needs_work: 0.5,
  expired: 0.1,
  no_evaluation: 0.05,
}

export const PERSONAS: Persona[] = [
  {
    key: 'new',
    username: 'demo-new',
    shows: 'first visit, welcome, empty history, white belt',
    spanDays: 0,
    density: 0,
    secondKataOdds: 0,
    streak: 0,
    quietDays: 0,
    today: 'none',
    outcomes: STEADY,
    pieces: [],
    milestones: 0,
    feedbackOdds: 0,
  },
  {
    key: 'waiting',
    username: 'demo-waiting',
    shows: 'dashboard waiting, live streak, yellow belt, reminders on',
    spanDays: 24,
    density: 0.75,
    secondKataOdds: 0.1,
    streak: 3,
    quietDays: 0,
    today: 'none',
    outcomes: STEADY,
    pieces: ['hachimaki', 'kasa'],
    milestones: 2,
    feedbackOdds: 0.3,
    preferences: { level: 'mid', interests: ['backend', 'security'], randomness: 0.3, goalWeeklyTarget: 5 },
    reminderEmail: 'demo-waiting@example.test',
  },
  {
    key: 'done',
    username: 'demo-done',
    shows: 'dashboard done today, verdict, green belt, earned piece',
    spanDays: 90,
    density: 0.65,
    secondKataOdds: 0.2,
    streak: 6,
    quietDays: 0,
    today: 'done',
    outcomes: STEADY,
    pieces: ['hachimaki', 'kasa', 'scarf'],
    milestones: 4,
    feedbackOdds: 0.3,
    preferences: { level: 'senior', interests: ['architecture'], randomness: 0.6, goalWeeklyTarget: 3 },
  },
  {
    key: 'active',
    username: 'demo-active',
    shows: 'resume on the dashboard, active point kata with its clock running',
    spanDays: 16,
    density: 0.8,
    secondKataOdds: 0,
    streak: 2,
    quietDays: 0,
    today: 'active',
    outcomes: STEADY,
    pieces: ['hachimaki'],
    milestones: 1,
    feedbackOdds: 0,
  },
  {
    key: 'lapsed',
    username: 'demo-lapsed-with-a-long-github-handle',
    shows: 'broken streak, weak areas, mostly needs work, a long handle in the rail',
    spanDays: 40,
    density: 0.35,
    secondKataOdds: 0,
    streak: 0,
    quietDays: 12,
    today: 'none',
    outcomes: STRUGGLING,
    pieces: ['hachimaki'],
    milestones: 1,
    feedbackOdds: 0.1,
  },
  {
    key: 'veteran',
    username: 'demo-veteran',
    shows: 'brown belt, paged history with every outcome, heatmap, milestones',
    spanDays: 200,
    density: 0.8,
    secondKataOdds: 0.2,
    streak: 12,
    quietDays: 0,
    today: 'none',
    outcomes: STEADY,
    pieces: ['hachimaki', 'kasa', 'scarf', 'happi'],
    milestones: 8,
    feedbackOdds: 0.25,
    preferences: { level: 'senior', interests: ['backend', 'architecture', 'security'], randomness: 0.2, goalWeeklyTarget: 5 },
  },
  {
    key: 'master',
    username: 'demo-master',
    shows: 'black belt, long record, full public profile',
    spanDays: 320,
    density: 0.95,
    secondKataOdds: 0.2,
    streak: 30,
    quietDays: 0,
    today: 'done',
    outcomes: STEADY,
    pieces: ['hachimaki', 'kasa', 'scarf', 'happi'],
    milestones: 12,
    feedbackOdds: 0.2,
    preferences: { level: 'senior', interests: [], randomness: 0.8, goalWeeklyTarget: 7 },
  },
]

function demoScroll(slug: string, title: string, description: string, languages: string[]): ScrollManifest {
  return {
    id: slug,
    version: '0.1.0',
    protocol: SCROLL_PROTOCOL_VERSION,
    entry: 'http://localhost:4010/index.html',
    locales: ['en'],
    title: { en: title },
    description: { en: description },
    programmingLanguages: languages,
    units: [{ id: 'unit-1', title: { en: 'Take steps' } }],
    capabilities: ['progress'],
  }
}

export const DEMO_SCROLLS = [
  {
    slug: 'demo-query-plans',
    visibility: 'public',
    manifest: demoScroll('demo-query-plans', 'Reading query plans', 'Learn to spot a bad join before it reaches production.', ['sql']),
  },
  {
    slug: 'demo-event-loop',
    visibility: 'public',
    manifest: demoScroll('demo-event-loop', 'The event loop, one tick at a time', 'Step through the queues and predict what prints next.', ['javascript', 'typescript']),
  },
  {
    slug: 'demo-incident-review',
    visibility: 'private',
    manifest: demoScroll('demo-incident-review', 'Reading an incident timeline', 'Find the decision that mattered, not the last error in the log.', []),
  },
].map((scroll) => registerScrollSchema.parse({ ...scroll, status: 'published' }))

const ANALYSIS: Record<Exclude<Outcome, 'expired' | 'no_evaluation'>, string[]> = {
  passed: [
    'You named the failing assumption and the input that breaks it. The fix is proportionate, and the reasoning would survive a code review.',
    'The diagnosis is right and it is specific. You traced the cause instead of describing the symptom.',
  ],
  passed_with_notes: [
    'The direction is right, but the explanation stops at what breaks. It never says why it breaks, or what would have caught it earlier.',
    'You found the problem. The trade-off in your fix goes unmentioned, and that is the part a reviewer would ask about first.',
  ],
  needs_work: [
    'This describes the code instead of reasoning about it. The actual failure is untouched, and the proposed change would not prevent it.',
    'The answer rests on an assumption the problem contradicts. Reread what the code guarantees before deciding what it should do.',
  ],
}

const POINT_WHY = [
  'The check runs before the value is ready, so the first request can pass with stale data. Moving it after the await closes that window.',
  'This line trusts input the caller controls. Everything after it assumes the value was validated, and nothing validated it.',
  'The boundary is off by one here, so the last item never reaches the loop. It only shows on a full page.',
]

const FREE_ANSWER: Record<SeedKata['type'], string> = {
  code: 'function solve(input) {\n  const seen = new Set()\n  return input.filter((item) => !seen.has(item) && seen.add(item))\n}\n',
  chat: 'I would start from the failure mode, not the feature. The queue absorbs the spike, but only if consumers are idempotent, so that is the first thing I would verify.',
  whiteboard: 'flowchart LR\n  client --> gateway\n  gateway --> queue\n  queue --> worker\n  worker --> db\n#queue #idempotency',
  review: 'The handler swallows the error, so a failed write looks like a success. I would return the failure and let the caller decide.',
}

/** A small deterministic generator, so a rerun gives the same demo accounts. */
export function seededRandom(seed: string): () => number {
  let state = 2166136261
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619)
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(list: readonly T[], random: () => number): T {
  return list[Math.floor(random() * list.length)]!
}

function pickOutcome(weights: Persona['outcomes'], random: () => number): Outcome {
  let roll = random()
  for (const [outcome, weight] of Object.entries(weights) as Array<[Outcome, number]>) {
    roll -= weight
    if (roll <= 0) return outcome
  }
  return 'passed'
}

export interface PlannedSession {
  daysAgo: number
  outcome: Outcome
}

/** Which days a persona practised, oldest first. Today's session is added apart. */
export function planHistory(persona: Persona, random: () => number): PlannedSession[] {
  const planned: PlannedSession[] = []
  for (let daysAgo = persona.spanDays; daysAgo > persona.quietDays; daysAgo--) {
    const inStreak = daysAgo <= persona.streak
    if (!inStreak && random() > persona.density) continue
    const kataCount = random() < persona.secondKataOdds ? 2 : 1
    for (let i = 0; i < kataCount; i++) {
      const keepsStreak = inStreak && i === 0
      planned.push({ daysAgo, outcome: keepsStreak ? 'passed' : pickOutcome(persona.outcomes, random) })
    }
  }
  return planned
}

export function assertDemoDatabase(databaseUrl: string, nodeEnv: string | undefined): void {
  if (nodeEnv === 'production') throw new Error('The demo seed never runs in production')
  const { hostname, pathname } = new URL(databaseUrl)
  const name = pathname.slice(1)
  if (!LOCAL_HOSTS.includes(hostname)) throw new Error(`The demo seed only runs on a local database, not ${hostname}`)
  if (name !== 'dojo_dev' && !name.includes('demo')) {
    throw new Error(`The demo seed only runs on dojo_dev or a *demo* database, not ${name}`)
  }
}

function userResponseFor(kata: SeedKata, random: () => number): string {
  const line = kata.rubric?.answer?.line
  if (kata.type === 'review' && kata.starterCode && line) {
    return composePointAnswer(kata.starterCode, line, pick(POINT_WHY, random))
  }
  return FREE_ANSWER[kata.type]
}

function evaluationFor(kata: SeedKata, verdict: keyof typeof ANALYSIS, random: () => number): string {
  return JSON.stringify({
    verdict,
    analysis: pick(ANALYSIS[verdict], random),
    topicsToReview: verdict === 'passed' ? [] : kata.topics.slice(0, 2),
    followUpQuestion: null,
    isFinalEvaluation: true,
  })
}

async function inBatches<T>(rows: T[], write: (batch: T[]) => Promise<unknown>): Promise<void> {
  for (let start = 0; start < rows.length; start += INSERT_BATCH) {
    await write(rows.slice(start, start + INSERT_BATCH))
  }
}

async function clearDemoData(db: PostgresJsDatabase<typeof schema>): Promise<void> {
  const demoUsers = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(like(schema.users.githubId, 'demo-%'))
  const userIds = demoUsers.map((user) => user.id)

  await db.delete(schema.scrolls).where(like(schema.scrolls.slug, 'demo-%'))
  if (userIds.length === 0) return

  const demoSessions = await db
    .select({ id: schema.sessions.id })
    .from(schema.sessions)
    .where(inArray(schema.sessions.userId, userIds))

  await inBatches(demoSessions.map((session) => session.id), async (sessionIds) => {
    await db.delete(schema.attempts).where(inArray(schema.attempts.sessionId, sessionIds))
  })
  await db.delete(schema.kataFeedback).where(inArray(schema.kataFeedback.userId, userIds))
  await db.delete(schema.userMilestones).where(inArray(schema.userMilestones.userId, userIds))
  await db.delete(schema.sessions).where(inArray(schema.sessions.userId, userIds))
  await db.delete(schema.users).where(inArray(schema.users.id, userIds))
}

async function seedPersona(
  db: PostgresJsDatabase<typeof schema>,
  persona: Persona,
  milestoneSlugs: string[],
  variationByKata: Map<string, string>,
  now: Date,
): Promise<{ token: string; sessions: number }> {
  const random = seededRandom(persona.key)
  const userId = uuidv5(`demo-user-${persona.key}`)
  const createdAt = new Date(now.getTime() - (persona.spanDays + 1) * DAY_MS)

  await db.insert(schema.users).values({
    id: userId,
    githubId: `demo-${persona.key}`,
    username: persona.username,
    avatarUrl: '',
    email: persona.reminderEmail ?? null,
    reminderEnabled: Boolean(persona.reminderEmail),
    createdAt,
  })
  if (persona.preferences) {
    await db.insert(schema.userPreferences).values({ userId, ...persona.preferences })
  }

  const micro = KATAS.filter((kata) => kata.tags.includes('micro'))
  const sessionRows: Array<typeof schema.sessions.$inferInsert> = []
  const attemptRows: Array<typeof schema.attempts.$inferInsert> = []
  const feedbackRows: Array<typeof schema.kataFeedback.$inferInsert> = []
  let lastFinalSessionId: string | null = null

  const addSession = (kata: SeedKata, startedAt: Date, outcome: Outcome) => {
    const id = uuidv5(`demo-session-${persona.key}-${sessionRows.length}`)
    const variationId = variationByKata.get(kata.id)!
    const minutes = Math.max(1, Math.round(kata.duration * (0.5 + random() * 0.5)))
    const finished = new Date(startedAt.getTime() + minutes * MINUTE_MS)
    const failed = outcome === 'needs_work' || outcome === 'expired' || outcome === 'no_evaluation'

    sessionRows.push({
      id,
      userId,
      kataId: kata.id,
      variationId,
      body: kata.description,
      status: failed ? 'failed' : 'completed',
      startedAt,
      completedAt: finished,
    })

    if (outcome === 'expired') return
    const isFinalEvaluation = outcome !== 'no_evaluation'
    attemptRows.push({
      id: uuidv5(`demo-attempt-${id}`),
      sessionId: id,
      userResponse: userResponseFor(kata, random),
      llmResponse: isFinalEvaluation ? evaluationFor(kata, outcome, random) : '',
      isFinalEvaluation,
      submittedAt: finished,
    })
    if (!isFinalEvaluation) return

    lastFinalSessionId = id
    if (random() < persona.feedbackOdds) {
      feedbackRows.push({
        sessionId: id,
        kataId: kata.id,
        variationId,
        userId,
        clarity: 'clear',
        timing: random() < 0.8 ? 'about_right' : 'too_short',
        evaluation: outcome === 'needs_work' ? 'missed_the_point' : 'fair_and_relevant',
      })
    }
  }

  const history = planHistory(persona, random)
  for (const { daysAgo, outcome } of history) {
    const hour = 7 + Math.floor(random() * 13)
    const startedAt = new Date(now.getTime() - daysAgo * DAY_MS)
    startedAt.setUTCHours(hour, Math.floor(random() * 60), 0, 0)
    addSession(pick(KATAS, random), startedAt, outcome)
  }

  if (persona.today === 'done') {
    addSession(pick(micro, random), new Date(now.getTime() - 40 * MINUTE_MS), 'passed')
  }
  if (persona.today === 'active') {
    const kata = micro[0]!
    sessionRows.push({
      id: uuidv5(`demo-session-${persona.key}-active`),
      userId,
      kataId: kata.id,
      variationId: variationByKata.get(kata.id)!,
      body: kata.description,
      status: 'active',
      startedAt: new Date(now.getTime() - MINUTE_MS),
    })
  }

  await inBatches(sessionRows, (rows) => db.insert(schema.sessions).values(rows))
  await inBatches(attemptRows, (rows) => db.insert(schema.attempts).values(rows))
  await inBatches(feedbackRows, (rows) => db.insert(schema.kataFeedback).values(rows))

  if (persona.pieces.length > 0) {
    await db.insert(schema.userPieces).values(
      persona.pieces.map((pieceId, index) => ({
        userId,
        pieceId,
        sessionId: index === persona.pieces.length - 1 ? lastFinalSessionId : null,
        earnedAt: new Date(now.getTime() - (persona.pieces.length - index) * DAY_MS),
      })),
    )
  }
  if (persona.milestones > 0) {
    await db.insert(schema.userMilestones).values(
      milestoneSlugs.slice(0, persona.milestones).map((milestoneSlug, index) => ({
        userId,
        milestoneSlug,
        earnedAt: new Date(now.getTime() - (index + 1) * 3 * DAY_MS),
      })),
    )
  }

  const [login] = await db
    .insert(schema.userSessions)
    .values({ userId, expiresAt: new Date(now.getTime() + 30 * DAY_MS) })
    .returning({ id: schema.userSessions.id })

  return { token: login!.id, sessions: sessionRows.length }
}

export async function seedDemo(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL']
  if (!databaseUrl) throw new Error('DATABASE_URL is required')
  assertDemoDatabase(databaseUrl, process.env['NODE_ENV'])

  const client = postgres(databaseUrl, { max: 1 })
  const db = drizzle(client, { schema })

  try {
    const variations = await db
      .select({ id: schema.variations.id, kataId: schema.variations.kataId })
      .from(schema.variations)
    const variationByKata = new Map(variations.map((variation) => [variation.kataId, variation.id]))
    if (KATAS.some((kata) => !variationByKata.has(kata.id))) {
      throw new Error('Run pnpm --filter=@dojo/api db:seed first: the demo sessions need the katas')
    }

    await clearDemoData(db)

    const milestones = await db.select({ slug: schema.badgeDefinitions.slug }).from(schema.badgeDefinitions)
    const milestoneSlugs = milestones.map((milestone) => milestone.slug)
    await db.insert(schema.scrolls).values(
      DEMO_SCROLLS.map((scroll) => ({ id: uuidv5(`demo-scroll-${scroll.slug}`), ...scroll })),
    )

    const webUrl = process.env['WEB_URL'] ?? 'http://localhost:5173'
    const now = new Date()
    console.log('Demo accounts. Open a link to sign in as that persona:\n')
    for (const persona of PERSONAS) {
      const { token, sessions } = await seedPersona(db, persona, milestoneSlugs, variationByKata, now)
      console.log(`${persona.username} · ${sessions} sessions · ${persona.shows}`)
      console.log(`  ${webUrl}/auth/callback?token=${token}\n`)
    }
  } finally {
    await client.end()
  }
}

if (require.main === module) {
  seedDemo()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Demo seed failed:', err)
      process.exit(1)
    })
}
