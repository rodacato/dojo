import { TypeBadge, DifficultyBadge } from '../ui/Badge'
import type { DashboardData } from '../../lib/api'
import type { ExerciseType, Difficulty } from '@dojo/shared'

const VERDICT_PILL: Record<string, { label: string; classes: string }> = {
  passed: { label: 'Passed', classes: 'text-success bg-success/10 border border-success/30' },
  passed_with_notes: { label: 'Passed w/n', classes: 'text-warning bg-warning/10 border border-warning/30' },
  needs_work: { label: 'Needs work', classes: 'text-danger bg-danger/10 border border-danger/30' },
}

interface RecentSessionRowProps {
  session: DashboardData['recentSessions'][number]
  onClick: () => void
  isLast?: boolean
}

export function RecentSessionRow({ session, onClick, isLast }: RecentSessionRowProps) {
  const verdict = session.verdict ? VERDICT_PILL[session.verdict] : null
  const relativeDate = formatRelativeDate(new Date(session.startedAt))
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-3 px-4 h-12 text-left hover:bg-elevated transition-colors focus-visible:outline-none focus-visible:bg-elevated ${
        isLast ? '' : 'border-b border-border/30'
      }`}
    >
      <span className="shrink-0">
        <TypeBadge type={session.exerciseType as ExerciseType} />
      </span>
      <span className="shrink-0 hidden sm:inline-flex">
        <DifficultyBadge difficulty={session.difficulty as Difficulty} />
      </span>
      <span className="flex-1 min-w-0 text-primary text-sm font-medium truncate">
        {session.exerciseTitle}
      </span>
      {verdict && (
        <span
          className={`shrink-0 font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-sm ${verdict.classes}`}
        >
          {verdict.label}
        </span>
      )}
      <span className="shrink-0 text-muted text-xs font-mono w-14 text-right">
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
