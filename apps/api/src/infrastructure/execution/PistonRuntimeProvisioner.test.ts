import { describe, expect, it, vi, beforeEach } from 'vitest'
import { PistonRuntimeProvisioner } from './PistonRuntimeProvisioner'
import { PISTON_RUNTIMES } from './piston-runtimes'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('PistonRuntimeProvisioner', () => {
  let provisioner: PistonRuntimeProvisioner

  beforeEach(() => {
    provisioner = new PistonRuntimeProvisioner('http://piston.test')
    mockFetch.mockReset()
  })

  function runtimesResponse(rows: Array<{ language: string; version: string }>) {
    return { ok: true, json: async () => rows }
  }
  function okInstall() {
    return { ok: true, json: async () => ({}) }
  }

  it('installs every runtime when the volume is empty', async () => {
    mockFetch
      .mockResolvedValueOnce(runtimesResponse([]))
      .mockResolvedValue(okInstall())
    // Final verify call sees them all installed.
    mockFetch.mockResolvedValueOnce(runtimesResponse([...PISTON_RUNTIMES]))

    const result = await provisioner.provision()

    expect(result.installed).toHaveLength(PISTON_RUNTIMES.length)
    expect(result.skipped).toHaveLength(0)
    expect(result.failed).toHaveLength(0)

    const installCalls = mockFetch.mock.calls.filter(([url]) =>
      String(url).endsWith('/api/v2/packages'),
    )
    expect(installCalls).toHaveLength(PISTON_RUNTIMES.length)
  })

  it('skips runtimes that are already installed', async () => {
    mockFetch.mockResolvedValueOnce(runtimesResponse([...PISTON_RUNTIMES]))
    mockFetch.mockResolvedValueOnce(runtimesResponse([...PISTON_RUNTIMES]))

    const result = await provisioner.provision()

    expect(result.skipped).toHaveLength(PISTON_RUNTIMES.length)
    expect(result.installed).toHaveLength(0)
    expect(result.failed).toHaveLength(0)

    const installCalls = mockFetch.mock.calls.filter(([url]) =>
      String(url).endsWith('/api/v2/packages'),
    )
    expect(installCalls).toHaveLength(0)
  })

  it('captures per-runtime install failures without aborting the batch', async () => {
    mockFetch.mockResolvedValueOnce(runtimesResponse([]))
    // First runtime install fails, the rest succeed.
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'package corrupt',
    })
    for (let i = 1; i < PISTON_RUNTIMES.length; i++) {
      mockFetch.mockResolvedValueOnce(okInstall())
    }
    mockFetch.mockResolvedValueOnce(runtimesResponse(PISTON_RUNTIMES.slice(1)))

    const result = await provisioner.provision()

    expect(result.failed).toHaveLength(1)
    expect(result.failed[0]).toMatchObject(PISTON_RUNTIMES[0]!)
    expect(result.failed[0]!.error).toContain('500')
    expect(result.installed).toHaveLength(PISTON_RUNTIMES.length - 1)
  })

  it('throws if the runtimes endpoint is unreachable', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
    })

    await expect(provisioner.provision()).rejects.toThrow(/502/)
  })
})
