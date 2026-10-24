import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as CreateLoggerModule from './infrastructure/observability/createLogger'

class ExitCalled extends Error {}

const written = vi.hoisted(() => [] as string[])

vi.mock('./infrastructure/observability/createLogger', async () => {
  const actual = await vi.importActual<typeof CreateLoggerModule>('./infrastructure/observability/createLogger')
  return {
    ...actual,
    createLogger: (opts: CreateLoggerModule.LoggerOptions) =>
      actual.createLogger({ ...opts, destination: { write: (line) => void written.push(line) } }),
  }
})

async function loadConfig(env: Record<string, string>) {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  return (await import('./config')).config
}

describe('SCROLL_FRAME_ORIGINS', () => {
  beforeEach(() => {
    written.length = 0
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new ExitCalled()
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
    expect(written.join('')).toContain('SCROLL_FRAME_ORIGINS')
  })

  it('refuses loopback http in production', async () => {
    await expect(
      loadConfig({
        NODE_ENV: 'production',
        SESSION_SECRET: 'a-production-secret-that-is-long-enough-0123456789',
        SCROLL_FRAME_ORIGINS: 'http://localhost:5174',
      }),
    ).rejects.toThrow(ExitCalled)
    expect(written.join('')).toContain('SCROLL_FRAME_ORIGINS')
  })
})
