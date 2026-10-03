import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_STATE_BYTES, recordScrollProgressSchema } from '@dojo/shared'
import type { ProgressOwner } from '../../domain/scrolls/progress'
import { ScrollProgressNotEnabledError, ScrollUnitNotFoundError } from '../../domain/scrolls/progress-errors'
import { ScrollLoginRequiredError, ScrollNotFoundError } from '../../domain/shared/errors'
import { InMemoryScrollProgressRepository } from '../../test/scroll-progress'
import { InMemoryScrollRepository, testManifest, testScrollEntry } from '../../test/scrolls'
import { GetScrollProgress } from './GetScrollProgress'
import { MergeAnonymousScrollProgress } from './MergeAnonymousScrollProgress'
import { RecordScrollProgress } from './RecordScrollProgress'
import { deriveUserRef } from './userRef'

const SECRET = 'a-secret-that-is-at-least-32-characters-long'
const manifest = { ...testManifest, units: [{ id: 'A' }, { id: 'B' }, { id: 'C' }] }

const userX: ProgressOwner = { kind: 'user', userId: 'user-x' }
const userY: ProgressOwner = { kind: 'user', userId: 'user-y' }
const anon: ProgressOwner = { kind: 'anonymous', anonymousId: 'anon-1' }

let scrollRepo: InMemoryScrollRepository
let progressRepo: InMemoryScrollProgressRepository
let clock: number

const tick = () => new Date(Date.UTC(2026, 9, 3, 0, 0, clock++))

function useCases() {
  const deps = { scrollRepo, progressRepo, userRefSecret: SECRET }
  return {
    get: new GetScrollProgress(deps),
    record: new RecordScrollProgress({ ...deps, now: tick }),
    merge: new MergeAnonymousScrollProgress({ progressRepo }),
  }
}

async function seedScroll(over: Parameters<typeof testScrollEntry>[0] = {}) {
  const entry = testScrollEntry({ status: 'published', manifest, ...over })
  await scrollRepo.insert(entry)
  return entry
}

const progress = (unitId: string, extra: Record<string, unknown> = {}) =>
  recordScrollProgressSchema.parse({ type: 'progress', unitId, ...extra })

beforeEach(() => {
  scrollRepo = new InMemoryScrollRepository()
  progressRepo = new InMemoryScrollProgressRepository()
  clock = 0
})

describe('RecordScrollProgress and GetScrollProgress', () => {
  it('returns what was recorded, so the next init carries it', async () => {
    await seedScroll({ slug: 'pc' })
    const { record, get } = useCases()

    await record.execute('pc', userX, progress('A', { completed: true, state: { step: 4 } }))
    await record.execute('pc', userX, progress('B', { state: 'draft' }))
    await record.execute('pc', userX, { type: 'complete' })

    const view = await get.execute('pc', userX)
    expect(view.units).toEqual({ A: { completed: true, state: { step: 4 } }, B: { completed: false, state: 'draft' } })
    expect(view.completed).toBe(true)
    expect(view.updatedAt).not.toBeNull()
  })

  it('keeps earlier completion and state when a later report omits them', async () => {
    await seedScroll({ slug: 'pc' })
    const { record, get } = useCases()

    await record.execute('pc', userX, progress('A', { completed: true, state: { n: 1 } }))
    await record.execute('pc', userX, progress('A'))
    await record.execute('pc', userX, { type: 'complete', unitId: 'A' })

    expect((await get.execute('pc', userX)).units['A']).toEqual({ completed: true, state: { n: 1 } })
  })

  it('completing the scroll does not complete its units', async () => {
    await seedScroll({ slug: 'pc' })
    const { record } = useCases()

    const view = await record.execute('pc', userX, { type: 'complete' })

    expect(view.completed).toBe(true)
    expect(view.units).toEqual({})
  })

  it('is empty before anything is recorded', async () => {
    await seedScroll({ slug: 'pc' })
    expect(await useCases().get.execute('pc', userX)).toMatchObject({ completed: false, units: {}, updatedAt: null })
  })

  it('rejects a unit that is not in the manifest and stores nothing', async () => {
    await seedScroll({ slug: 'pc' })
    const { record } = useCases()

    await expect(record.execute('pc', userX, progress('nope'))).rejects.toThrow(ScrollUnitNotFoundError)
    await expect(record.execute('pc', userX, { type: 'complete', unitId: 'nope' })).rejects.toThrow(
      ScrollUnitNotFoundError,
    )
    expect(progressRepo.rows).toHaveLength(0)
  })

  it('rejects state over the cap before it reaches the use case', () => {
    const state = 'x'.repeat(MAX_STATE_BYTES)
    expect(recordScrollProgressSchema.safeParse({ type: 'progress', unitId: 'A', state }).success).toBe(false)
  })

  it('lets an anonymous visitor write to a public scroll', async () => {
    await seedScroll({ slug: 'pc', visibility: 'public' })
    const view = await useCases().record.execute('pc', anon, progress('A', { completed: true }))
    expect(view.units['A']?.completed).toBe(true)
  })

  it('refuses an anonymous visitor on a private scroll, for reads and writes', async () => {
    await seedScroll({ slug: 'pc', visibility: 'private' })
    const { record, get } = useCases()

    await expect(record.execute('pc', anon, progress('A'))).rejects.toThrow(ScrollLoginRequiredError)
    await expect(get.execute('pc', anon)).rejects.toThrow(ScrollLoginRequiredError)
    expect(progressRepo.rows).toHaveLength(0)
    await expect(record.execute('pc', userX, progress('A'))).resolves.toBeDefined()
  })

  it('does not expose drafts or unknown scrolls', async () => {
    await seedScroll({ slug: 'wip', status: 'draft' })
    const { get } = useCases()

    await expect(get.execute('wip', userX)).rejects.toThrow(ScrollNotFoundError)
    await expect(get.execute('missing', userX)).rejects.toThrow(ScrollNotFoundError)
  })

  it('refuses a scroll that does not declare the progress capability', async () => {
    await seedScroll({ slug: 'stateless', manifest: { ...manifest, capabilities: [] } })
    await expect(useCases().get.execute('stateless', userX)).rejects.toThrow(ScrollProgressNotEnabledError)
  })

  it('isolates owners and scrolls', async () => {
    await seedScroll({ slug: 'one' })
    await seedScroll({ slug: 'two', manifest: { ...manifest, id: 'second' } })
    const { record, get } = useCases()

    await record.execute('one', userX, progress('A', { completed: true }))
    await record.execute('one', userY, progress('B', { completed: true }))
    await record.execute('one', anon, progress('C', { completed: true }))
    await record.execute('two', userX, progress('C', { completed: true }))

    expect(Object.keys((await get.execute('one', userX)).units)).toEqual(['A'])
    expect(Object.keys((await get.execute('one', userY)).units)).toEqual(['B'])
    expect(Object.keys((await get.execute('one', anon)).units)).toEqual(['C'])
    expect(Object.keys((await get.execute('two', userX)).units)).toEqual(['C'])
    expect(Object.keys((await get.execute('two', userY)).units)).toEqual([])
  })
})

describe('MergeAnonymousScrollProgress', () => {
  it('unions units, keeps the newest state and leaves no anonymous rows', async () => {
    await seedScroll({ slug: 'pc' })
    const { record, get, merge } = useCases()

    await record.execute('pc', anon, progress('A', { completed: true, state: 'anon-a' }))
    await record.execute('pc', anon, progress('B', { completed: true, state: 'anon-b' }))
    await record.execute('pc', userX, progress('B', { state: 'user-b' }))
    await record.execute('pc', userX, progress('C', { completed: true, state: 'user-c' }))
    await record.execute('pc', anon, progress('B', { state: 'anon-b-newest' }))

    await merge.execute({ userId: 'user-x', anonymousId: 'anon-1' })

    const { units } = await get.execute('pc', userX)
    expect(units).toEqual({
      A: { completed: true, state: 'anon-a' },
      B: { completed: true, state: 'anon-b-newest' },
      C: { completed: true, state: 'user-c' },
    })
    expect(await progressRepo.listAnonymous('anon-1')).toEqual([])
  })

  it('keeps the user state when it is newer than the anonymous one', async () => {
    await seedScroll({ slug: 'pc' })
    const { record, get, merge } = useCases()

    await record.execute('pc', anon, progress('B', { state: 'anon' }))
    await record.execute('pc', userX, progress('B', { state: 'user' }))
    await merge.execute({ userId: 'user-x', anonymousId: 'anon-1' })

    expect((await get.execute('pc', userX)).units['B']?.state).toBe('user')
  })

  it('merges every scroll, including whole-scroll completion', async () => {
    await seedScroll({ slug: 'one' })
    await seedScroll({ slug: 'two', manifest: { ...manifest, id: 'second' } })
    const { record, get, merge } = useCases()

    await record.execute('one', anon, { type: 'complete' })
    await record.execute('two', anon, progress('A', { completed: true }))
    await merge.execute({ userId: 'user-x', anonymousId: 'anon-1' })

    expect((await get.execute('one', userX)).completed).toBe(true)
    expect((await get.execute('two', userX)).units['A']?.completed).toBe(true)
  })

  it('does nothing for an unknown anonymous id and leaves other owners alone', async () => {
    await seedScroll({ slug: 'pc' })
    const { record, merge } = useCases()
    await record.execute('pc', userY, progress('A', { completed: true }))

    await merge.execute({ userId: 'user-x', anonymousId: 'ghost' })

    expect(progressRepo.rows).toHaveLength(1)
  })

  it('is safe to run twice', async () => {
    await seedScroll({ slug: 'pc' })
    const { record, merge } = useCases()
    await record.execute('pc', anon, progress('A', { completed: true }))

    await merge.execute({ userId: 'user-x', anonymousId: 'anon-1' })
    await merge.execute({ userId: 'user-x', anonymousId: 'anon-1' })

    expect(progressRepo.rows).toHaveLength(1)
  })
})

describe('deriveUserRef', () => {
  const entryId = crypto.randomUUID()

  it('is stable for the same scroll and owner', () => {
    expect(deriveUserRef(SECRET, entryId, userX)).toBe(deriveUserRef(SECRET, entryId, { ...userX }))
  })

  it('differs across scrolls, owners and owner kinds', () => {
    const base = deriveUserRef(SECRET, entryId, userX)
    expect(deriveUserRef(SECRET, crypto.randomUUID(), userX)).not.toBe(base)
    expect(deriveUserRef(SECRET, entryId, userY)).not.toBe(base)
    expect(deriveUserRef(SECRET, entryId, { kind: 'anonymous', anonymousId: 'user-x' })).not.toBe(base)
  })

  it('depends on the secret and is url-safe', () => {
    const ref = deriveUserRef(SECRET, entryId, userX)
    expect(deriveUserRef(`${SECRET}-rotated`, entryId, userX)).not.toBe(ref)
    expect(ref).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })
})
