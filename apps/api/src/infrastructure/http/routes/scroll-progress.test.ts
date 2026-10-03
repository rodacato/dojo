import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Context, Next } from 'hono'
import { ANONYMOUS_ID_HEADER, MAX_STATE_BYTES } from '@dojo/shared'
import { GetScrollProgress } from '../../../application/scrolls/GetScrollProgress'
import { MergeAnonymousScrollProgress } from '../../../application/scrolls/MergeAnonymousScrollProgress'
import { RecordScrollProgress } from '../../../application/scrolls/RecordScrollProgress'
import { InMemoryScrollProgressRepository } from '../../../test/scroll-progress'
import { InMemoryScrollRepository, testManifest, testScrollEntry } from '../../../test/scrolls'
import { domainErrorToStatus } from '../domain-error-status'
import type { AppEnv } from '../app-env'

type Viewer = 'anon' | 'user-x' | 'user-y'

const { authState, repos } = vi.hoisted(() => ({
  authState: { viewer: 'anon' as 'anon' | 'user-x' | 'user-y' },
  repos: {
    scrollRepo: undefined as unknown as InMemoryScrollRepository,
    progressRepo: undefined as unknown as InMemoryScrollProgressRepository,
  },
}))

// Auth boundary only: the real middleware needs a database session lookup.
vi.mock('../middleware/auth', () => ({
  optionalAuth: async (c: Context, next: Next) => {
    if (authState.viewer !== 'anon') c.set('user', { id: authState.viewer })
    await next()
  },
  requireAuth: async (c: Context, next: Next) => {
    if (authState.viewer === 'anon') throw new HTTPException(401, { message: 'Authentication required' })
    c.set('user', { id: authState.viewer })
    await next()
  },
}))

vi.mock('../../container', () => {
  const secret = 'a-secret-that-is-at-least-32-characters-long'
  return {
    useCases: {
      get getScrollProgress() {
        return new GetScrollProgress({ ...repos, userRefSecret: secret })
      },
      get recordScrollProgress() {
        return new RecordScrollProgress({ ...repos, userRefSecret: secret })
      },
      get mergeAnonymousScrollProgress() {
        return new MergeAnonymousScrollProgress({ progressRepo: repos.progressRepo })
      },
    },
  }
})

import { scrollProgressRoutes } from './scroll-progress'

const app = new Hono<AppEnv>()
app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse()
  if (err.name === 'DomainError') {
    const code = (err as { code?: string }).code
    return c.json({ error: err.message, code }, domainErrorToStatus(code))
  }
  return c.json({ error: 'Internal server error' }, 500)
})
app.route('/', scrollProgressRoutes)

const ANON_ID = crypto.randomUUID()
const manifest = { ...testManifest, units: [{ id: 'A' }, { id: 'B' }] }

function send(viewer: Viewer, path: string, init: { method?: string; body?: unknown; anonId?: string | null } = {}) {
  authState.viewer = viewer
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (init.anonId !== null) headers[ANONYMOUS_ID_HEADER] = init.anonId ?? ANON_ID
  return app.request(path, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
}

const post = (viewer: Viewer, slug: string, body: unknown, anonId?: string | null) =>
  send(viewer, `/scrolls/${slug}/progress`, { method: 'POST', body, anonId })

async function seed(slug: string, over: Parameters<typeof testScrollEntry>[0] = {}) {
  await repos.scrollRepo.insert(testScrollEntry({ slug, status: 'published', manifest, ...over }))
}

beforeEach(async () => {
  repos.scrollRepo = new InMemoryScrollRepository()
  repos.progressRepo = new InMemoryScrollProgressRepository()
  await seed('pc')
})

describe('progress survives a reload', () => {
  it('returns on GET what POST stored, for a signed-in user', async () => {
    const written = await post('user-x', 'pc', { type: 'progress', unitId: 'A', completed: true, state: { n: 2 } })
    expect(written.status).toBe(200)

    const res = await send('user-x', '/scrolls/pc/progress')
    const body = (await res.json()) as Record<string, unknown>
    expect(body).toMatchObject({ completed: false, units: { A: { completed: true, state: { n: 2 } } } })
    expect(typeof body['userRef']).toBe('string')
    expect(typeof body['updatedAt']).toBe('string')
  })

  it('works for an anonymous visitor on a public scroll', async () => {
    await post('anon', 'pc', { type: 'complete', unitId: 'B' })
    const body = (await (await send('anon', '/scrolls/pc/progress')).json()) as { units: unknown }
    expect(body.units).toEqual({ B: { completed: true } })
  })
})

describe('owner isolation', () => {
  it('shows each owner only their own rows', async () => {
    await post('user-x', 'pc', { type: 'complete', unitId: 'A' })
    await post('user-y', 'pc', { type: 'complete', unitId: 'B' })
    await post('anon', 'pc', { type: 'progress', unitId: 'A', state: 'anon' })

    const units = async (viewer: Viewer, anonId?: string) =>
      Object.keys(((await (await send(viewer, '/scrolls/pc/progress', { anonId })).json()) as { units: object }).units)

    expect(await units('user-x')).toEqual(['A'])
    expect(await units('user-y')).toEqual(['B'])
    expect(await units('anon')).toEqual(['A'])
    expect(await units('anon', crypto.randomUUID())).toEqual([])
  })

  it('gives different userRefs per owner and per scroll, and the same one on repeat', async () => {
    await seed('other', { manifest: { ...manifest, id: 'other' } })
    const ref = async (viewer: Viewer, slug: string) =>
      ((await (await send(viewer, `/scrolls/${slug}/progress`)).json()) as { userRef: string }).userRef

    expect(await ref('user-x', 'pc')).toBe(await ref('user-x', 'pc'))
    expect(await ref('user-x', 'pc')).not.toBe(await ref('user-y', 'pc'))
    expect(await ref('user-x', 'pc')).not.toBe(await ref('user-x', 'other'))
    expect(await ref('anon', 'pc')).not.toBe(await ref('user-x', 'pc'))
  })
})

describe('rejections', () => {
  it('rejects state over 64 KiB with 400 and stores nothing', async () => {
    const res = await post('user-x', 'pc', { type: 'progress', unitId: 'A', state: 'x'.repeat(MAX_STATE_BYTES) })
    expect(res.status).toBe(400)
    expect(repos.progressRepo.rows).toHaveLength(0)
  })

  it('accepts state at the cap boundary minus the JSON quotes', async () => {
    const res = await post('user-x', 'pc', { type: 'progress', unitId: 'A', state: 'x'.repeat(MAX_STATE_BYTES - 2) })
    expect(res.status).toBe(200)
  })

  it('rejects a unit that is not in the manifest with 422', async () => {
    const res = await post('user-x', 'pc', { type: 'complete', unitId: 'ghost' })
    expect(res.status).toBe(422)
    expect(((await res.json()) as { code: string }).code).toBe('SCROLL_UNIT_NOT_FOUND')
    expect(repos.progressRepo.rows).toHaveLength(0)
  })

  it('rejects an anonymous write to a private scroll with 401', async () => {
    await seed('secret', { visibility: 'private', manifest: { ...manifest, id: 'secret' } })

    const res = await post('anon', 'secret', { type: 'complete', unitId: 'A' })
    expect(res.status).toBe(401)
    expect((await send('anon', '/scrolls/secret/progress')).status).toBe(401)
    expect(repos.progressRepo.rows).toHaveLength(0)
    expect((await post('user-x', 'secret', { type: 'complete', unitId: 'A' })).status).toBe(200)
  })

  it.each([
    ['a missing anonymous id', null],
    ['a malformed anonymous id', 'not-a-uuid'],
  ])('rejects %s with 400', async (_name, anonId) => {
    const res = await post('anon', 'pc', { type: 'complete' }, anonId)
    expect(res.status).toBe(400)
    expect(((await res.json()) as { code: string }).code).toBe('SCROLL_OWNER_REQUIRED')
  })

  it('rejects malformed bodies and unknown message types', async () => {
    expect((await post('user-x', 'pc', { type: 'progress' })).status).toBe(400)
    expect((await post('user-x', 'pc', { type: 'run', unitId: 'A' })).status).toBe(400)
    expect((await send('user-x', '/scrolls/pc/progress', { method: 'POST' })).status).toBe(400)
  })

  it('answers 404 for a draft, an unknown slug and a malformed slug', async () => {
    await seed('wip', { status: 'draft', manifest: { ...manifest, id: 'wip' } })
    for (const slug of ['wip', 'missing', 'Bad Slug']) {
      expect((await send('user-x', `/scrolls/${encodeURIComponent(slug)}/progress`)).status).toBe(404)
    }
  })

  it('answers 422 for a scroll that does not declare progress', async () => {
    await seed('plain', { manifest: { ...manifest, id: 'plain', capabilities: [] } })
    expect((await send('user-x', '/scrolls/plain/progress')).status).toBe(422)
  })
})

describe('POST /scrolls/progress/merge', () => {
  it('moves anonymous progress to the signed-in user', async () => {
    await post('anon', 'pc', { type: 'progress', unitId: 'A', completed: true })

    const res = await send('user-x', '/scrolls/progress/merge', { method: 'POST' })
    expect(res.status).toBe(204)

    const mine = (await (await send('user-x', '/scrolls/pc/progress')).json()) as { units: object }
    expect(mine.units).toEqual({ A: { completed: true } })
    const anon = (await (await send('anon', '/scrolls/pc/progress')).json()) as { units: object }
    expect(anon.units).toEqual({})
  })

  it('requires a signed-in user', async () => {
    await post('anon', 'pc', { type: 'complete' })
    expect((await send('anon', '/scrolls/progress/merge', { method: 'POST' })).status).toBe(401)
    expect(repos.progressRepo.rows).toHaveLength(1)
  })

  it('requires a valid anonymous id', async () => {
    expect((await send('user-x', '/scrolls/progress/merge', { method: 'POST', anonId: null })).status).toBe(400)
    expect((await send('user-x', '/scrolls/progress/merge', { method: 'POST', anonId: 'nope' })).status).toBe(400)
  })

  it('does not touch another browser id', async () => {
    const other = crypto.randomUUID()
    await post('anon', 'pc', { type: 'complete' }, other)

    await send('user-x', '/scrolls/progress/merge', { method: 'POST' })

    expect(repos.progressRepo.rows).toHaveLength(1)
    expect(await repos.progressRepo.listAnonymous(other)).toHaveLength(1)
  })
})
