import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../app-env'
import type * as LoggerModule from '../../observability/logger'
import { requestLoggerMiddleware } from './requestLogger'
import { requestIdMiddleware } from './requestId'

const emitted = vi.hoisted(() => [] as Array<{ level: string; evt: string; fields: Record<string, unknown> }>)

vi.mock('../../observability/logger', async () => {
  const actual = await vi.importActual<typeof LoggerModule>('../../observability/logger')
  const record = (level: string) => (evt: string, fields: Record<string, unknown> = {}) => {
    emitted.push({ level, evt, fields: { ...fields } })
  }
  return {
    ...actual,
    log: { debug: record('debug'), info: record('info'), warn: record('warn'), error: record('error') },
  }
})


function buildApp() {
  const app = new Hono<AppEnv>()
  app.use('*', requestIdMiddleware)
  app.use('*', requestLoggerMiddleware)
  app.get('/ok', (c) => c.json({ ok: true }))
  app.get('/users/:id', (c) => c.json({ id: c.req.param('id') }))
  app.get('/missing', (c) => c.json({ error: 'nope' }, 404))
  app.get('/health', (c) => c.json({ ok: true }))
  app.get('/boom', () => {
    throw new Error('boom')
  })
  app.get('/teapot', () => {
    throw new HTTPException(418)
  })
  app.onError((err, c) => (err instanceof HTTPException ? err.getResponse() : c.json({ error: 'x' }, 500)))
  return app
}

describe('requestLoggerMiddleware', () => {
  beforeEach(() => {
    emitted.length = 0
  })
  afterEach(() => vi.clearAllMocks())

  it('logs one http.request event with route pattern, status and duration', async () => {
    await buildApp().request('/users/42')

    expect(emitted).toHaveLength(1)
    expect(emitted[0]).toMatchObject({
      level: 'info',
      evt: 'http.request',
      fields: { method: 'GET', route: '/users/:id', path: '/users/42', status: 200 },
    })
    expect(emitted[0]!.fields['durationMs']).toBeGreaterThanOrEqual(0)
  })

  it('logs 4xx at warn and 5xx at error', async () => {
    const app = buildApp()
    await app.request('/missing')
    await app.request('/boom')

    expect(emitted.map((e) => [e.level, e.fields['status']])).toEqual([
      ['warn', 404],
      ['error', 500],
    ])
  })

  it('logs the status of an HTTPException response', async () => {
    await buildApp().request('/teapot')
    expect(emitted[0]).toMatchObject({ level: 'warn', fields: { status: 418 } })
  })

  it('stays quiet for successful health probes but not for failing ones', async () => {
    await buildApp().request('/health')
    expect(emitted).toEqual([])
  })
})
