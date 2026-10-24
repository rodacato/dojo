import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { describe, expect, it } from 'vitest'
import type { ErrorReport } from '../observability/ports'
import type { AppEnv } from './app-env'
import { createErrorHandler } from './errorHandler'

function buildApp() {
  const reports: ErrorReport[] = []
  const admin = new Hono<AppEnv>()
  admin.get('/katas/:id', () => {
    throw new Error('boom')
  })

  const app = new Hono<AppEnv>()
  app.use('*', async (c, next) => {
    c.set('requestId', 'req-1')
    await next()
  })
  app.get('/sessions/:id', () => {
    throw new Error('boom')
  })
  app.get('/teapot', () => {
    throw new HTTPException(418)
  })
  app.route('/admin', admin)
  app.onError(createErrorHandler({ report: async (r) => void reports.push(r) }))
  return { app, reports }
}

describe('createErrorHandler', () => {
  it('reports an unhandled error with the route pattern, not the raw path, and answers 500', async () => {
    const { app, reports } = buildApp()
    const res = await app.request('/sessions/0b7e1c9a-3f0d-4c55-9a51-6e1f0c2d8b44')

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
    expect(reports).toEqual([
      expect.objectContaining({ message: 'boom', route: '/sessions/:id', method: 'GET', requestId: 'req-1', status: 500 }),
    ])
  })

  it('reports the full pattern of a route mounted on a sub-app', async () => {
    const { app, reports } = buildApp()
    await app.request('/admin/katas/42')

    expect(reports[0]?.route).toBe('/admin/katas/:id')
  })

  it('passes an HTTPException through without reporting it', async () => {
    const { app, reports } = buildApp()
    const res = await app.request('/teapot')

    expect(res.status).toBe(418)
    expect(reports).toEqual([])
  })
})
