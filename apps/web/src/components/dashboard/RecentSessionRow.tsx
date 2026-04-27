import { TypeBadge } from '../ui/Badge'
import type { DashboardData } from '../../lib/api'
import type { ExerciseType } from '@dojo/shared'

const VERDICT_ICON: Record<string, { icon: string; color: string; label: string }> = {
  passed: { icon: '●', color: 'text-success', label: 'Passed' },
  passed_with_notes: { icon: '●', color: 'text-warning', label: 'Passed' },
  needs_work: { icon: '✕', color: 'text-danger', label: 'Failed' },
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Easy',
  medium: 'Med',
  hard: 'Hard',
}

interface RecentSessionRowProps {
  session: DashboardData['recentSessions'][number]
  onClick: () => void
}

export function RecentSessionRow({ session, onClick }: RecentSessionRowProps) {
  const verdict = session.verdict
    ? VERDICT_ICON[session.verdict] ?? null
    : null

  return (
    <button
      onClick={onClick}
      className="group w-full bg-page hover:bg-surface transition-all p-4 rounded-md flex flex-wrap md:flex-nowrap items-center justify-between gap-4 text-left border border-transparent hover:border-border/30"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-primary">{session.exerciseTitle}</span>
        <span className="text-[10px] text-secondary/50 font-mono uppercase tracking-tighter">
          difficulty: {DIFFICULTY_LABEL[session.difficulty] ?? session.difficulty}
        </span>
      </div>
      <div className="flex items-center gap-6">
        <TypeBadge type={session.exerciseType as ExerciseType} />
        <span className="text-xs text-muted font-mono">
          {new Date(session.startedAt).toLocaleDateString()}
        </span>
        {verdict && (
          <span
            className={`${verdict.color} text-xs font-mono uppercase tracking-widest flex items-center gap-1`}
          >
            <span className="text-[10px]">{verdict.icon}</span>
            {verdict.label}
          </span>
        )}
      </div>
    </button>
  )
}
