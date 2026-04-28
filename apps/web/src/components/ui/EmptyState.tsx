import type { ReactNode } from 'react'

interface EmptyStateProps {
  /** Caps-mono eyebrow with a small leading red dot. e.g. `Empty · Kata history`. */
  eyebrow: string
  /** Inter 18 secondary line — the WHY. */
  headline: string
  /** Optional 11-mono muted microcopy under the CTA cluster — context, not call to action. */
  microcopy?: string
  /** Primary action (the WHAT NEXT). */
  action?: ReactNode
  /** Optional ghost-style secondary action. */
  secondaryAction?: ReactNode
  /** Layout: `card` wraps the content in a bordered card; `inline` renders bare. */
  variant?: 'card' | 'inline'
  className?: string
}

export function EmptyState({
  eyebrow,
  headline,
  microcopy,
  action,
  secondaryAction,
  variant = 'card',
  className = '',
}: EmptyStateProps) {
  const wrapperClass =
    variant === 'card'
      ? 'rounded-md border border-border bg-surface px-6 py-12 text-center'
      : 'px-6 py-12 text-center'

  return (
    <div className={`${wrapperClass} ${className}`}>
      <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted mb-4">
        <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full bg-danger/80" />
        {eyebrow}
      </div>
      <p className="text-secondary text-[18px] leading-snug max-w-xl mx-auto">{headline}</p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
      {microcopy && (
        <p className="mt-4 font-mono text-[11px] text-muted max-w-xl mx-auto">{microcopy}</p>
      )}
    </div>
  )
}
