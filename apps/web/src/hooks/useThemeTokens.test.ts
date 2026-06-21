import { renderHook, waitFor, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { hexToRgba, useThemeTokens } from './useThemeTokens'

const DARK_TOKENS: Record<string, string> = {
  '--color-page': '#0F172A',
  '--color-surface': '#1E293B',
  '--color-elevated': '#253347',
  '--color-border': '#334155',
  '--color-accent': '#6366F1',
  '--color-success': '#10B981',
  '--color-danger': '#EF4444',
  '--color-warning': '#F59E0B',
  '--color-primary': '#F8FAFC',
  '--color-secondary': '#94A3B8',
  '--color-muted': '#475569',
  '--color-type-code': '#64748B',
  '--color-type-chat': '#7C3AED',
  '--color-type-whiteboard': '#0D9488',
  '--color-type-review': '#6366F1',
}

const LIGHT_TOKENS: Record<string, string> = {
  ...DARK_TOKENS,
  '--color-page': '#FFFFFF',
  '--color-primary': '#0F172A',
}

function applyTokens(tokens: Record<string, string>): void {
  for (const [name, value] of Object.entries(tokens)) {
    document.documentElement.style.setProperty(name, value)
  }
}

function clearTokens(): void {
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('data-theme')
}

describe('useThemeTokens', () => {
  beforeEach(() => {
    clearTokens()
  })

  afterEach(() => {
    clearTokens()
  })

  it('returns the resolved hex values of the brand tokens from the document', () => {
    applyTokens(DARK_TOKENS)

    const { result } = renderHook(() => useThemeTokens())

    expect(result.current.page).toBe('#0F172A')
    expect(result.current.accent).toBe('#6366F1')
    expect(result.current.typeChat).toBe('#7C3AED')
    expect(result.current.typeWhiteboard).toBe('#0D9488')
  })

  it('derives isDark from the luma of the page token', () => {
    applyTokens(DARK_TOKENS)
    const dark = renderHook(() => useThemeTokens())
    expect(dark.result.current.isDark).toBe(true)

    clearTokens()
    applyTokens(LIGHT_TOKENS)
    const light = renderHook(() => useThemeTokens())
    expect(light.result.current.isDark).toBe(false)
    expect(light.result.current.page).toBe('#FFFFFF')
  })

  it('re-reads tokens when data-theme flips on <html>', async () => {
    applyTokens(DARK_TOKENS)

    const { result } = renderHook(() => useThemeTokens())
    expect(result.current.page).toBe('#0F172A')
    expect(result.current.isDark).toBe(true)

    act(() => {
      applyTokens(LIGHT_TOKENS)
      document.documentElement.setAttribute('data-theme', 'light')
    })

    await waitFor(() => {
      expect(result.current.page).toBe('#FFFFFF')
    })
    expect(result.current.isDark).toBe(false)
  })

  it('ignores mutations to attributes other than data-theme', async () => {
    applyTokens(DARK_TOKENS)

    const { result } = renderHook(() => useThemeTokens())
    const before = result.current

    act(() => {
      // Swap token values but mutate an unrelated attribute. The observer
      // only reacts to data-theme, so the returned object must be stable.
      applyTokens(LIGHT_TOKENS)
      document.documentElement.setAttribute('lang', 'es')
    })

    await Promise.resolve()
    expect(result.current).toBe(before)
    expect(result.current.page).toBe('#0F172A')
  })

  it('stops reacting to theme changes after unmount', async () => {
    applyTokens(DARK_TOKENS)

    const { result, unmount } = renderHook(() => useThemeTokens())
    expect(result.current.page).toBe('#0F172A')

    unmount()

    act(() => {
      applyTokens(LIGHT_TOKENS)
      document.documentElement.setAttribute('data-theme', 'light')
    })

    await Promise.resolve()
    await Promise.resolve()
    expect(result.current.page).toBe('#0F172A')
  })
})

describe('hexToRgba', () => {
  it('converts a 6-digit hex to an rgba string with the given alpha', () => {
    expect(hexToRgba('#6366F1', 0.2)).toBe('rgba(99, 102, 241, 0.2)')
  })

  it('returns the input untouched when it is not a 6-digit hex', () => {
    expect(hexToRgba('rgb(0,0,0)', 0.5)).toBe('rgb(0,0,0)')
  })
})
