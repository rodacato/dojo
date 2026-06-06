import { FF_SUMI_THEME_ENABLED } from './config'

export type ThemeChoice = 'auto' | 'sumi' | 'washi' | 'slate'

const STORAGE_KEY = 'dojo-theme'

export function getStoredTheme(): ThemeChoice {
  if (typeof window === 'undefined') return 'auto'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'auto' || stored === 'sumi' || stored === 'washi' || stored === 'slate') {
    return stored
  }
  return 'auto'
}

export function setStoredTheme(theme: ThemeChoice): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, theme)
}

export function resolveTheme(
  choice: ThemeChoice,
  prefersDark: boolean,
): 'sumi' | 'washi' | 'slate' {
  if (choice === 'auto') return prefersDark ? 'sumi' : 'washi'
  return choice
}

export function applyTheme(resolved: 'sumi' | 'washi' | 'slate'): void {
  if (typeof document === 'undefined') return
  if (resolved === 'slate') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', resolved)
  }
}

// Boot-time initializer. Safe to call regardless of flag — no-op when
// disabled so the Slate Indigo @theme defaults keep rendering unchanged.
export function initTheme(): void {
  if (!FF_SUMI_THEME_ENABLED) return
  const choice = getStoredTheme()
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(resolveTheme(choice, prefersDark))
}
