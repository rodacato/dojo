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
  /** Render a full-width strip with a bottom rule in tone color (vs the default left rule). */
  bottomBorder?: boolean
  className?: string
}

const TONE_TEXT: Record<BannerTone, string> = {
  info: 'text-secondary',
  warning: 'text-warning-text',
  danger: 'text-danger-text',
}

const TONE_BORDER_LEFT: Record<BannerTone, string> = {
  info: 'border-l-secondary',
  warning: 'border-l-warning',
  danger: 'border-l-danger',
}

const TONE_BORDER_BOTTOM: Record<BannerTone, string> = {
  info: 'border-b-secondary',
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
}: Readonly<BannerProps>) {
  const wrapperClass = bottomBorder
    ? `bg-surface border-b ${TONE_BORDER_BOTTOM[tone]} px-4 md:px-8 py-3`
    : `border-l-2 ${TONE_BORDER_LEFT[tone]} pl-4 py-0.5`

  return (
    <output className={`${wrapperClass} flex max-md:flex-col md:items-center justify-between gap-x-5 gap-y-1 ${className}`}>
      <div className="min-w-0">
        <div className={`paper-eyebrow mb-1 ${TONE_TEXT[tone]}`}>
          {eyebrow}
        </div>
        <div className="text-sm text-secondary leading-relaxed">{children}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0 empty:hidden">
        {action}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="min-w-11 min-h-11 text-secondary hover:text-primary transition-colors text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>
    </output>
  )
}
