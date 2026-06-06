import { useEffect, useState } from 'react'
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
} {
  const [theme, setThemeState] = useState<ThemeChoice>(() => getStoredTheme())

  useEffect(() => {
    if (theme !== 'auto') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(resolveTheme('auto', mq.matches))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = (next: ThemeChoice) => {
    setThemeState(next)
    setStoredTheme(next)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(resolveTheme(next, prefersDark))
  }

  return { theme, setTheme }
}
