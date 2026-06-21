import { act, createElement, type FC } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRotatingMessage } from './useRotatingMessage'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true

/**
 * Local ESM renderHook. @testing-library/react resolves a CJS react-dom whose
 * dispatcher never reaches the ESM `react` the hook imports under Vite, so its
 * renderHook crashes with a null dispatcher. Driving react-dom/client directly
 * keeps a single ESM instance and exercises the real hook.
 */
function renderHook<T>(callback: () => T): {
  result: { current: T }
  unmount: () => void
} {
  const result = { current: undefined as T }
  const Probe: FC = () => {
    result.current = callback()
    return null
  }
  const container = document.createElement('div')
  let root: Root
  act(() => {
    root = createRoot(container)
    root.render(createElement(Probe))
  })
  return {
    result,
    unmount: () => act(() => root.unmount()),
  }
}

describe('useRotatingMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the first message before any interval elapses', () => {
    const { result } = renderHook(() =>
      useRotatingMessage(['one', 'two', 'three']),
    )
    expect(result.current).toBe('one')
  })

  it('advances to the next message after each interval', () => {
    const { result } = renderHook(() =>
      useRotatingMessage(['one', 'two', 'three'], 1000),
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current).toBe('two')

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current).toBe('three')
  })

  it('wraps around to the first message after the last', () => {
    const { result } = renderHook(() => useRotatingMessage(['one', 'two'], 1000))

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current).toBe('two')

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current).toBe('one')
  })

  it('does not advance before the interval is fully reached', () => {
    const { result } = renderHook(() => useRotatingMessage(['one', 'two'], 1000))

    act(() => {
      vi.advanceTimersByTime(999)
    })
    expect(result.current).toBe('one')
  })

  it('honors a custom interval rather than the default', () => {
    const { result } = renderHook(() => useRotatingMessage(['a', 'b'], 5000))

    act(() => {
      vi.advanceTimersByTime(3500)
    })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(result.current).toBe('b')
  })

  it('stops rotating after unmount (interval is cleared)', () => {
    const { result, unmount } = renderHook(() =>
      useRotatingMessage(['one', 'two', 'three'], 1000),
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current).toBe('two')

    unmount()

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current).toBe('two')
  })
})
