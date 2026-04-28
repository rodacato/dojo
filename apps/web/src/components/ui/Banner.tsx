import type { ReactNode } from 'react'

export type BannerTone = 'info' | 'warning' | 'danger'

interface BannerProps {
  tone?: BannerTone
  /** Caps-mono eyebrow rendered before the body. */
  eyebrow: string
  /** Inter-13 body copy. */
  children: ReactNode
  /** Optional right-aligned action (typically a ghost Button). */
  action?: ReactNode
  /** Optional × dismiss handler. Banners default to non-dismissable for cross-route persistence. */
  onDismiss?: () => void
  /** Render the banner with a 4px BOTTOM border in tone color (vs the default left border). */
  bottomBorder?: boolean
  className?: string
}

const TONE_TEXT: Record<BannerTone, string> = {
  info: 'text-accent',
  warning: 'text-warning',
  danger: 'text-danger',
}

const TONE_BORDER_LEFT: Record<BannerTone, string> = {
  info: 'border-l-accent',
  warning: 'border-l-warning',
  danger: 'border-l-danger',
}

const TONE_BORDER_BOTTOM: Record<BannerTone, string> = {
  info: 'border-b-accent',
  warning: 'border-b-warning',
  danger: 'border-b-danger',
}

export function Banner({
  tone = 'info',
  eyebrow,
  children,
  action,
  onDismiss,
  bottomBorder = false,
  className = '',
}: BannerProps) {
  const accentClass = bottomBorder
    ? `border-b-4 ${TONE_BORDER_BOTTOM[tone]}`
    : `border-l-4 ${TONE_BORDER_LEFT[tone]}`
  const wrapperClass = bottomBorder
    ? `bg-surface ${accentClass} px-6 py-3`
    : `rounded-md border border-border bg-surface ${accentClass} px-4 py-3`

  return (
    <div role="status" className={`${wrapperClass} flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <div className={`font-mono text-[11px] uppercase tracking-wider mb-1 ${TONE_TEXT[tone]}`}>
          {eyebrow}
        </div>
        <div className="text-[13px] text-secondary leading-relaxed">{children}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {action}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="text-muted hover:text-primary transition-colors text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
