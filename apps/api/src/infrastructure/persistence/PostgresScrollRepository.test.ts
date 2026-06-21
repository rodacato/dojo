import { describe, expect, it, vi } from 'vitest'
import { PostgresScrollRepository } from './PostgresScrollRepository'
import type { DB } from './drizzle/client'

// Boundary = injected drizzle `db`. We feed raw scroll-with-relations rows
// through `db.query.scrolls.find*` and assert toScroll/toLesson/toStep: the
// in-memory order re-sort, null defaults, and the empty->null branch. The
// drizzle relational query builder is not under test.

function makeDb(): DB {
  return {
    query: { scrolls: { findFirst: vi.fn(), findMany: vi.fn() } },
  } as unknown as DB
}

function stepRow(over: Record<string, unknown> = {}) {
  return {
    id: 'step-1',
    lessonId: 'lesson-1',
    order: 0,
    type: 'code',
    title: 'Step title',
    instruction: 'do the thing',
    starterCode: 'x = 1',
    testCode: 'assert x',
    hint: 'a hint',
    hints: ['h1', 'h2'],
    solution: 'x = 2',
    alternativeApproach: 'another way',
    data: { kind: 'predict' },
    ...over,
  }
}

function lessonRow(over: Record<string, unknown> = {}) {
  return {
    id: 'lesson-1',
    scrollId: 'scroll-1',
    order: 0,
    title: 'Lesson title',
    outcome: 'learner can X',
    steps: [stepRow()],
    ...over,
  }
}

function scrollRow(over: Record<string, unknown> = {}) {
  return {
    id: 'scroll-1',
    slug: 'python',
    title: 'Python Basics',
    description: 'a scroll',
    language: 'python',
    accentColor: '#10B981',
    status: 'published',
    isPublic: true,
    estimatedMinutes: 30,
    externalReferences: [{ label: 'docs', url: 'https://x' }],
    lessons: [lessonRow()],
    ...over,
  }
}

describe('PostgresScrollRepository.findBySlug (toScroll mapping)', () => {
  it('maps a full scroll graph field-for-field', async () => {
    const db = makeDb()
    vi.mocked(db.query.scrolls.findFirst).mockResolvedValue(scrollRow())
    const repo = new PostgresScrollRepository(db)

    const scroll = await repo.findBySlug('python')

    expect(scroll).toEqual({
      id: 'scroll-1',
      slug: 'python',
      title: 'Python Basics',
      description: 'a scroll',
      language: 'python',
      accentColor: '#10B981',
      status: 'published',
      isPublic: true,
      estimatedMinutes: 30,
      externalReferences: [{ label: 'docs', url: 'https://x' }],
      lessons: [
        {
          id: 'lesson-1',
          order: 0,
          title: 'Lesson title',
          outcome: 'learner can X',
          steps: [
            {
              id: 'step-1',
              order: 0,
              type: 'code',
              title: 'Step title',
              instruction: 'do the thing',
              starterCode: 'x = 1',
              testCode: 'assert x',
              hint: 'a hint',
              hints: ['h1', 'h2'],
              solution: 'x = 2',
              alternativeApproach: 'another way',
              data: { kind: 'predict' },
            },
          ],
        },
      ],
    })
  })

  it('re-sorts lessons and steps by their order field, regardless of DB order', async () => {
    const db = makeDb()
    vi.mocked(db.query.scrolls.findFirst).mockResolvedValue(
      scrollRow({
        lessons: [
          lessonRow({
            id: 'L2',
            order: 2,
            steps: [stepRow({ id: 'sB', order: 5 }), stepRow({ id: 'sA', order: 1 })],
          }),
          lessonRow({ id: 'L1', order: 1, steps: [stepRow({ id: 'sC', order: 0 })] }),
        ],
      }),
    )
    const repo = new PostgresScrollRepository(db)

    const scroll = await repo.findBySlug('python')

    expect(scroll?.lessons.map((l) => l.id)).toEqual(['L1', 'L2'])
    expect(scroll?.lessons[1]?.steps.map((s) => s.id)).toEqual(['sA', 'sB'])
  })

  it('applies null defaults: estimatedMinutes, externalReferences, outcome, hints, data', async () => {
    const db = makeDb()
    vi.mocked(db.query.scrolls.findFirst).mockResolvedValue(
      scrollRow({
        estimatedMinutes: null,
        externalReferences: null,
        lessons: [
          lessonRow({
            outcome: null,
            steps: [stepRow({ hints: null, data: null })],
          }),
        ],
      }),
    )
    const repo = new PostgresScrollRepository(db)

    const scroll = await repo.findBySlug('python')

    expect(scroll?.estimatedMinutes).toBeNull()
    expect(scroll?.externalReferences).toEqual([]) // null -> []
    expect(scroll?.lessons[0]?.outcome).toBeNull()
    expect(scroll?.lessons[0]?.steps[0]?.hints).toBeNull()
    expect(scroll?.lessons[0]?.steps[0]?.data).toBeNull()
  })

  it('returns null when no scroll matches the slug', async () => {
    const db = makeDb()
    vi.mocked(db.query.scrolls.findFirst).mockResolvedValue(undefined)
    const repo = new PostgresScrollRepository(db)
    expect(await repo.findBySlug('nope')).toBeNull()
  })
})

describe('PostgresScrollRepository.findById', () => {
  it('returns null when no scroll matches the id', async () => {
    const db = makeDb()
    vi.mocked(db.query.scrolls.findFirst).mockResolvedValue(undefined)
    const repo = new PostgresScrollRepository(db)
    expect(await repo.findById('x')).toBeNull()
  })

  it('maps the matched row to a domain scroll', async () => {
    const db = makeDb()
    vi.mocked(db.query.scrolls.findFirst).mockResolvedValue(scrollRow({ id: 'sc-9' }))
    const repo = new PostgresScrollRepository(db)
    const scroll = await repo.findById('sc-9')
    expect(scroll?.id).toBe('sc-9')
    expect(scroll?.lessons).toHaveLength(1)
  })
})

describe('PostgresScrollRepository.findAllPublished / findAllPublic', () => {
  it('maps every returned row through toScroll', async () => {
    const db = makeDb()
    vi.mocked(db.query.scrolls.findMany).mockResolvedValue([
      scrollRow({ id: 'a' }),
      scrollRow({ id: 'b' }),
    ])
    const repo = new PostgresScrollRepository(db)

    const scrolls = await repo.findAllPublished()
    expect(scrolls.map((s) => s.id)).toEqual(['a', 'b'])
    expect(scrolls[0]?.lessons[0]?.steps).toHaveLength(1)
  })

  it('returns an empty array when nothing is published', async () => {
    const db = makeDb()
    vi.mocked(db.query.scrolls.findMany).mockResolvedValue([])
    const repo = new PostgresScrollRepository(db)
    expect(await repo.findAllPublished()).toEqual([])
  })
})
