import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRouter } from '../router'

vi.mock('../../container', () => ({ useCases: {}, errorReporter: { report: vi.fn() } }))

describe('GET /health', () => {
  it('returns ok', async () => {
    const app = createRouter()
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { status: string }
    expect(body.status).toBe('ok')
  })
})

describe('GET /health/piston', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns ok + runtime list when Piston responds 200', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { language: 'python', version: '3.12.0', aliases: ['py'] },
          { language: 'sqlite3', version: '3.43.1' },
        ]),
        { status: 200 },
      ),
    )
    const app = createRouter()
    const res = await app.request('/health/piston')
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      status: string
      runtimes: Array<{ language: string; version: string }>
    }
    expect(body.status).toBe('ok')
    expect(body.runtimes).toEqual([
      { language: 'python', version: '3.12.0' },
      { language: 'sqlite3', version: '3.43.1' },
    ])
  })

  it('returns 503 down when Piston returns non-2xx', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('bad', { status: 502 }))
    const app = createRouter()
    const res = await app.request('/health/piston')
    expect(res.status).toBe(503)
    const body = (await res.json()) as { status: string; error: string }
    expect(body.status).toBe('down')
    expect(body.error).toContain('502')
  })

  it('returns 503 down when fetch throws', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const app = createRouter()
    const res = await app.request('/health/piston')
    expect(res.status).toBe(503)
    const body = (await res.json()) as { status: string; error: string }
    expect(body.status).toBe('down')
    expect(body.error).toContain('ECONNREFUSED')
  })
})
