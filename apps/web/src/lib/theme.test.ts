import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  getStoredTheme,
  setStoredTheme,
  resolveTheme,
  applyTheme,
  initTheme,
  type ThemeChoice,
} from './theme'

const STORAGE_KEY = 'dojo-theme'

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  vi.restoreAllMocks()
})

describe('getStoredTheme', () => {
  it('returns "auto" when nothing is stored', () => {
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(getStoredTheme()).toBe('auto')
  })

  it.each(['auto', 'sumi', 'washi', 'slate'] as const)(
    'reads back the valid stored value "%s"',
    (value) => {
      window.localStorage.setItem(STORAGE_KEY, value)
      expect(getStoredTheme()).toBe(value)
    },
  )

  it('falls back to "auto" for an unrecognized stored value', () => {
    window.localStorage.setItem(STORAGE_KEY, 'midnight')
    expect(getStoredTheme()).toBe('auto')
  })

  it('falls back to "auto" for an empty-string stored value', () => {
    window.localStorage.setItem(STORAGE_KEY, '')
    expect(getStoredTheme()).toBe('auto')
  })

  it('is case-sensitive — "Sumi" is not a valid value', () => {
    window.localStorage.setItem(STORAGE_KEY, 'Sumi')
    expect(getStoredTheme()).toBe('auto')
  })
})

describe('setStoredTheme', () => {
  it.each(['auto', 'sumi', 'washi', 'slate'] as const)(
    'persists "%s" under the dojo-theme key',
    (value) => {
      setStoredTheme(value)
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe(value)
    },
  )

  it('overwrites a previously stored value', () => {
    setStoredTheme('sumi')
    setStoredTheme('washi')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('washi')
  })

  it('round-trips through getStoredTheme', () => {
    setStoredTheme('slate')
    expect(getStoredTheme()).toBe('slate')
  })
})

describe('resolveTheme', () => {
  it('maps "auto" + prefersDark=true to "sumi"', () => {
    expect(resolveTheme('auto', true)).toBe('sumi')
  })

  it('maps "auto" + prefersDark=false to "washi"', () => {
    expect(resolveTheme('auto', false)).toBe('washi')
  })

  it.each(['sumi', 'washi', 'slate'] as const)(
    'passes the explicit choice "%s" through regardless of prefersDark',
    (choice) => {
      expect(resolveTheme(choice, true)).toBe(choice)
      expect(resolveTheme(choice, false)).toBe(choice)
    },
  )

  it('never returns "auto" — it always resolves to a concrete palette', () => {
    const choices: ThemeChoice[] = ['auto', 'sumi', 'washi', 'slate']
    for (const choice of choices) {
      for (const prefersDark of [true, false]) {
        const resolved = resolveTheme(choice, prefersDark)
        expect(['sumi', 'washi', 'slate']).toContain(resolved)
      }
    }
  })
})

describe('applyTheme', () => {
  it('sets data-theme="sumi" on the document element', () => {
    applyTheme('sumi')
    expect(document.documentElement.getAttribute('data-theme')).toBe('sumi')
  })

  it('sets data-theme="washi" on the document element', () => {
    applyTheme('washi')
    expect(document.documentElement.getAttribute('data-theme')).toBe('washi')
  })

  it('removes the data-theme attribute for "slate" (the default palette)', () => {
    document.documentElement.setAttribute('data-theme', 'sumi')
    applyTheme('slate')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('is a no-op-safe remove when no attribute is present', () => {
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    applyTheme('slate')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('overwrites a prior theme attribute when switching palettes', () => {
    applyTheme('sumi')
    applyTheme('washi')
    expect(document.documentElement.getAttribute('data-theme')).toBe('washi')
  })
})

describe('initTheme', () => {
  function stubMatchMedia(prefersDark: boolean) {
    const fn = vi.fn((query: string) => ({
      matches: prefersDark,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    vi.spyOn(window, 'matchMedia').mockImplementation(
      fn as unknown as typeof window.matchMedia,
    )
    return fn
  }

  it('queries the OS prefers-color-scheme media feature', () => {
    const matchMedia = stubMatchMedia(false)
    initTheme()
    expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
  })

  it('with no stored choice and dark OS preference, applies sumi', () => {
    stubMatchMedia(true)
    initTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('sumi')
  })

  it('with no stored choice and light OS preference, applies washi', () => {
    stubMatchMedia(false)
    initTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('washi')
  })

  it('honors an explicit stored "washi" even when the OS prefers dark', () => {
    window.localStorage.setItem(STORAGE_KEY, 'washi')
    stubMatchMedia(true)
    initTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('washi')
  })

  it('honors an explicit stored "sumi" even when the OS prefers light', () => {
    window.localStorage.setItem(STORAGE_KEY, 'sumi')
    stubMatchMedia(false)
    initTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('sumi')
  })

  it('removes the data-theme attribute when the stored choice is "slate"', () => {
    window.localStorage.setItem(STORAGE_KEY, 'slate')
    document.documentElement.setAttribute('data-theme', 'sumi')
    stubMatchMedia(true)
    initTheme()
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('treats an invalid stored value as "auto" and resolves via the OS preference', () => {
    window.localStorage.setItem(STORAGE_KEY, 'garbage')
    stubMatchMedia(true)
    initTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('sumi')
  })
})
