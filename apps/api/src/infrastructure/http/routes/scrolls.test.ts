import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Context, Next } from 'hono'
import { RegisterScroll } from '../../../application/scrolls/RegisterScroll'
import { UpdateScroll } from '../../../application/scrolls/UpdateScroll'
import { DeleteScroll } from '../../../application/scrolls/DeleteScroll'
import { ListScrolls } from '../../../application/scrolls/ListScrolls'
import { GetScrollBySlug } from '../../../application/scrolls/GetScrollBySlug'
import {
  InMemoryScrollRepository,
  TEST_ORIGIN,
  testManifest,
  testScrollEntry,
} from '../../../test/scrolls'
import { domainErrorToStatus } from '../domain-error-status'
import type { AppEnv } from '../app-env'

type Viewer = 'anon' | 'user' | 'creator'

const { authState, repoHolder } = vi.hoisted(() => ({
  authState: { viewer: 'anon' as 'anon' | 'user' | 'creator' },
  repoHolder: { repo: undefined as unknown as InMemoryScrollRepository },
}))

// Auth boundary only: the real middleware needs a database session lookup.
vi.mock('../middleware/auth', () => {
  const userFor = () => ({ id: 'user-1', githubId: authState.viewer === 'creator' ? 'creator-gh' : 'other-gh' })
  return {
    optionalAuth: async (c: Context, next: Next) => {
      if (authState.viewer !== 'anon') c.set('user', userFor())
      await next()
    },
    requireAuth: async (c: Context, next: Next) => {
      if (authState.viewer === 'anon') throw new HTTPException(401, { message: 'Authentication required' })
      c.set('user', userFor())
      await next()
    },
    requireCreator: async (c: Context, next: Next) => {
      if ((c.get('user') as { githubId: string }).githubId !== 'creator-gh') {
        throw new HTTPException(403, { message: 'Forbidden' })
      }
      await next()
    },
  }
})

vi.mock('../../container', async () => {
  const policy = { allowedOrigins: ['https://scrolls.example.org'], isProduction: true }
  const repo = () => repoHolder.repo
  return {
    useCases: {
      get registerScroll() {
        return new RegisterScroll({ scrollRepo: repo(), originPolicy: policy })
      },
      get updateScroll() {
        return new UpdateScroll({ scrollRepo: repo(), originPolicy: policy })
      },
      get deleteScroll() {
        return new DeleteScroll({ scrollRepo: repo() })
      },
      get listScrolls() {
        return new ListScrolls({ scrollRepo: repo() })
      },
      get getScrollBySlug() {
        return new GetScrollBySlug({ scrollRepo: repo() })
      },
    },
  }
})

import { adminScrollsRoutes } from './admin-scrolls'
import { scrollsRoutes } from './scrolls'

function makeApp() {
  const app = new Hono<AppEnv>()
  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()
    if (err.name === 'DomainError') {
      const code = (err as { code?: string }).code
      return c.json({ error: err.message, code }, domainErrorToStatus(code))
    }
    return c.json({ error: 'Internal server error' }, 500)
  })
  app.route('/', scrollsRoutes)
  app.route('/admin/scrolls', adminScrollsRoutes)
  return app
}

const app = makeApp()

function send(viewer: Viewer, path: string, method = 'GET', body?: unknown) {
  authState.viewer = viewer
  return app.request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function seed(over: Parameters<typeof testScrollEntry>[0]) {
  const entry = testScrollEntry(over)
  await repoHolder.repo.insert(entry)
  return entry
}

const registerBody = (over: Record<string, unknown> = {}) => ({
  slug: 'pattern-circuit',
  manifest: testManifest,
  ...over,
})

beforeEach(() => {
  repoHolder.repo = new InMemoryScrollRepository()
})

describe('GET /scrolls', () => {
  beforeEach(async () => {
    await seed({ slug: 'pub', status: 'published', visibility: 'public' })
    await seed({ slug: 'priv', status: 'published', visibility: 'private' })
    await seed({ slug: 'draft', status: 'draft', visibility: 'public' })
  })

  const slugsFor = async (viewer: Viewer) => {
    const res = await send(viewer, '/scrolls')
    expect(res.status).toBe(200)
    return ((await res.json()) as { slug: string }[]).map((s) => s.slug).sort()
  }

  it('lists only published public scrolls for an anonymous visitor', async () => {
    expect(await slugsFor('anon')).toEqual(['pub'])
  })

  it('adds published private scrolls for a signed-in user', async () => {
    expect(await slugsFor('user')).toEqual(['priv', 'pub'])
  })

  it('never lists drafts, not even for the creator', async () => {
    expect(await slugsFor('creator')).toEqual(['priv', 'pub'])
  })

  it('serialises entries as ScrollEntryDTO', async () => {
    const [entry] = (await (await send('anon', '/scrolls')).json()) as Record<string, unknown>[]
    expect(entry).toMatchObject({ slug: 'pub', status: 'published', visibility: 'public' })
    expect(typeof entry?.['createdAt']).toBe('string')
    expect(entry?.['manifest']).toEqual(testManifest)
  })
})

describe('GET /scrolls/:slug', () => {
  it('returns a published public scroll to an anonymous visitor', async () => {
    await seed({ slug: 'pub', status: 'published' })
    const res = await send('anon', '/scrolls/pub')

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ slug: 'pub' })
  })

  it('404s for a draft and for an unknown slug', async () => {
    await seed({ slug: 'draft', status: 'draft' })

    expect((await send('creator', '/scrolls/draft')).status).toBe(404)
    expect((await send('anon', '/scrolls/nope')).status).toBe(404)
  })

  it('404s for a malformed slug', async () => {
    expect((await send('anon', '/scrolls/Not_A_Slug')).status).toBe(404)
  })

  it('401s a private scroll for an anonymous visitor and serves it to a signed-in user', async () => {
    await seed({ slug: 'priv', status: 'published', visibility: 'private' })

    expect((await send('anon', '/scrolls/priv')).status).toBe(401)
    expect((await send('user', '/scrolls/priv')).status).toBe(200)
  })

  it('answers 404, not 401, for a private draft', async () => {
    await seed({ slug: 'hidden', status: 'draft', visibility: 'private' })

    expect((await send('anon', '/scrolls/hidden')).status).toBe(404)
  })
})

describe('admin scrolls access', () => {
  it.each([
    ['GET', '/admin/scrolls', undefined],
    ['POST', '/admin/scrolls', registerBody()],
    ['PATCH', '/admin/scrolls/3f0d1c52-6c0e-4c53-9d0c-3a3a8f6a3b11', { status: 'published' }],
    ['DELETE', '/admin/scrolls/3f0d1c52-6c0e-4c53-9d0c-3a3a8f6a3b11', undefined],
  ])('%s %s is 401 anonymous and 403 for a non-creator', async (method, path, body) => {
    expect((await send('anon', path, method, body)).status).toBe(401)
    expect((await send('user', path, method, body)).status).toBe(403)
    expect(repoHolder.repo.entries.size).toBe(0)
  })
})

describe('admin scrolls CRUD', () => {
  it('lists every scroll, drafts included', async () => {
    await seed({ slug: 'a', status: 'draft' })
    await seed({ slug: 'b', status: 'published', visibility: 'private' })

    const res = await send('creator', '/admin/scrolls')

    expect(res.status).toBe(200)
    expect(await res.json()).toHaveLength(2)
  })

  it('registers a scroll as a public draft by default and answers 201', async () => {
    const res = await send('creator', '/admin/scrolls', 'POST', registerBody())

    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ slug: 'pattern-circuit', status: 'draft', visibility: 'public' })
    expect(repoHolder.repo.entries.size).toBe(1)
  })

  it('end to end: a creator registers and publishes, then an anonymous visitor sees it', async () => {
    const created = (await (await send('creator', '/admin/scrolls', 'POST', registerBody())).json()) as { id: string }
    expect(await (await send('anon', '/scrolls')).json()).toEqual([])

    const patched = await send('creator', `/admin/scrolls/${created.id}`, 'PATCH', { status: 'published' })
    expect(patched.status).toBe(200)

    const listed = (await (await send('anon', '/scrolls')).json()) as { slug: string }[]
    expect(listed.map((s) => s.slug)).toEqual(['pattern-circuit'])
  })

  it('409s a duplicated slug', async () => {
    await send('creator', '/admin/scrolls', 'POST', registerBody())

    expect((await send('creator', '/admin/scrolls', 'POST', registerBody())).status).toBe(409)
  })

  it('updates the manifest when its origin is allowed', async () => {
    const entry = await seed({})
    const manifest = { ...testManifest, version: '0.2.0' }

    const res = await send('creator', `/admin/scrolls/${entry.id}`, 'PATCH', { manifest })

    expect(res.status).toBe(200)
    expect(((await res.json()) as { manifest: { version: string } }).manifest.version).toBe('0.2.0')
  })

  it('404s a PATCH or DELETE on an unknown or malformed id', async () => {
    const unknown = '3f0d1c52-6c0e-4c53-9d0c-3a3a8f6a3b11'

    expect((await send('creator', `/admin/scrolls/${unknown}`, 'PATCH', { status: 'published' })).status).toBe(404)
    expect((await send('creator', `/admin/scrolls/${unknown}`, 'DELETE')).status).toBe(404)
    expect((await send('creator', '/admin/scrolls/not-a-uuid', 'PATCH', {})).status).toBe(404)
    expect((await send('creator', '/admin/scrolls/not-a-uuid', 'DELETE')).status).toBe(404)
  })

  it('deletes a scroll with 204', async () => {
    const entry = await seed({})

    const res = await send('creator', `/admin/scrolls/${entry.id}`, 'DELETE')

    expect(res.status).toBe(204)
    expect(repoHolder.repo.entries.size).toBe(0)
  })
})

describe('admin scrolls validation', () => {
  it.each([
    ['a bad slug', registerBody({ slug: 'Bad Slug' })],
    ['a manifest without units', registerBody({ manifest: { ...testManifest, units: [] } })],
    ['an unknown status', registerBody({ status: 'archived' })],
    ['no manifest', { slug: 'ok' }],
  ])('400s a POST with %s and stores nothing', async (_name, body) => {
    const res = await send('creator', '/admin/scrolls', 'POST', body)

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: 'Invalid request body' })
    expect(repoHolder.repo.entries.size).toBe(0)
  })

  it('400s a POST that is not JSON', async () => {
    authState.viewer = 'creator'
    const res = await app.request('/admin/scrolls', { method: 'POST', body: 'not json' })

    expect(res.status).toBe(400)
  })

  it('400s a PATCH with an invalid visibility', async () => {
    const entry = await seed({})

    expect((await send('creator', `/admin/scrolls/${entry.id}`, 'PATCH', { visibility: 'secret' })).status).toBe(400)
  })
})

describe('origin gate over HTTP', () => {
  const foreign = { ...testManifest, entry: 'https://elsewhere.example.net/scroll/' }

  it('422s a POST whose entry origin is not allowed and stores nothing', async () => {
    const res = await send('creator', '/admin/scrolls', 'POST', registerBody({ manifest: foreign }))

    expect(res.status).toBe(422)
    expect(await res.json()).toMatchObject({ code: 'SCROLL_ORIGIN_NOT_ALLOWED' })
    expect(repoHolder.repo.entries.size).toBe(0)
  })

  it('422s a relative entry', async () => {
    const manifest = { ...testManifest, entry: '/local/' }

    expect((await send('creator', '/admin/scrolls', 'POST', registerBody({ manifest }))).status).toBe(422)
  })

  it('422s a PATCH that moves the entry to a disallowed origin and keeps the stored manifest', async () => {
    const entry = await seed({})

    const res = await send('creator', `/admin/scrolls/${entry.id}`, 'PATCH', { manifest: foreign })

    expect(res.status).toBe(422)
    expect((await repoHolder.repo.findById(entry.id))?.manifest.entry).toBe(`${TEST_ORIGIN}/pattern-circuit/`)
  })
})
