import { describe, expect, it, afterEach, vi } from 'vitest'
import type { SQL } from 'drizzle-orm'
import { attempts, sessions } from '../../persistence/drizzle/schema'
import { calculateStreak, verdictSubquery } from './query-helpers'

// verdictSubquery builds a drizzle SQL fragment. We assert on its queryChunks:
// StringChunks carry literal SQL text; Column/Table chunks ARE the schema
// objects referenced. Asserting identity on those columns catches a swap like
// sessions.id -> attempts.id that a string-only check would miss.
function stringChunks(query: SQL): string[] {
  return query.queryChunks
    .filter((chunk) => chunk?.constructor?.name === 'StringChunk')
    .map((chunk) => (chunk as { value: string[] }).value.join(''))
}

function columnChunks(query: SQL): unknown[] {
  return query.queryChunks.filter((chunk) => {
    const name = chunk?.constructor?.name
    return name !== 'StringChunk' && name !== undefined
  })
}

describe('verdictSubquery', () => {
  it('extracts the verdict key from the llm_response JSON column', () => {
    const joined = stringChunks(verdictSubquery()).join(' ')
    expect(joined).toContain("::jsonb->>'verdict'")
    expect(joined).toContain('SELECT')
    expect(joined).toContain('LIMIT 1')
  })

  it('filters to the final evaluation row only', () => {
    const joined = stringChunks(verdictSubquery()).join(' ')
    expect(joined).toContain('= true')
  })

  it('references the exact schema columns and table (not lookalikes)', () => {
    const columns = columnChunks(verdictSubquery())
    // llm_response is selected, the FROM table is attempts, and the WHERE
    // correlates attempts.session_id to the outer sessions.id, gated on
    // attempts.is_final_evaluation.
    expect(columns).toContain(attempts.llmResponse)
    expect(columns).toContain(attempts)
    expect(columns).toContain(attempts.sessionId)
    expect(columns).toContain(sessions.id)
    expect(columns).toContain(attempts.isFinalEvaluation)
  })

  it('correlates attempts.session_id against the outer sessions.id (correct order)', () => {
    const columns = columnChunks(verdictSubquery())
    // The WHERE is `attempts.session_id = sessions.id`. attempts.sessionId must
    // appear before sessions.id; a flipped correlation would be a real bug.
    const left = columns.indexOf(attempts.sessionId)
    const right = columns.indexOf(sessions.id)
    expect(left).toBeGreaterThanOrEqual(0)
    expect(right).toBeGreaterThan(left)
  })

  it('does not leak unrelated schema columns into the fragment', () => {
    const columns = columnChunks(verdictSubquery())
    expect(columns).not.toContain(sessions.userId)
    expect(columns).not.toContain(attempts.id)
  })

  it('builds a fresh SQL object on each call (no shared mutable state)', () => {
    expect(verdictSubquery()).not.toBe(verdictSubquery())
  })
})

describe('calculateStreak', () => {
  // Fixed at noon UTC so toISOString().slice(0,10) inside the function is
  // unambiguous regardless of the runner's local timezone.
  const NOW = new Date('2026-06-15T12:00:00.000Z')

  afterEach(() => {
    vi.useRealTimers()
  })

  function freezeNow(): void {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  }

  it('returns 0 for no sessions', () => {
    freezeNow()
    expect(calculateStreak([])).toBe(0)
  })

  it('counts a single session today as a streak of 1', () => {
    freezeNow()
    expect(calculateStreak(['2026-06-15'])).toBe(1)
  })

  it('counts consecutive days ending today', () => {
    freezeNow()
    expect(calculateStreak(['2026-06-15', '2026-06-14', '2026-06-13'])).toBe(3)
  })

  it('breaks the streak on a gap and counts only up to the gap', () => {
    freezeNow()
    // today present, yesterday missing, day-before present -> streak is 1.
    expect(calculateStreak(['2026-06-15', '2026-06-13'])).toBe(1)
  })

  it('starts from yesterday when there is no session today', () => {
    freezeNow()
    // No 06-15. Backfills from 06-14 -> counts 06-14 and 06-13.
    expect(calculateStreak(['2026-06-14', '2026-06-13'])).toBe(2)
  })

  it('returns 0 when neither today nor yesterday have a session', () => {
    freezeNow()
    expect(calculateStreak(['2026-06-13', '2026-06-12'])).toBe(0)
  })

  it('is order-independent and deduplicates dates', () => {
    freezeNow()
    expect(
      calculateStreak(['2026-06-13', '2026-06-15', '2026-06-14', '2026-06-15']),
    ).toBe(3)
  })

  it('ignores future-dated sessions (no streak from the future)', () => {
    freezeNow()
    expect(calculateStreak(['2026-06-16', '2026-06-17'])).toBe(0)
  })

  it('crosses a month boundary correctly', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-01T12:00:00.000Z'))
    expect(calculateStreak(['2026-07-01', '2026-06-30', '2026-06-29'])).toBe(3)
  })

  it('crosses a leap-day boundary correctly', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2028-03-01T12:00:00.000Z'))
    expect(calculateStreak(['2028-03-01', '2028-02-29', '2028-02-28'])).toBe(3)
  })

})
