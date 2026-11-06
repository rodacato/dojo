import { Hono } from 'hono'
import { afterEach, describe, expect, it, vi } from 'vitest'

const SOCKET = { incoming: { socket: { remoteAddress: '10.0.0.9' } } }

async function ipSeen(source: string, headers: Record<string, string>, bindings: object = SOCKET): Promise<string> {
  vi.resetModules()
  vi.stubEnv('CLIENT_IP_SOURCE', source)
  const { clientIp } = await import('./client-ip')
  const app = new Hono()
  app.get('/', (c) => c.text(clientIp(c)))
  return (await app.request('/', { headers }, bindings)).text()
}

describe('clientIp', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('trusts no header by default, and uses the socket address', async () => {
    expect(await ipSeen('', { 'cf-connecting-ip': '203.0.113.5', 'x-forwarded-for': '198.51.100.9' })).toBe('10.0.0.9')
  })

  it('reads cf-connecting-ip for cloudflare, whatever the case of the value', async () => {
    expect(await ipSeen(' Cloudflare ', { 'cf-connecting-ip': '203.0.113.5', 'x-forwarded-for': '198.51.100.9' })).toBe('203.0.113.5')
  })

  it('takes the last x-forwarded-for entry, which the operator\'s proxy appended', async () => {
    expect(await ipSeen('x-forwarded-for', { 'x-forwarded-for': '1.2.3.4, 198.51.100.9' })).toBe('198.51.100.9')
  })

  it('falls back to the socket when the trusted header is missing', async () => {
    expect(await ipSeen('cloudflare', {})).toBe('10.0.0.9')
  })

  it('says unknown when there is neither a header nor a socket', async () => {
    expect(await ipSeen('', {}, {})).toBe('unknown')
  })
})
