import { Link } from 'react-router-dom'
import type { DashboardData } from '../../lib/api'
import type { KataType, Verdict } from '@dojo/shared'
import { TypeRuleBadge } from '../ui/Badge'
import { isVerdict, VERDICT_LABELS, VERDICT_TEXT } from '../../lib/verdict'

interface RecentSessionRowProps {
  session: DashboardData['recentSessions'][number]
  to: string
}

export function RecentSessionRow({ session, to }: Readonly<RecentSessionRowProps>) {
  const { verdict } = session
  return (
    <Link
      to={to}
      className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-3 gap-y-2 md:gap-x-4.5 min-h-14.5 py-3.5 md:py-3 border-b border-border text-primary hover:bg-surface transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
    >
      <span className="min-w-0 wrap-anywhere text-sm font-medium">{session.kataTitle}</span>
      <span className="max-md:row-start-2 flex items-center gap-2">
        <TypeRuleBadge type={session.kataType as KataType} />
        <span className="font-mono text-[11px] uppercase text-secondary">{session.difficulty}</span>
      </span>
      {isVerdict(verdict) ? (
        <VerdictLabel verdict={verdict} className="max-md:row-start-2 max-md:col-start-2 md:min-w-31.5 text-right" />
      ) : (
        <span className="max-md:hidden md:min-w-31.5" />
      )}
      <span className="max-md:row-start-1 max-md:col-start-2 self-start md:self-auto justify-self-end min-w-7 text-right font-mono text-xs text-secondary">
        {formatRelativeDate(new Date(session.startedAt))}
      </span>
    </Link>
  )
}

export function VerdictLabel({ verdict, className = '' }: Readonly<{ verdict: Verdict; className?: string }>) {
  return (
    <span
      className={`font-mono text-xs uppercase tracking-[0.02em] before:content-[''] before:inline-block before:size-1 before:bg-current before:mr-1.5 before:align-middle ${VERDICT_TEXT[verdict]} ${className}`}
    >
      {VERDICT_LABELS[verdict]}
    </span>
  )
}

/**
 * Compact relative date formatter — `14m`, `2h`, `3d`, `2w`, `4mo`.
 * Designed for dense table rows. Falls back to ISO if date is in the future.
 */
function formatRelativeDate(d: Date): string {
  const diffMs = Date.now() - d.getTime()
  if (diffMs < 0) return d.toISOString().slice(0, 10)
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return `${Math.max(diffMin, 1)}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays < 7) return `${diffDays}d`
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 5) return `${diffWeeks}w`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}mo`
}
