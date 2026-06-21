import { act, createElement, type FC } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTheme } from './useTheme'

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

const STORAGE_KEY = 'dojo-theme'

type MqListener = (event: MediaQueryListEvent) => void

interface FakeMatchMedia {
  matches: boolean
  listenerCount: number
  emitChange: () => void
}

function installMatchMedia(prefersDark: boolean): FakeMatchMedia {
  const listeners = new Set<MqListener>()
  const state = { matches: prefersDark }

  window.matchMedia = ((query: string) => ({
    get matches() {
      return state.matches
    },
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: (_type: string, cb: MqListener) => {
      listeners.add(cb)
    },
    removeEventListener: (_type: string, cb: MqListener) => {
      listeners.delete(cb)
    },
    dispatchEvent: vi.fn(() => true),
  })) as unknown as typeof window.matchMedia

  return {
    get matches() {
      return state.matches
    },
    set matches(value: boolean) {
      state.matches = value
    },
    get listenerCount() {
      return listeners.size
    },
    emitChange() {
      const event = { matches: state.matches } as MediaQueryListEvent
      for (const cb of listeners) cb(event)
    },
  } as FakeMatchMedia
}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  installMatchMedia(false)
})

afterEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

describe('useTheme', () => {
  it('initializes from a stored explicit choice', () => {
    window.localStorage.setItem(STORAGE_KEY, 'washi')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('washi')
  })

  it('defaults to "auto" when nothing is stored', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('auto')
  })

  it('falls back to "auto" when the stored value is not a known theme', () => {
    window.localStorage.setItem(STORAGE_KEY, 'neon-pink')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('auto')
  })

  it('setTheme updates state, persists to localStorage, and applies to the DOM', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('washi')
    })

    expect(result.current.theme).toBe('washi')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('washi')
    expect(document.documentElement.getAttribute('data-theme')).toBe('washi')
  })

  it('applies "slate" by removing the data-theme attribute', () => {
    document.documentElement.setAttribute('data-theme', 'washi')
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('slate')
    })

    expect(result.current.theme).toBe('slate')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('slate')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('resolves "auto" to the dark palette (sumi) when the OS prefers dark', () => {
    installMatchMedia(true)
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('auto')
    })

    expect(result.current.theme).toBe('auto')
    expect(document.documentElement.getAttribute('data-theme')).toBe('sumi')
  })

  it('resolves "auto" to the light palette (washi) when the OS prefers light', () => {
    installMatchMedia(false)
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('auto')
    })

    expect(document.documentElement.getAttribute('data-theme')).toBe('washi')
  })

  it('re-applies the palette when the OS preference flips while on "auto"', () => {
    window.localStorage.setItem(STORAGE_KEY, 'auto')
    const mq = installMatchMedia(false)
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('auto')

    act(() => {
      mq.matches = true
      mq.emitChange()
    })
    expect(document.documentElement.getAttribute('data-theme')).toBe('sumi')

    act(() => {
      mq.matches = false
      mq.emitChange()
    })
    expect(document.documentElement.getAttribute('data-theme')).toBe('washi')
  })

  it('does not listen for OS changes when an explicit theme is selected', () => {
    window.localStorage.setItem(STORAGE_KEY, 'sumi')
    const mq = installMatchMedia(false)
    renderHook(() => useTheme())

    expect(mq.listenerCount).toBe(0)
  })

  it('stops reacting to OS changes after switching from auto to explicit', () => {
    window.localStorage.setItem(STORAGE_KEY, 'auto')
    const mq = installMatchMedia(false)
    const { result } = renderHook(() => useTheme())
    expect(mq.listenerCount).toBe(1)

    act(() => {
      result.current.setTheme('washi')
    })
    expect(mq.listenerCount).toBe(0)

    act(() => {
      mq.matches = true
      mq.emitChange()
    })
    expect(document.documentElement.getAttribute('data-theme')).toBe('washi')
  })

  it('removes the OS change listener on unmount', () => {
    window.localStorage.setItem(STORAGE_KEY, 'auto')
    const mq = installMatchMedia(false)
    const { unmount } = renderHook(() => useTheme())
    expect(mq.listenerCount).toBe(1)

    unmount()

    expect(mq.listenerCount).toBe(0)
  })
})
