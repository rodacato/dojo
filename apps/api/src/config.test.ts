import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

class ExitCalled extends Error {}

async function loadConfig(env: Record<string, string>) {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  return (await import('./config')).config
}

describe('SCROLL_FRAME_ORIGINS', () => {
  let errors: string[]

  beforeEach(() => {
    errors = []
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new ExitCalled()
    })
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('defaults to an empty list', async () => {
    const config = await loadConfig({ SCROLL_FRAME_ORIGINS: '' })
    expect(config.SCROLL_FRAME_ORIGINS).toEqual([])
  })

  it('parses a trimmed comma-separated list', async () => {
    const config = await loadConfig({
      SCROLL_FRAME_ORIGINS: ' https://a.example.org , http://localhost:5174 ',
    })
    expect(config.SCROLL_FRAME_ORIGINS).toEqual(['https://a.example.org', 'http://localhost:5174'])
  })

  it('refuses to boot on an invalid value and names the variable', async () => {
    await expect(loadConfig({ SCROLL_FRAME_ORIGINS: 'https://*.example.org' })).rejects.toThrow(ExitCalled)
    expect(errors.join('\n')).toContain('SCROLL_FRAME_ORIGINS')
  })

  it('refuses loopback http in production', async () => {
    await expect(
      loadConfig({
        NODE_ENV: 'production',
        SESSION_SECRET: 'a-production-secret-that-is-long-enough-0123456789',
        SCROLL_FRAME_ORIGINS: 'http://localhost:5174',
      }),
    ).rejects.toThrow(ExitCalled)
    expect(errors.join('\n')).toContain('SCROLL_FRAME_ORIGINS')
  })
})
