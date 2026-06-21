import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionCompleted } from '../../domain/practice/events'
import type { ScrollCompleted } from '../../domain/learning/events'
import type { UserId } from '../../domain/shared/types'
import { InMemoryEventBus } from './InMemoryEventBus'
import { registerMilestoneHandlers } from './MilestoneEventHandler'

/**
 * Fake Drizzle `db`. The query builder is the genuine boundary here, so we
 * stub it — but every threshold decision (which milestone is awarded for which
 * row count / streak) runs against the REAL handler logic.
 *
 * SELECT chains are thenable and pull their result from a scripted queue filled
 * in handler-execution order. INSERT calls record the awarded milestone slug so
 * a test asserts the real branch decisions, never a configured mock return.
 */
class FakeDb {
  private selectQueue: unknown[][] = []
  readonly awarded: Array<{ milestoneSlug: string; sessionId?: string | null }> = []
  earnedSlugs: string[] = []

  // First SELECT in every handler run is getEarnedSlugs; the rest are scripted.
  scriptSelects(results: unknown[][]) {
    this.selectQueue = [...results]
  }

  private nextSelect(): unknown[] {
    return this.selectQueue.shift() ?? []
  }

  private earnedRows() {
    return this.earnedSlugs.map((slug) => ({ slug }))
  }

  // The chain object: every builder method returns `this`, and `.then` makes it
  // awaitable. getEarnedSlugs is detected by its `{ slug }` projection.
  private chain(isEarnedQuery: boolean) {
    const self = this
    const builder: Record<string, unknown> = {}
    const passthrough = () => builder
    for (const m of ['from', 'innerJoin', 'where', 'groupBy']) builder[m] = passthrough
    builder.then = (resolve: (rows: unknown[]) => unknown) =>
      Promise.resolve(isEarnedQuery ? self.earnedRows() : self.nextSelect()).then(resolve)
    return builder
  }

  select(projection?: Record<string, unknown>) {
    const isEarned = !!projection && 'slug' in projection
    return this.chain(isEarned)
  }

  selectDistinct() {
    return this.chain(false)
  }

  insert() {
    const self = this
    return {
      values(row: { milestoneSlug: string; sessionId?: string | null }) {
        self.awarded.push({ milestoneSlug: row.milestoneSlug, sessionId: row.sessionId ?? null })
        return Promise.resolve()
      },
    }
  }
}

const sessionCompleted = (overrides: Partial<SessionCompleted> = {}): SessionCompleted => ({
  type: 'SessionCompleted',
  aggregateId: 'session-1',
  occurredAt: new Date(),
  userId: 'user-1' as UserId,
  verdict: 'passed',
  topicsToReview: [],
  ...overrides,
})

// The SessionCompleted handler issues SELECTs in this fixed order after the
// earned-slugs lookup. A test scripts only the ones it cares about and lets the
// rest default to [] (i.e. count 0 / no rows → no award).
const NO_AWARDS: unknown[][] = [
  /* 5_STREAK   */ [], // getCurrentStreak heatmap rows
  /* CONSISTENT */ [],
  /* POLYGLOT   */ [],
  /* ARCHITECT  */ [{ count: 0 }],
  /* RUBBER_DUCK*/ [{ count: 0 }],
  /* BRUTAL     */ [{ count: 0 }],
  /* SENSEI     */ [{ count: 0 }],
  /* SQL        */ [{ count: 0 }],
  /* UNDEFINED  */ [{ count: 0 }],
]

const awardedSlugs = (db: FakeDb) => db.awarded.map((a) => a.milestoneSlug).sort()

const fireSessionCompleted = async (db: FakeDb, event = sessionCompleted()) => {
  const bus = new InMemoryEventBus()
  registerMilestoneHandlers(bus, db as never)
  await bus.publish(event)
}

describe('MilestoneEventHandler — SessionCompleted', () => {
  let db: FakeDb
  beforeEach(() => {
    db = new FakeDb()
  })

  it('awards FIRST_KATA on the first completed session and nothing else by default', async () => {
    db.scriptSelects(NO_AWARDS)
    await fireSessionCompleted(db)

    expect(awardedSlugs(db)).toEqual(['FIRST_KATA'])
    // FIRST_KATA carries the session id; scroll-less awards carry it too here.
    expect(db.awarded.find((a) => a.milestoneSlug === 'FIRST_KATA')?.sessionId).toBe('session-1')
  })

  it('does NOT re-award milestones the user already earned (guard branch)', async () => {
    db.earnedSlugs = ['FIRST_KATA']
    db.scriptSelects(NO_AWARDS)
    await fireSessionCompleted(db)

    expect(awardedSlugs(db)).toEqual([])
  })

  it('awards 5_STREAK at exactly 5 consecutive days but not CONSISTENT (needs 30)', async () => {
    db.earnedSlugs = ['FIRST_KATA']
    const streak5 = streakRows(5)
    db.scriptSelects([
      streak5, // 5_STREAK getCurrentStreak
      streak5, // CONSISTENT getCurrentStreak
      [], // POLYGLOT
      [{ count: 0 }],
      [{ count: 0 }],
      [{ count: 0 }],
      [{ count: 0 }],
      [{ count: 0 }],
      [{ count: 0 }],
    ])
    await fireSessionCompleted(db)

    expect(awardedSlugs(db)).toEqual(['5_STREAK'])
  })

  it('a 4-day streak awards neither 5_STREAK nor CONSISTENT (below threshold)', async () => {
    db.earnedSlugs = ['FIRST_KATA']
    const streak4 = streakRows(4)
    db.scriptSelects([streak4, streak4, [], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }]])
    await fireSessionCompleted(db)

    expect(awardedSlugs(db)).toEqual([])
  })

  it('awards both 5_STREAK and CONSISTENT at a 30-day streak', async () => {
    db.earnedSlugs = ['FIRST_KATA']
    const streak30 = streakRows(30)
    db.scriptSelects([streak30, streak30, [], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }]])
    await fireSessionCompleted(db)

    expect(awardedSlugs(db)).toEqual(['5_STREAK', 'CONSISTENT'])
  })

  it('awards POLYGLOT only when 3 distinct kata types are completed', async () => {
    db.earnedSlugs = ['FIRST_KATA']
    db.scriptSelects([
      [], // 5_STREAK
      [], // CONSISTENT
      [{ type: 'code' }, { type: 'chat' }, { type: 'whiteboard' }], // POLYGLOT: 3 types
      [{ count: 0 }],
      [{ count: 0 }],
      [{ count: 0 }],
      [{ count: 0 }],
      [{ count: 0 }],
      [{ count: 0 }],
    ])
    await fireSessionCompleted(db)

    expect(awardedSlugs(db)).toEqual(['POLYGLOT'])
  })

  it('does NOT award POLYGLOT with only 2 distinct types', async () => {
    db.earnedSlugs = ['FIRST_KATA']
    db.scriptSelects([[], [], [{ type: 'code' }, { type: 'chat' }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }]])
    await fireSessionCompleted(db)

    expect(awardedSlugs(db)).toEqual([])
  })

  it('awards ARCHITECT at 3 whiteboard kata, RUBBER_DUCK at 3 chat kata', async () => {
    db.earnedSlugs = ['FIRST_KATA']
    db.scriptSelects([
      [], // 5_STREAK
      [], // CONSISTENT
      [], // POLYGLOT
      [{ count: 3 }], // ARCHITECT
      [{ count: 3 }], // RUBBER_DUCK
      [{ count: 0 }], // BRUTAL_TRUTH
      [{ count: 0 }], // SENSEI_APPROVED
      [{ count: 0 }], // SQL_SURVIVOR
      [{ count: 0 }], // UNDEFINED_NO_MORE
    ])
    await fireSessionCompleted(db)

    expect(awardedSlugs(db)).toEqual(['ARCHITECT', 'RUBBER_DUCK'])
  })

  it('does NOT award ARCHITECT at a count of 2 (below threshold of 3)', async () => {
    db.earnedSlugs = ['FIRST_KATA']
    db.scriptSelects([[], [], [], [{ count: 2 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }]])
    await fireSessionCompleted(db)

    expect(awardedSlugs(db)).toEqual([])
  })

  it('awards SENSEI_APPROVED only at 5 clean PASSED verdicts (4 is not enough)', async () => {
    db.earnedSlugs = ['FIRST_KATA']
    db.scriptSelects([[], [], [], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 4 }], [{ count: 0 }], [{ count: 0 }]])
    await fireSessionCompleted(db)
    expect(awardedSlugs(db)).toEqual([])

    db = new FakeDb()
    db.earnedSlugs = ['FIRST_KATA']
    db.scriptSelects([[], [], [], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 5 }], [{ count: 0 }], [{ count: 0 }]])
    await fireSessionCompleted(db)
    expect(awardedSlugs(db)).toEqual(['SENSEI_APPROVED'])
  })

  it('awards BRUTAL_TRUTH at 3 NEEDS_WORK final verdicts', async () => {
    db.earnedSlugs = ['FIRST_KATA']
    db.scriptSelects([[], [], [], [{ count: 0 }], [{ count: 0 }], [{ count: 3 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }]])
    await fireSessionCompleted(db)

    expect(awardedSlugs(db)).toEqual(['BRUTAL_TRUTH'])
  })

  it('awards SQL_SURVIVOR at 3 SQL-topic kata', async () => {
    db.earnedSlugs = ['FIRST_KATA']
    db.scriptSelects([[], [], [], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 3 }], [{ count: 0 }]])
    await fireSessionCompleted(db)

    expect(awardedSlugs(db)).toEqual(['SQL_SURVIVOR'])
  })

  it('awards UNDEFINED_NO_MORE at 50 total completed kata', async () => {
    db.earnedSlugs = ['FIRST_KATA']
    db.scriptSelects([[], [], [], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 50 }]])
    await fireSessionCompleted(db)

    expect(awardedSlugs(db)).toEqual(['UNDEFINED_NO_MORE'])
  })

  it('tolerates a missing count row (row?.count ?? 0 guard) without awarding', async () => {
    db.earnedSlugs = ['FIRST_KATA']
    // Empty result arrays for every count query → `[row]` is undefined → 0.
    db.scriptSelects([[], [], [], [], [], [], [], [], []])
    await fireSessionCompleted(db)

    expect(awardedSlugs(db)).toEqual([])
  })
})

describe('MilestoneEventHandler — ScrollCompleted', () => {
  const scrollCompleted = (overrides: Partial<ScrollCompleted> = {}): ScrollCompleted => ({
    type: 'ScrollCompleted',
    aggregateId: 'scroll-1',
    occurredAt: new Date(),
    userId: 'user-1',
    scrollSlug: 'javascript-dom-fundamentals',
    totalSteps: 10,
    ...overrides,
  })

  const fireScrollCompleted = async (db: FakeDb, event: ScrollCompleted) => {
    const bus = new InMemoryEventBus()
    registerMilestoneHandlers(bus, db as never)
    await bus.publish(event)
  }

  it('maps a known scroll slug to its milestone and awards it with a null session id', async () => {
    const db = new FakeDb()
    await fireScrollCompleted(db, scrollCompleted({ scrollSlug: 'sql-deep-cuts' }))

    expect(db.awarded).toEqual([{ milestoneSlug: 'COURSE_SQL_DEEP_CUTS', sessionId: null }])
  })

  it('silently skips an unknown scroll slug (no milestone configured)', async () => {
    const db = new FakeDb()
    await fireScrollCompleted(db, scrollCompleted({ scrollSlug: 'totally-unknown-scroll' }))

    expect(db.awarded).toEqual([])
  })

  it('does not re-award a scroll milestone the user already earned', async () => {
    const db = new FakeDb()
    db.earnedSlugs = ['COURSE_JAVASCRIPT_DOM_FUNDAMENTALS']
    await fireScrollCompleted(db, scrollCompleted({ scrollSlug: 'javascript-dom-fundamentals' }))

    expect(db.awarded).toEqual([])
  })
})

// getCurrentStreak counts back from today over distinct completion DATES.
// Produce `n` consecutive days ending today, matching the handler's date math.
function streakRows(n: number): Array<{ date: string }> {
  const rows: Array<{ date: string }> = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    rows.push({ date: d.toISOString().slice(0, 10) })
    d.setDate(d.getDate() - 1)
  }
  return rows
}
