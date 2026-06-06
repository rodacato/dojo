import { useEffect, useState } from 'react'
import { FF_SUMI_THEME_ENABLED } from '../lib/config'
import {
  applyTheme,
  getStoredTheme,
  resolveTheme,
  setStoredTheme,
  type ThemeChoice,
} from '../lib/theme'

export function useTheme(): {
  theme: ThemeChoice
  setTheme: (theme: ThemeChoice) => void
  enabled: boolean
} {
  const [theme, setThemeState] = useState<ThemeChoice>(() => getStoredTheme())

  useEffect(() => {
    if (!FF_SUMI_THEME_ENABLED) return
    if (theme !== 'auto') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(resolveTheme('auto', mq.matches))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = (next: ThemeChoice) => {
    setThemeState(next)
    setStoredTheme(next)
    if (!FF_SUMI_THEME_ENABLED) return
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(resolveTheme(next, prefersDark))
  }

  return { theme, setTheme, enabled: FF_SUMI_THEME_ENABLED }
}
