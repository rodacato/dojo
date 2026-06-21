import { useEffect, useState } from 'react'

// Resolved hex values of the brand --color-* tokens for the active
// theme. Used by libraries whose APIs require literal hex strings
// (CodeMirror EditorView.theme, mermaid.initialize) and therefore
// can't reference CSS variables directly.
export interface ThemeTokens {
  page: string
  surface: string
  elevated: string
  border: string
  accent: string
  success: string
  danger: string
  warning: string
  primary: string
  secondary: string
  muted: string
  typeCode: string
  typeChat: string
  typeWhiteboard: string
  typeReview: string
  isDark: boolean
}

// Fallback used for SSR or before the first paint. Matches Slate Indigo
// — same as the @theme defaults in main.css.
const SSR_FALLBACK: ThemeTokens = {
  page: '#0F172A',
  surface: '#1E293B',
  elevated: '#253347',
  border: '#334155',
  accent: '#6366F1',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  primary: '#F8FAFC',
  secondary: '#94A3B8',
  muted: '#475569',
  typeCode: '#64748B',
  typeChat: '#7C3AED',
  typeWhiteboard: '#0D9488',
  typeReview: '#6366F1',
  isDark: true,
}

function isDarkHex(hex: string): boolean {
  const h = hex.replace('#', '').trim()
  if (h.length !== 6) return true
  const r = Number.parseInt(h.slice(0, 2), 16)
  const g = Number.parseInt(h.slice(2, 4), 16)
  const b = Number.parseInt(h.slice(4, 6), 16)
  const luma = 0.299 * r + 0.587 * g + 0.114 * b
  return luma < 128
}

function readTokens(): ThemeTokens {
  const root = getComputedStyle(document.documentElement)
  const get = (n: string) => root.getPropertyValue(n).trim()
  const page = get('--color-page')
  return {
    page,
    surface: get('--color-surface'),
    elevated: get('--color-elevated'),
    border: get('--color-border'),
    accent: get('--color-accent'),
    success: get('--color-success'),
    danger: get('--color-danger'),
    warning: get('--color-warning'),
    primary: get('--color-primary'),
    secondary: get('--color-secondary'),
    muted: get('--color-muted'),
    typeCode: get('--color-type-code'),
    typeChat: get('--color-type-chat'),
    typeWhiteboard: get('--color-type-whiteboard'),
    typeReview: get('--color-type-review'),
    isDark: isDarkHex(page),
  }
}

// Returns the live resolved hex values of the brand tokens. Updates
// when the user flips the theme (mutates data-theme on <html>).
export function useThemeTokens(): ThemeTokens {
  const [tokens, setTokens] = useState<ThemeTokens>(() => {
    if (typeof document === 'undefined') return SSR_FALLBACK
    return readTokens()
  })

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-theme') {
          setTokens(readTokens())
          return
        }
      }
    })
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  return tokens
}

// Convert "#RRGGBB" → "rgba(r,g,b,a)" for places where the consuming API
// only takes a color string and we want a low-opacity tint of a token.
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '').trim()
  if (h.length !== 6) return hex
  const r = Number.parseInt(h.slice(0, 2), 16)
  const g = Number.parseInt(h.slice(2, 4), 16)
  const b = Number.parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
