import { TypeBadge, DifficultyBadge } from '../ui/Badge'
import type { DashboardData } from '../../lib/api'
import type { KataType, Difficulty } from '@dojo/shared'
import { isVerdict, VERDICT_LABELS, VERDICT_PILL } from '../../lib/verdict'

interface RecentSessionRowProps {
  session: DashboardData['recentSessions'][number]
  onClick: () => void
}

export function RecentSessionRow({ session, onClick }: Readonly<RecentSessionRowProps>) {
  const { verdict } = session
  const relativeDate = formatRelativeDate(new Date(session.startedAt))
  return (
    <button
      onClick={onClick}
      className="group w-full flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1.5 px-2 min-h-12 py-2 sm:py-0 text-left hover:bg-elevated transition-colors focus-visible:outline-none focus-visible:bg-elevated"
    >
      <span className="shrink-0">
        <TypeBadge type={session.kataType as KataType} />
      </span>
      <span className="shrink-0 hidden sm:inline-flex">
        <DifficultyBadge difficulty={session.difficulty as Difficulty} />
      </span>
      {/* The full verdict leaves the title no width on a phone, so it takes a line of its own. */}
      <span className="order-first basis-full sm:order-none sm:basis-auto flex-1 min-w-0 text-primary text-sm font-medium truncate">
        {session.kataTitle}
      </span>
      {isVerdict(verdict) && (
        <span
          className={`shrink-0 font-mono text-xs uppercase tracking-wider border px-2 py-0.5 rounded-sm ${VERDICT_PILL[verdict]}`}
        >
          {VERDICT_LABELS[verdict]}
        </span>
      )}
      <span className="ml-auto sm:ml-0 shrink-0 text-secondary text-xs font-mono w-14 text-right">
        {relativeDate}
      </span>
    </button>
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
