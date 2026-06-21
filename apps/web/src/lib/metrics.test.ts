import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as Sentry from '@sentry/react'
import { trackEvent } from './metrics'

vi.mock('@sentry/react', () => ({
  addBreadcrumb: vi.fn(),
}))

const addBreadcrumb = vi.mocked(Sentry.addBreadcrumb)

describe('trackEvent', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    addBreadcrumb.mockReset()
    addBreadcrumb.mockImplementation(() => undefined)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T12:34:56.789Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('emits a console.info line with the metric envelope and ISO timestamp', () => {
    const info = vi.mocked(console.info)
    trackEvent('playground_run', { lessonId: 'k1' })

    expect(info).toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledWith({
      evt: 'metric',
      name: 'playground_run',
      at: '2026-06-20T12:34:56.789Z',
      payload: { lessonId: 'k1' },
    })
  })

  it('defaults the payload to an empty object when omitted', () => {
    const info = vi.mocked(console.info)
    trackEvent('playground_cta_click')

    expect(info).toHaveBeenCalledTimes(1)
    const line = info.mock.calls[0]![0] as { payload: Record<string, unknown> }
    expect(line.payload).toEqual({})
  })

  it('uses the live clock so two events get distinct timestamps', () => {
    const info = vi.mocked(console.info)

    trackEvent('playground_run')
    vi.setSystemTime(new Date('2026-06-20T12:35:00.000Z'))
    trackEvent('playground_run')

    const first = info.mock.calls[0]![0] as { at: string }
    const second = info.mock.calls[1]![0] as { at: string }
    expect(first.at).toBe('2026-06-20T12:34:56.789Z')
    expect(second.at).toBe('2026-06-20T12:35:00.000Z')
    expect(first.at).not.toBe(second.at)
  })

  it('records a Sentry breadcrumb mirroring the event name and payload', () => {
    trackEvent('playground_cta_click', { target: 'hero' })

    expect(addBreadcrumb).toHaveBeenCalledTimes(1)
    expect(addBreadcrumb).toHaveBeenCalledWith({
      category: 'metric',
      level: 'info',
      message: 'playground_cta_click',
      data: { target: 'hero' },
    })
  })

  it('passes the default empty payload to the breadcrumb data field', () => {
    trackEvent('playground_run')

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ data: {} }),
    )
  })

  it('still logs to console even when the breadcrumb call throws', () => {
    const info = vi.mocked(console.info)
    addBreadcrumb.mockImplementation(() => {
      throw new Error('Sentry not initialized')
    })

    expect(() => trackEvent('playground_run', { n: 1 })).not.toThrow()
    expect(info).toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'playground_run', payload: { n: 1 } }),
    )
  })

  it('logs to console before attempting the breadcrumb (ordering)', () => {
    const order: string[] = []
    vi.mocked(console.info).mockImplementation(() => {
      order.push('console')
    })
    addBreadcrumb.mockImplementation(() => {
      order.push('sentry')
      return undefined
    })

    trackEvent('playground_run')

    expect(order).toEqual(['console', 'sentry'])
  })

  it('keeps console and breadcrumb payloads referentially aligned to the caller object', () => {
    const info = vi.mocked(console.info)
    const payload = { deep: { value: 42 } }

    trackEvent('playground_run', payload)

    const line = info.mock.calls[0]![0] as { payload: Record<string, unknown> }
    expect(line.payload).toBe(payload)
    expect(addBreadcrumb.mock.calls[0]![0].data).toBe(payload)
  })
})
