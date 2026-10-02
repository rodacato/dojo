import { beforeEach, describe, expect, it } from 'vitest'
import {
  ScrollLoginRequiredError,
  ScrollNotFoundError,
  ScrollOriginNotAllowedError,
  ScrollSlugTakenError,
} from '../../domain/shared/errors'
import {
  InMemoryScrollRepository,
  TEST_ORIGIN,
  testManifest,
  testScrollEntry,
  testScrollInput,
} from '../../test/scrolls'
import { DeleteScroll } from './DeleteScroll'
import { GetScrollBySlug } from './GetScrollBySlug'
import { ListScrolls } from './ListScrolls'
import { RegisterScroll } from './RegisterScroll'
import { UpdateScroll } from './UpdateScroll'

const originPolicy = { allowedOrigins: [TEST_ORIGIN], isProduction: true }
const foreignManifest = { ...testManifest, entry: 'https://elsewhere.example.net/scroll/' }

let scrollRepo: InMemoryScrollRepository

beforeEach(() => {
  scrollRepo = new InMemoryScrollRepository()
})

async function seed(over: Parameters<typeof testScrollEntry>[0]) {
  const entry = testScrollEntry(over)
  await scrollRepo.insert(entry)
  return entry
}

describe('RegisterScroll', () => {
  it('stores a scroll whose entry origin is allowed', async () => {
    const entry = await new RegisterScroll({ scrollRepo, originPolicy }).execute(testScrollInput())

    expect(await scrollRepo.findById(entry.id)).toEqual(entry)
    expect(entry.status).toBe('draft')
  })

  it('rejects an entry origin outside the allow-list and stores nothing', async () => {
    const register = new RegisterScroll({ scrollRepo, originPolicy })

    await expect(register.execute(testScrollInput({ manifest: foreignManifest }))).rejects.toThrow(
      ScrollOriginNotAllowedError,
    )
    expect(scrollRepo.entries.size).toBe(0)
  })

  it('rejects an entry that is not an absolute url', async () => {
    const register = new RegisterScroll({ scrollRepo, originPolicy })
    const manifest = { ...testManifest, entry: '/pattern-circuit/' }

    await expect(register.execute(testScrollInput({ manifest }))).rejects.toThrow(
      ScrollOriginNotAllowedError,
    )
    expect(scrollRepo.entries.size).toBe(0)
  })

  it('rejects a duplicated slug', async () => {
    const register = new RegisterScroll({ scrollRepo, originPolicy })
    await register.execute(testScrollInput())

    await expect(register.execute(testScrollInput())).rejects.toThrow(ScrollSlugTakenError)
    expect(scrollRepo.entries.size).toBe(1)
  })
})

describe('UpdateScroll', () => {
  it('changes status and visibility without touching the manifest', async () => {
    const entry = await seed({})
    const updated = await new UpdateScroll({ scrollRepo, originPolicy }).execute(entry.id, {
      status: 'published',
      visibility: 'private',
    })

    expect(updated).toMatchObject({ status: 'published', visibility: 'private', manifest: entry.manifest })
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(entry.updatedAt.getTime())
  })

  it('does not re-check origins when the manifest is not part of the update', async () => {
    const entry = await seed({ manifest: foreignManifest })

    await expect(
      new UpdateScroll({ scrollRepo, originPolicy }).execute(entry.id, { status: 'published' }),
    ).resolves.toMatchObject({ status: 'published' })
  })

  it('rejects a new manifest with a disallowed origin and keeps the stored one', async () => {
    const entry = await seed({})

    await expect(
      new UpdateScroll({ scrollRepo, originPolicy }).execute(entry.id, { manifest: foreignManifest }),
    ).rejects.toThrow(ScrollOriginNotAllowedError)
    expect((await scrollRepo.findById(entry.id))?.manifest).toEqual(testManifest)
  })

  it('replaces the manifest when its origin is allowed', async () => {
    const entry = await seed({})
    const manifest = { ...testManifest, version: '0.2.0' }

    const updated = await new UpdateScroll({ scrollRepo, originPolicy }).execute(entry.id, { manifest })

    expect(updated.manifest.version).toBe('0.2.0')
  })

  it('fails for an unknown id', async () => {
    await expect(
      new UpdateScroll({ scrollRepo, originPolicy }).execute('missing', { status: 'published' }),
    ).rejects.toThrow(ScrollNotFoundError)
  })
})

describe('DeleteScroll', () => {
  it('removes the scroll', async () => {
    const entry = await seed({})
    await new DeleteScroll({ scrollRepo }).execute(entry.id)

    expect(scrollRepo.entries.size).toBe(0)
  })

  it('fails for an unknown id', async () => {
    await expect(new DeleteScroll({ scrollRepo }).execute('missing')).rejects.toThrow(ScrollNotFoundError)
  })
})

describe('ListScrolls', () => {
  beforeEach(async () => {
    await seed({ slug: 'pub', status: 'published', visibility: 'public' })
    await seed({ slug: 'priv', status: 'published', visibility: 'private' })
    await seed({ slug: 'draft', status: 'draft', visibility: 'public' })
  })

  const slugs = (entries: { slug: string }[]) => entries.map((entry) => entry.slug).sort()

  it('shows an anonymous visitor only published public scrolls', async () => {
    const entries = await new ListScrolls({ scrollRepo }).forVisitor({ authenticated: false })
    expect(slugs(entries)).toEqual(['pub'])
  })

  it('adds published private scrolls for a signed-in user, never drafts', async () => {
    const entries = await new ListScrolls({ scrollRepo }).forVisitor({ authenticated: true })
    expect(slugs(entries)).toEqual(['priv', 'pub'])
  })

  it('lists everything for the admin', async () => {
    expect(slugs(await new ListScrolls({ scrollRepo }).all())).toEqual(['draft', 'priv', 'pub'])
  })
})

describe('GetScrollBySlug', () => {
  const get = (slug: string, authenticated: boolean) =>
    new GetScrollBySlug({ scrollRepo }).execute(slug, { authenticated })

  it('returns a published public scroll to anyone', async () => {
    await seed({ slug: 'pub', status: 'published' })
    expect((await get('pub', false)).slug).toBe('pub')
  })

  it('hides drafts and unknown slugs, even from signed-in users', async () => {
    await seed({ slug: 'draft', status: 'draft' })

    await expect(get('draft', true)).rejects.toThrow(ScrollNotFoundError)
    await expect(get('nope', true)).rejects.toThrow(ScrollNotFoundError)
  })

  it('asks anonymous visitors to log in for a private scroll', async () => {
    await seed({ slug: 'priv', status: 'published', visibility: 'private' })

    await expect(get('priv', false)).rejects.toThrow(ScrollLoginRequiredError)
    expect((await get('priv', true)).slug).toBe('priv')
  })

  it('does not reveal a private draft to anonymous visitors', async () => {
    await seed({ slug: 'hidden', status: 'draft', visibility: 'private' })

    await expect(get('hidden', false)).rejects.toThrow(ScrollNotFoundError)
  })
})
