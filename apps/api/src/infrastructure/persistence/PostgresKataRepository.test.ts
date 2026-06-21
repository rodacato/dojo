import { describe, expect, it, vi } from 'vitest'
import { PostgresKataRepository } from './PostgresKataRepository'
import type { DB } from './drizzle/client'
import { UserId } from '../../domain/shared/types'

// Boundary = injected drizzle `db`. toKata is exercised via findById
// (db.query.katas.findFirst); groupRowsToKatas via findEligible (db.execute,
// which returns a flat JOIN result we expect the repo to fold by kata id). The
// SQL text built for the ORDER BY / interest weighting is NOT under test — only
// the row->domain folding and default handling are.

const CREATED = new Date('2026-01-01T00:00:00.000Z')
const V_CREATED = new Date('2026-02-02T00:00:00.000Z')

function makeFindFirstDb(row: unknown): DB {
  return {
    query: { katas: { findFirst: vi.fn().mockResolvedValue(row) } },
  } as unknown as DB
}

function makeExecuteDb(resultSets: unknown[][]): DB {
  const execute = vi.fn()
  for (const set of resultSets) execute.mockResolvedValueOnce(set)
  return { execute } as unknown as DB
}

function kataRow(over: Record<string, unknown> = {}) {
  return {
    id: 'kata-1',
    title: 'Binary Search',
    description: 'find it',
    duration: 30,
    difficulty: 'medium',
    category: 'algorithms',
    type: 'code',
    status: 'published',
    language: ['python'],
    tags: ['search'],
    topics: ['arrays'],
    createdBy: 'user-1',
    createdAt: CREATED,
    testCode: 'assert',
    starterCode: 'pass',
    rubric: { criteria: ['x'] },
    version: 3,
    adminNotes: 'note',
    updatedAt: new Date('2026-03-03T00:00:00.000Z'),
    variations: [
      {
        id: 'var-1',
        kataId: 'kata-1',
        ownerRole: 'staff',
        ownerContext: 'context A',
        createdAt: V_CREATED,
      },
    ],
    ...over,
  }
}

// Flat JOIN row shape returned by db.execute for findEligible.
function eligibleRow(over: Record<string, unknown> = {}) {
  return {
    id: 'kata-1',
    title: 'Binary Search',
    description: 'find it',
    duration: 30,
    difficulty: 'medium',
    category: 'algorithms',
    type: 'code',
    status: 'published',
    language: ['python'],
    tags: ['search'],
    topics: ['arrays'],
    owner_role: 'staff',
    owner_context: 'context A',
    created_by: 'user-1',
    created_at: CREATED,
    variation_id: 'var-1',
    v_owner_role: 'staff',
    v_owner_context: 'context A',
    v_created_at: V_CREATED,
    ...over,
  }
}

describe('PostgresKataRepository.findById (toKata mapping)', () => {
  it('maps the row and nested variations into a Kata', async () => {
    const repo = new PostgresKataRepository(makeFindFirstDb(kataRow()))
    const kata = await repo.findById('kata-1' as never)

    expect(kata).not.toBeNull()
    expect(kata?.id).toBe('kata-1')
    expect(kata?.title).toBe('Binary Search')
    expect(kata?.durationMinutes).toBe(30) // row.duration -> durationMinutes
    expect(kata?.difficulty).toBe('medium')
    expect(kata?.type).toBe('code')
    expect(kata?.status).toBe('published')
    expect(kata?.languages).toEqual(['python']) // row.language -> languages
    expect(kata?.testCode).toBe('assert')
    expect(kata?.rubric).toEqual({ criteria: ['x'] })
    expect(kata?.version).toBe(3)
    expect(kata?.createdBy).toBe('user-1')
    expect(kata?.createdAt).toBe(CREATED)

    expect(kata?.variations).toEqual([
      {
        id: 'var-1',
        kataId: 'kata-1',
        ownerRole: 'staff',
        ownerContext: 'context A',
        createdAt: V_CREATED,
      },
    ])
  })

  it('applies defaults for absent optional columns (version->1, nulls, no updatedAt)', async () => {
    const repo = new PostgresKataRepository(
      makeFindFirstDb(
        kataRow({
          testCode: null,
          starterCode: null,
          rubric: null,
          version: undefined,
          adminNotes: undefined,
          updatedAt: undefined,
        }),
      ),
    )
    const kata = await repo.findById('kata-1' as never)

    expect(kata?.testCode).toBeNull()
    expect(kata?.starterCode).toBeNull()
    expect(kata?.rubric).toBeNull()
    expect(kata?.version).toBe(1) // undefined -> default 1
    expect(kata?.adminNotes).toBeNull()
    expect(kata?.updatedAt).toBeNull()
  })

  it('returns null when no kata row is found', async () => {
    const repo = new PostgresKataRepository(makeFindFirstDb(undefined))
    expect(await repo.findById('missing' as never)).toBeNull()
  })
})

describe('PostgresKataRepository.findEligible (groupRowsToKatas folding)', () => {
  it('folds multiple JOIN rows of the same kata id into one Kata with many variations', async () => {
    const rows = [
      eligibleRow({ variation_id: 'var-1', v_owner_role: 'staff', v_owner_context: 'ctx-1' }),
      eligibleRow({ variation_id: 'var-2', v_owner_role: 'guest', v_owner_context: 'ctx-2' }),
    ]
    const repo = new PostgresKataRepository(makeExecuteDb([rows]))

    const katas = await repo.findEligible(UserId('u'), {})

    expect(katas).toHaveLength(1) // two rows, one kata
    expect(katas[0]?.id).toBe('kata-1')
    expect(katas[0]?.variations.map((v) => v.id)).toEqual(['var-1', 'var-2'])
    expect(katas[0]?.variations.map((v) => v.ownerContext)).toEqual(['ctx-1', 'ctx-2'])
  })

  it('maps snake_case JOIN columns into the domain Kata (created_by, created_at, language)', async () => {
    const repo = new PostgresKataRepository(makeExecuteDb([[eligibleRow()]]))
    const katas = await repo.findEligible(UserId('u'), {})

    const kata = katas[0]
    expect(kata?.createdBy).toBe('user-1') // created_by
    expect(kata?.createdAt).toBe(CREATED) // created_at
    expect(kata?.durationMinutes).toBe(30) // duration
    expect(kata?.languages).toEqual(['python']) // language
    expect(kata?.variations[0]?.createdAt).toBe(V_CREATED) // v_created_at
    // Columns absent from the JOIN projection default cleanly.
    expect(kata?.version).toBe(1)
    expect(kata?.testCode).toBeNull()
    expect(kata?.updatedAt).toBeNull()
  })

  it('keeps distinct kata ids as separate Katas', async () => {
    const rows = [eligibleRow({ id: 'k1' }), eligibleRow({ id: 'k2', variation_id: 'v9' })]
    const repo = new PostgresKataRepository(makeExecuteDb([rows]))

    const katas = await repo.findEligible(UserId('u'), {})
    expect(katas.map((k) => k.id).sort()).toEqual(['k1', 'k2'])
  })

  it('falls back to the second query when the primary returns no rows', async () => {
    // primary empty -> fallback returns one kata.
    const repo = new PostgresKataRepository(makeExecuteDb([[], [eligibleRow({ id: 'fb' })]]))
    const katas = await repo.findEligible(UserId('u'), {})

    expect(katas).toHaveLength(1)
    expect(katas[0]?.id).toBe('fb')
  })

  it('returns an empty array when both primary and fallback are empty', async () => {
    const repo = new PostgresKataRepository(makeExecuteDb([[], []]))
    expect(await repo.findEligible(UserId('u'), {})).toEqual([])
  })
})
