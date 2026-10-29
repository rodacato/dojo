export type ThemeChoice = 'auto' | 'sumi' | 'washi'

type ResolvedTheme = 'sumi' | 'washi'

const STORAGE_KEY = 'dojo-theme'

export function getStoredTheme(): ThemeChoice {
  if (globalThis.window === undefined) return 'auto'
  const stored = globalThis.localStorage.getItem(STORAGE_KEY)
  if (stored === 'auto' || stored === 'sumi' || stored === 'washi') {
    return stored
  }
  return 'auto'
}

export function setStoredTheme(theme: ThemeChoice): void {
  if (globalThis.window === undefined) return
  globalThis.localStorage.setItem(STORAGE_KEY, theme)
}

export function resolveTheme(
  choice: ThemeChoice,
  prefersDark: boolean,
): ResolvedTheme {
  if (choice === 'auto') return prefersDark ? 'sumi' : 'washi'
  return choice
}

export function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = resolved
  syncThemeColor(resolved)
}

const THEME_COLORS = { sumi: '#0A0908', washi: '#F5F1E8' } as const

// An explicit choice collapses the media-scoped tags into one color.
function syncThemeColor(resolved: ResolvedTheme): void {
  const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
  if (metas.length === 0) return
  const [first, ...rest] = metas
  rest.forEach((meta) => meta.remove())
  first?.removeAttribute('media')
  if (first) first.content = THEME_COLORS[resolved]
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
