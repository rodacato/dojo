import { useTheme } from '../../hooks/useTheme'
import type { ThemeChoice } from '../../lib/theme'
import { Icon } from './Icon'

function nextTheme(current: ThemeChoice): ThemeChoice {
  return current === 'sumi' ? 'washi' : 'sumi'
}

interface ThemeToggleProps {
  /** `rail` names the current theme beside its icon; `text` names the theme a click moves to. */
  variant?: 'rail' | 'text'
  className?: string
}

export function ThemeToggle({ variant = 'text', className = '' }: Readonly<ThemeToggleProps>) {
  const { theme, setTheme } = useTheme()
  const next = nextTheme(theme)

  if (variant === 'rail') {
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        aria-label={`Switch theme, currently ${theme}`}
        className={`nav-item w-full gap-1 px-0.5 rounded-sm whitespace-nowrap hover:bg-elevated ${className}`}
      >
        <Icon name="theme" size={16} />
        <span>{theme}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch theme to ${next}`}
      className={`inline-flex items-center justify-center min-w-11 min-h-11 font-mono text-xs uppercase text-secondary hover:text-primary transition-colors ${className}`}
    >
      {next}
    </button>
  )
}
