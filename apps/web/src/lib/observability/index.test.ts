import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// The module wires real `window` error / unhandledrejection events to the
// composite reporter. We replace the leaf reporters with a spy so we can
// assert exactly what report() receives — message, stack, and route — without
// hitting the network or Sentry.

const { reportSpy } = vi.hoisted(() => ({
  reportSpy: vi.fn<(report: unknown) => Promise<void>>(() => Promise.resolve()),
}))

vi.mock('./ConsoleErrorReporter', () => ({
  ConsoleErrorReporter: class {
    report = reportSpy
  },
}))
vi.mock('./ApiErrorReporter', () => ({
  ApiErrorReporter: class {
    report = vi.fn(() => Promise.resolve())
  },
}))
// Keep the real CompositeErrorReporter — it's the fan-out under test.

import { installGlobalHandlers } from './index'

// Install exactly once. The handlers are not removable, so re-installing per
// test would stack listeners and double-count reports.
beforeAll(() => {
  installGlobalHandlers()
})

beforeEach(() => {
  reportSpy.mockClear()
  window.history.replaceState({}, '', '/scrolls/closures')
})

function lastReport(): Record<string, unknown> {
  return reportSpy.mock.calls.at(-1)![0] as Record<string, unknown>
}

describe('installGlobalHandlers — window error event', () => {
  it('reports an uncaught Error with its message, stack, and the current route', () => {
    const err = new Error('kaboom')
    window.dispatchEvent(new ErrorEvent('error', { error: err, message: 'kaboom' }))

    expect(reportSpy).toHaveBeenCalledTimes(1)
    const report = lastReport()
    expect(report.message).toBe('kaboom')
    expect(report.stack).toBe(err.stack)
    expect(report.route).toBe('/scrolls/closures')
  })

  it('falls back to the event message when the error object has no message', () => {
    const err = new Error('')
    window.dispatchEvent(new ErrorEvent('error', { error: err, message: 'syntax error' }))

    expect(lastReport().message).toBe('syntax error')
  })

  it('captures the route at the moment of the error, not at install time', () => {
    window.history.replaceState({}, '', '/katas/fizzbuzz')
    window.dispatchEvent(new ErrorEvent('error', { error: new Error('x') }))

    expect(lastReport().route).toBe('/katas/fizzbuzz')
  })
})

describe('installGlobalHandlers — unhandledrejection event', () => {
  function dispatchRejection(reason: unknown) {
    const event = new Event('unhandledrejection') as PromiseRejectionEvent
    Object.defineProperty(event, 'reason', { value: reason })
    window.dispatchEvent(event)
  }

  it('reports a reason that is an Error, attaching its stack', () => {
    const reason = new Error('promise blew up')
    dispatchRejection(reason)

    const report = lastReport()
    expect(report.message).toBe('promise blew up')
    expect(report.stack).toBe(reason.stack)
  })

  it('wraps a plain-string reason into an Error, using the string as the message', () => {
    dispatchRejection('string rejection')

    const report = lastReport()
    // A string reason is wrapped in `new Error(reason)`, so it carries a stack.
    expect(report.message).toBe('string rejection')
    expect(report.stack).toContain('string rejection')
  })

  it('uses "Unhandled rejection" for a non-string, non-Error reason', () => {
    dispatchRejection({ weird: true })

    expect(lastReport().message).toBe('Unhandled rejection')
  })
})
