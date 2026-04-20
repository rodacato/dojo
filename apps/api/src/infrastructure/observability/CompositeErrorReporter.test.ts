import { describe, expect, it, vi } from 'vitest'
import { CompositeErrorReporter } from './CompositeErrorReporter'
import type { ErrorReport, ErrorReporterPort } from './ports'

const makeReport = (overrides: Partial<ErrorReport> = {}): ErrorReport => ({
  message: 'boom',
  status: 500,
  source: 'api',
  ...overrides,
})

describe('CompositeErrorReporter', () => {
  it('calls every reporter with the same report', async () => {
    const a: ErrorReporterPort = { report: vi.fn().mockResolvedValue(undefined) }
    const b: ErrorReporterPort = { report: vi.fn().mockResolvedValue(undefined) }
    const composite = new CompositeErrorReporter([a, b])

    const report = makeReport()
    await composite.report(report)

    expect(a.report).toHaveBeenCalledWith(report)
    expect(b.report).toHaveBeenCalledWith(report)
  })

  it('continues dispatching when one reporter rejects', async () => {
    const failing: ErrorReporterPort = {
      report: vi.fn().mockRejectedValue(new Error('sink down')),
    }
    const ok: ErrorReporterPort = { report: vi.fn().mockResolvedValue(undefined) }
    const composite = new CompositeErrorReporter([failing, ok])

    await composite.report(makeReport())

    expect(failing.report).toHaveBeenCalledTimes(1)
    expect(ok.report).toHaveBeenCalledTimes(1)
  })

  it('does not propagate any reporter error to the caller', async () => {
    const failing: ErrorReporterPort = {
      report: vi.fn().mockRejectedValue(new Error('sink down')),
    }
    const composite = new CompositeErrorReporter([failing])

    await expect(composite.report(makeReport())).resolves.toBeUndefined()
  })

  it('handles an empty reporter list without throwing', async () => {
    const composite = new CompositeErrorReporter([])
    await expect(composite.report(makeReport())).resolves.toBeUndefined()
  })

  it('dispatches reporters in parallel (does not serialize on rejection)', async () => {
    const order: string[] = []
    const slowFail: ErrorReporterPort = {
      report: async () => {
        await new Promise((r) => setTimeout(r, 30))
        order.push('slow-fail')
        throw new Error('slow fail')
      },
    }
    const fastOk: ErrorReporterPort = {
      report: async () => {
        order.push('fast-ok')
      },
    }
    const composite = new CompositeErrorReporter([slowFail, fastOk])

    await composite.report(makeReport())

    expect(order).toEqual(['fast-ok', 'slow-fail'])
  })
})
