import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useOnline } from './useOnline'

function setNavigatorOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    value,
  })
}

describe('useOnline', () => {
  beforeEach(() => {
    setNavigatorOnline(true)
  })

  afterEach(() => {
    vi.useRealTimers()
    setNavigatorOnline(true)
  })

  it('reflects the initial navigator.onLine state', () => {
    setNavigatorOnline(true)
    const { result } = renderHook(() => useOnline())

    expect(result.current.online).toBe(true)
    expect(result.current.offlineSince).toBeNull()
  })

  it('starts offline with a timestamp when navigator is offline at mount', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-21T10:00:00Z'))
    setNavigatorOnline(false)

    const { result } = renderHook(() => useOnline())

    expect(result.current.online).toBe(false)
    expect(result.current.offlineSince).toBe(Date.parse('2026-06-21T10:00:00Z'))
  })

  it('flips to offline and records offlineSince when the offline event fires', () => {
    vi.useFakeTimers()
    const offlineAt = Date.parse('2026-06-21T12:30:00Z')
    vi.setSystemTime(offlineAt)

    const { result } = renderHook(() => useOnline())
    expect(result.current.online).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current.online).toBe(false)
    expect(result.current.offlineSince).toBe(offlineAt)
  })

  it('flips back to online and clears offlineSince on the online event', () => {
    const { result } = renderHook(() => useOnline())

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current.online).toBe(false)
    expect(result.current.offlineSince).not.toBeNull()

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current.online).toBe(true)
    expect(result.current.offlineSince).toBeNull()
  })

  it('stops responding to events after unmount (listeners removed)', () => {
    const { result, unmount } = renderHook(() => useOnline())
    expect(result.current.online).toBe(true)

    unmount()

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current.online).toBe(true)
    expect(result.current.offlineSince).toBeNull()
  })
})
