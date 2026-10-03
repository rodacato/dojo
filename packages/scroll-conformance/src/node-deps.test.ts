import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { nodeDeps } from './node-deps.js'
import { startPageServer } from './static-server.js'

const fixture = (path: string) => fileURLToPath(new URL(`../fixtures/${path}`, import.meta.url))
const deps = nodeDeps(async () => {
  throw new Error('no browser in this test')
})

describe('nodeDeps', () => {
  it('reads a manifest from a file', async () => {
    const text = await deps.readText(fixture('broken-no-hello/scroll.json'))
    expect(JSON.parse(text)).toMatchObject({ id: 'broken-no-hello' })
  })

  it('reads a manifest from a URL and refuses an error status', async () => {
    const server = await startPageServer({ '/scroll.json': { contentType: 'application/json', body: '{"id":"remote"}' } })
    try {
      expect(await deps.readText(`${server.origin}/scroll.json`)).toBe('{"id":"remote"}')
      await expect(deps.readText(`${server.origin}/missing.json`)).rejects.toThrow('answered 404')
    } finally {
      await server.close()
    }
  })

  it('loads the default export of a drive module', async () => {
    const drive = await deps.loadDrive(fixture('drive-e2e-fixture.mjs'))
    expect(typeof drive).toBe('function')
  })

  it('rejects a drive module without a default function', async () => {
    await expect(deps.loadDrive(fixture('serve.mjs'))).rejects.toThrow('must export a default function')
  })

  it('writes to the console', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    deps.stdout('out')
    deps.stderr('err')
    expect([log.mock.calls, error.mock.calls]).toEqual([[['out']], [['err']]])
    log.mockRestore()
    error.mockRestore()
  })

  it('hands the driver factory through', async () => {
    await expect(deps.createDriver()).rejects.toThrow('no browser in this test')
  })
})
