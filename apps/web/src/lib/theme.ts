export type ThemeChoice = 'auto' | 'sumi' | 'washi' | 'slate'

const STORAGE_KEY = 'dojo-theme'

export function getStoredTheme(): ThemeChoice {
  if (typeof globalThis.window === 'undefined') return 'auto'
  const stored = globalThis.localStorage.getItem(STORAGE_KEY)
  if (stored === 'auto' || stored === 'sumi' || stored === 'washi' || stored === 'slate') {
    return stored
  }
  return 'auto'
}

export function setStoredTheme(theme: ThemeChoice): void {
  if (typeof globalThis.window === 'undefined') return
  globalThis.localStorage.setItem(STORAGE_KEY, theme)
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
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = resolved
  }
}

// Boot-time initializer — runs before React mounts so the first paint
// already has the right palette. No FOUC flash from default to user
// choice. Default 'auto' resolves to sumi (dark) or washi (light)
// based on the OS prefers-color-scheme.
export function initTheme(): void {
  const choice = getStoredTheme()
  const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(resolveTheme(choice, prefersDark))
}
