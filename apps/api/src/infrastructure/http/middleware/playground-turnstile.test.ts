import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppEnv } from '../app-env'

// Only the config is a mock boundary (to flip TURNSTILE_SECRET_KEY) plus
// global.fetch (the Cloudflare siteverify call). The middleware itself runs for
// real, mounted on a throwaway Hono app whose handler echoes a 200 so we can
// tell "passed the gate" from "blocked by the gate".
const { mockConfig } = vi.hoisted(() => ({
  mockConfig: { TURNSTILE_SECRET_KEY: '' as string },
}))

vi.mock('../../../config', () => ({ config: mockConfig }))

import { playgroundTurnstileMiddleware } from './playground-turnstile'

function makeApp() {
  const app = new Hono<AppEnv>()
  app.use('/run', playgroundTurnstileMiddleware)
  app.post('/run', (c) => c.json({ ran: true }))
  return app
}

function post(body: unknown, headers: Record<string, string> = {}) {
  return makeApp().request('/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

// siteverify fetch stub. `success` drives the verdict; capture the last call so
// we can assert what the middleware sent to Cloudflare.
let lastFetch: { url: string; body: string } | null = null
function stubSiteverify(opts: { ok?: boolean; success?: boolean; errorCodes?: string[]; throws?: boolean } = {}) {
  const { ok = true, success = true, errorCodes, throws = false } = opts
  lastFetch = null
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: { body: string }) => {
      lastFetch = { url, body: init.body }
      if (throws) throw new Error('network down')
      return {
        ok,
        status: ok ? 200 : 500,
        json: async () => ({ success, 'error-codes': errorCodes ?? [] }),
      } as Response
    }),
  )
}

beforeEach(() => {
  mockConfig.TURNSTILE_SECRET_KEY = ''
  stubSiteverify()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('playgroundTurnstileMiddleware — dev mode (no secret)', () => {
  it('is a no-op: passes through with no token and never calls siteverify', async () => {
    mockConfig.TURNSTILE_SECRET_KEY = ''
    const res = await post({})
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ran: true })
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})

describe('playgroundTurnstileMiddleware — enforced (secret set)', () => {
  beforeEach(() => {
    mockConfig.TURNSTILE_SECRET_KEY = 'secret-key'
  })

  it('403 turnstile_required when the body has no token', async () => {
    const res = await post({ code: 'print(1)' })
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'turnstile_required' })
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('403 turnstile_required when the body is unparseable JSON', async () => {
    const res = await post('not-json{')
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'turnstile_required' })
  })

  it('403 turnstile_required when turnstileToken is a non-string', async () => {
    const res = await post({ turnstileToken: 12345 })
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'turnstile_required' })
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('passes through and reaches the handler when siteverify succeeds', async () => {
    stubSiteverify({ success: true })
    const res = await post({ turnstileToken: 'good-token' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ran: true })
  })

  it('403 turnstile_failed with the cloudflare error-codes when verification fails', async () => {
    stubSiteverify({ success: false, errorCodes: ['invalid-input-response'] })
    const res = await post({ turnstileToken: 'tampered' })
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'turnstile_failed', codes: ['invalid-input-response'] })
  })

  it('fails closed (403) when siteverify returns a non-2xx HTTP status', async () => {
    stubSiteverify({ ok: false })
    const res = await post({ turnstileToken: 'good-token' })
    expect(res.status).toBe(403)
    expect((await res.json()).codes).toContain('siteverify_http_error')
  })

  it('fails closed (403) when the siteverify call throws (network error)', async () => {
    stubSiteverify({ throws: true })
    const res = await post({ turnstileToken: 'good-token' })
    expect(res.status).toBe(403)
    expect((await res.json()).codes).toContain('siteverify_network_error')
  })

  it('returns an empty codes array when siteverify omits error-codes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ success: false }) }) as unknown as Response),
    )
    const res = await post({ turnstileToken: 'tampered' })
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'turnstile_failed', codes: [] })
  })

  it('falls back to x-real-ip when cf-connecting-ip and x-forwarded-for are absent', async () => {
    await post({ turnstileToken: 'good-token' }, { 'x-real-ip': '192.0.2.44' })
    const params = new URLSearchParams(lastFetch?.body ?? '')
    expect(params.get('remoteip')).toBe('192.0.2.44')
  })

  it('sends the secret + response token to cloudflare siteverify', async () => {
    await post({ turnstileToken: 'good-token' })
    expect(lastFetch?.url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    const params = new URLSearchParams(lastFetch?.body ?? '')
    expect(params.get('secret')).toBe('secret-key')
    expect(params.get('response')).toBe('good-token')
  })

  it('forwards the cf-connecting-ip as remoteip when present', async () => {
    await post({ turnstileToken: 'good-token' }, { 'cf-connecting-ip': '203.0.113.5' })
    const params = new URLSearchParams(lastFetch?.body ?? '')
    expect(params.get('remoteip')).toBe('203.0.113.5')
  })

  it('uses the first x-forwarded-for hop when cf-connecting-ip is absent', async () => {
    await post({ turnstileToken: 'good-token' }, { 'x-forwarded-for': '198.51.100.9, 10.0.0.1' })
    const params = new URLSearchParams(lastFetch?.body ?? '')
    expect(params.get('remoteip')).toBe('198.51.100.9')
  })

  it('omits remoteip when no client-ip header is present', async () => {
    await post({ turnstileToken: 'good-token' })
    const params = new URLSearchParams(lastFetch?.body ?? '')
    expect(params.has('remoteip')).toBe(false)
  })
})
