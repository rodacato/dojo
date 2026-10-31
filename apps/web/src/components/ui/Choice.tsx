import type { ButtonHTMLAttributes } from 'react'

interface ChoiceProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean
}

/** A pressed option. Selection is neutral: the accent stays reserved for actions (D42). */
export function Choice({ selected, className = '', children, ...props }: Readonly<ChoiceProps>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex items-center justify-center min-w-11 min-h-11 px-4 py-2.5 font-mono text-xs rounded-sm border transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        selected
          ? 'border-primary bg-elevated text-primary font-semibold shadow-[inset_0_0_0_1px_var(--color-primary)]'
          : 'border-border text-secondary hover:border-secondary'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
