import { describe, expect, it, vi } from 'vitest'
import { PostgresScrollProgressRepository } from './PostgresScrollProgressRepository'
import type { DB } from './drizzle/client'
import type { ProgressOwner } from '../../domain/learning/ports'

// The boundary here is the injected `db` (a drizzle instance). We feed raw rows
// through `db.query.scrollProgress.find*` and assert the repository's toDomain
// transformation — owner discrimination + completedSteps coercion — not drizzle.

function makeDb(overrides: Record<string, unknown> = {}): DB {
  return {
    query: {
      scrollProgress: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as DB
}

const LAST = new Date('2026-06-18T08:00:00.000Z')

function userRow(over: Record<string, unknown> = {}) {
  return {
    id: 'row-1',
    userId: 'user-42',
    anonymousSessionId: null,
    scrollId: 'scroll-py',
    completedSteps: ['s1', 's2'],
    lastAccessedAt: LAST,
    ...over,
  }
}

function anonRow(over: Record<string, unknown> = {}) {
  return {
    id: 'row-2',
    userId: null,
    anonymousSessionId: 'anon-sess-9',
    scrollId: 'scroll-js',
    completedSteps: ['a1'],
    lastAccessedAt: LAST,
    ...over,
  }
}

describe('PostgresScrollProgressRepository.findByOwnerAndScroll', () => {
  it('maps a user-owned row to a { kind: user } domain progress', async () => {
    const db = makeDb()
    vi.mocked(db.query.scrollProgress.findFirst).mockResolvedValue(userRow())
    const repo = new PostgresScrollProgressRepository(db)

    const owner: ProgressOwner = { kind: 'user', userId: 'user-42' }
    const result = await repo.findByOwnerAndScroll(owner, 'scroll-py')

    expect(result).toEqual({
      owner: { kind: 'user', userId: 'user-42' },
      scrollId: 'scroll-py',
      completedSteps: ['s1', 's2'],
      lastAccessedAt: LAST,
    })
  })

  it('maps an anonymous row (userId null) to a { kind: anonymous } domain progress', async () => {
    const db = makeDb()
    vi.mocked(db.query.scrollProgress.findFirst).mockResolvedValue(anonRow())
    const repo = new PostgresScrollProgressRepository(db)

    const result = await repo.findByOwnerAndScroll(
      { kind: 'anonymous', sessionId: 'anon-sess-9' },
      'scroll-js',
    )

    expect(result).toEqual({
      owner: { kind: 'anonymous', sessionId: 'anon-sess-9' },
      scrollId: 'scroll-js',
      completedSteps: ['a1'],
      lastAccessedAt: LAST,
    })
  })

  it('returns null (not a throw) when no row is found', async () => {
    const db = makeDb()
    vi.mocked(db.query.scrollProgress.findFirst).mockResolvedValue(undefined)
    const repo = new PostgresScrollProgressRepository(db)

    const result = await repo.findByOwnerAndScroll({ kind: 'user', userId: 'x' }, 's')
    expect(result).toBeNull()
  })
})

describe('PostgresScrollProgressRepository.findAllForOwner', () => {
  it('maps every row, discriminating owner kind per row', async () => {
    const db = makeDb()
    vi.mocked(db.query.scrollProgress.findMany).mockResolvedValue([userRow(), anonRow()])
    const repo = new PostgresScrollProgressRepository(db)

    const result = await repo.findAllForOwner({ kind: 'user', userId: 'user-42' })

    expect(result).toHaveLength(2)
    expect(result[0]?.owner).toEqual({ kind: 'user', userId: 'user-42' })
    expect(result[1]?.owner).toEqual({ kind: 'anonymous', sessionId: 'anon-sess-9' })
  })

  it('returns an empty array when there are no rows', async () => {
    const db = makeDb()
    vi.mocked(db.query.scrollProgress.findMany).mockResolvedValue([])
    const repo = new PostgresScrollProgressRepository(db)

    expect(await repo.findAllForOwner({ kind: 'user', userId: 'x' })).toEqual([])
  })
})

describe('PostgresScrollProgressRepository.save', () => {
  it('UPDATEs (not INSERTs) when a row already exists for the owner+scroll', async () => {
    const db = makeDb()
    // findByOwnerAndScroll is called internally to decide update-vs-insert.
    vi.mocked(db.query.scrollProgress.findFirst).mockResolvedValue(userRow())

    const setSpy = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
    const updateSpy = vi.fn().mockReturnValue({ set: setSpy })
    const insertSpy = vi.fn()
    const db2 = makeDb({ update: updateSpy, insert: insertSpy })
    // reuse the configured findFirst on db2
    vi.mocked(db2.query.scrollProgress.findFirst).mockResolvedValue(userRow())

    const repo = new PostgresScrollProgressRepository(db2)
    await repo.save({
      owner: { kind: 'user', userId: 'user-42' },
      scrollId: 'scroll-py',
      completedSteps: ['s1', 's2', 's3'],
      lastAccessedAt: LAST,
    })

    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(insertSpy).not.toHaveBeenCalled()
    // The mapped set payload carries the new completedSteps, not the stale ones.
    expect(setSpy).toHaveBeenCalledWith({
      completedSteps: ['s1', 's2', 's3'],
      lastAccessedAt: LAST,
    })
  })

  it('INSERTs with the user shape (anonymousSessionId null) when no row exists', async () => {
    const valuesSpy = vi.fn().mockResolvedValue(undefined)
    const insertSpy = vi.fn().mockReturnValue({ values: valuesSpy })
    const db = makeDb({ insert: insertSpy })
    vi.mocked(db.query.scrollProgress.findFirst).mockResolvedValue(undefined)

    const repo = new PostgresScrollProgressRepository(db)
    await repo.save({
      owner: { kind: 'user', userId: 'user-42' },
      scrollId: 'scroll-py',
      completedSteps: ['s1'],
      lastAccessedAt: LAST,
    })

    expect(insertSpy).toHaveBeenCalledTimes(1)
    expect(valuesSpy).toHaveBeenCalledWith({
      userId: 'user-42',
      anonymousSessionId: null,
      scrollId: 'scroll-py',
      completedSteps: ['s1'],
      lastAccessedAt: LAST,
    })
  })

  it('INSERTs with the anonymous shape (userId null) when no row exists', async () => {
    const valuesSpy = vi.fn().mockResolvedValue(undefined)
    const insertSpy = vi.fn().mockReturnValue({ values: valuesSpy })
    const db = makeDb({ insert: insertSpy })
    vi.mocked(db.query.scrollProgress.findFirst).mockResolvedValue(undefined)

    const repo = new PostgresScrollProgressRepository(db)
    await repo.save({
      owner: { kind: 'anonymous', sessionId: 'anon-sess-9' },
      scrollId: 'scroll-js',
      completedSteps: [],
      lastAccessedAt: LAST,
    })

    expect(valuesSpy).toHaveBeenCalledWith({
      userId: null,
      anonymousSessionId: 'anon-sess-9',
      scrollId: 'scroll-js',
      completedSteps: [],
      lastAccessedAt: LAST,
    })
  })
})
