import { describe, expect, it, vi } from 'vitest'
import { PostgresSessionRepository } from './PostgresSessionRepository'
import type { DB } from './drizzle/client'
import { AttemptId, SessionId, UserId } from '../../domain/shared/types'
import type { EvaluationResult } from '../../domain/practice/values'

// Boundary = the injected drizzle `db`. We feed raw rows through
// `db.query.sessions.findFirst` and the `db.select()...` chain, and assert the
// repository's row->domain transformation (attempt JSON.parse, completedAt
// default, topics array guard). Drizzle query building itself is not tested.

const STARTED = new Date('2026-06-20T10:00:00.000Z')
const COMPLETED = new Date('2026-06-20T10:12:00.000Z')
const SUBMITTED = new Date('2026-06-20T10:05:00.000Z')

const EVAL: EvaluationResult = {
  verdict: 'passed',
  analysis: 'solid',
  topicsToReview: ['recursion'],
  followUpQuestion: null,
  isFinalEvaluation: true,
}

function sessionRow(over: Record<string, unknown> = {}) {
  return {
    id: 'sess-1',
    userId: 'user-1',
    kataId: 'kata-1',
    variationId: 'var-1',
    body: 'the problem body',
    status: 'completed',
    startedAt: STARTED,
    completedAt: COMPLETED,
    attempts: [],
    ...over,
  }
}

function attemptRow(over: Record<string, unknown> = {}) {
  return {
    id: 'att-1',
    sessionId: 'sess-1',
    userResponse: 'my answer',
    llmResponse: JSON.stringify(EVAL),
    isFinalEvaluation: true,
    submittedAt: SUBMITTED,
    ...over,
  }
}

function makeDb(): DB {
  return {
    query: { sessions: { findFirst: vi.fn() } },
    select: vi.fn(),
  } as unknown as DB
}

describe('PostgresSessionRepository.findById (toSession mapping)', () => {
  it('maps a session row with scalar fields and preserves completedAt', async () => {
    const db = makeDb()
    vi.mocked(db.query.sessions.findFirst).mockResolvedValue(sessionRow())
    const repo = new PostgresSessionRepository(db)

    const session = await repo.findById('sess-1' as never)

    expect(session).not.toBeNull()
    expect(session?.id).toBe('sess-1')
    expect(session?.userId).toBe('user-1')
    expect(session?.kataId).toBe('kata-1')
    expect(session?.variationId).toBe('var-1')
    expect(session?.body).toBe('the problem body')
    expect(session?.status).toBe('completed')
    expect(session?.startedAt).toBe(STARTED)
    expect(session?.completedAt).toBe(COMPLETED)
  })

  it('coerces a null completedAt to null (not undefined)', async () => {
    const db = makeDb()
    vi.mocked(db.query.sessions.findFirst).mockResolvedValue(
      sessionRow({ completedAt: null, status: 'active' }),
    )
    const repo = new PostgresSessionRepository(db)

    const session = await repo.findById('sess-1' as never)
    expect(session?.completedAt).toBeNull()
  })

  it('JSON.parses each attempt llmResponse into an EvaluationResult', async () => {
    const db = makeDb()
    vi.mocked(db.query.sessions.findFirst).mockResolvedValue(
      sessionRow({ attempts: [attemptRow()] }),
    )
    const repo = new PostgresSessionRepository(db)

    const session = await repo.findById('sess-1' as never)
    const attempt = session?.attempts[0]

    expect(attempt?.id).toBe('att-1')
    expect(attempt?.userResponse).toBe('my answer')
    expect(attempt?.isFinalEvaluation).toBe(true)
    expect(attempt?.submittedAt).toBe(SUBMITTED)
    // The string column must be parsed back into the structured result.
    expect(attempt?.evaluationResult).toEqual(EVAL)
  })

  it('maps a null llmResponse to a null evaluationResult (no JSON.parse on null)', async () => {
    const db = makeDb()
    vi.mocked(db.query.sessions.findFirst).mockResolvedValue(
      sessionRow({ attempts: [attemptRow({ llmResponse: null })] }),
    )
    const repo = new PostgresSessionRepository(db)

    const session = await repo.findById('sess-1' as never)
    expect(session?.attempts[0]?.evaluationResult).toBeNull()
  })

  it('returns null when no row matches', async () => {
    const db = makeDb()
    vi.mocked(db.query.sessions.findFirst).mockResolvedValue(undefined)
    const repo = new PostgresSessionRepository(db)

    expect(await repo.findById('missing' as never)).toBeNull()
  })
})

describe('PostgresSessionRepository.listCompletedKataHistoryForBelt', () => {
  function makeSelectDb(rows: unknown[]): DB {
    const orderBy = vi.fn().mockResolvedValue(rows)
    const where = vi.fn().mockReturnValue({ orderBy })
    const innerJoin = vi.fn().mockReturnValue({ where })
    const from = vi.fn().mockReturnValue({ innerJoin })
    const select = vi.fn().mockReturnValue({ from })
    return { select } as unknown as DB
  }

  it('maps each joined row to { startedAt, topics } preserving array topics', async () => {
    const db = makeSelectDb([
      { startedAt: STARTED, topics: ['recursion', 'trees'] },
      { startedAt: COMPLETED, topics: ['dp'] },
    ])
    const repo = new PostgresSessionRepository(db)

    const history = await repo.listCompletedKataHistoryForBelt(UserId('user-1'))

    expect(history).toEqual([
      { startedAt: STARTED, topics: ['recursion', 'trees'] },
      { startedAt: COMPLETED, topics: ['dp'] },
    ])
  })

  it('coerces a non-array topics column to [] (defensive guard)', async () => {
    const db = makeSelectDb([
      { startedAt: STARTED, topics: null },
      { startedAt: COMPLETED, topics: 'not-an-array' },
    ])
    const repo = new PostgresSessionRepository(db)

    const history = await repo.listCompletedKataHistoryForBelt(UserId('user-1'))

    expect(history).toEqual([
      { startedAt: STARTED, topics: [] },
      { startedAt: COMPLETED, topics: [] },
    ])
  })

  it('returns an empty array when there are no completed sessions', async () => {
    const db = makeSelectDb([])
    const repo = new PostgresSessionRepository(db)
    expect(await repo.listCompletedKataHistoryForBelt(UserId('user-1'))).toEqual([])
  })
})

describe('PostgresSessionRepository.saveIncompleteAttempt', () => {
  it('inserts a non-final attempt with onConflictDoNothing', async () => {
    const onConflictDoNothing = vi.fn().mockResolvedValue(undefined)
    const values = vi.fn().mockReturnValue({ onConflictDoNothing })
    const insert = vi.fn().mockReturnValue({ values })
    const db = { insert } as unknown as DB
    const repo = new PostgresSessionRepository(db)

    await repo.saveIncompleteAttempt({
      attemptId: AttemptId('att-9'),
      sessionId: SessionId('sess-9'),
      userResponse: 'half an answer',
      llmResponse: 'partial tokens',
    })

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'att-9',
        sessionId: 'sess-9',
        userResponse: 'half an answer',
        llmResponse: 'partial tokens',
        isFinalEvaluation: false,
      }),
    )
    expect(onConflictDoNothing).toHaveBeenCalled()
  })
})
