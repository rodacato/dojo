import type { ExerciseType, Difficulty, Verdict } from '@dojo/shared'
import { TypeBadge, DifficultyBadge } from './Badge'

interface DenseSessionRowProps {
  type: ExerciseType
  difficulty: Difficulty
  title: string
  verdict: Verdict | null
  status: string
  startedAt: string
  completedAt: string | null
  onClick: () => void
  highlightUser?: boolean
}

const VERDICT_LABEL: Record<Verdict, string> = {
  passed: 'PASSED',
  passed_with_notes: 'PASSED W/N',
  needs_work: 'NEEDS WORK',
}

const VERDICT_TONE: Record<Verdict, string> = {
  passed: 'text-success border-success/40 bg-success/10',
  passed_with_notes: 'text-warning border-warning/40 bg-warning/10',
  needs_work: 'text-danger border-danger/40 bg-danger/10',
}

// 48px dense session row used on History and on profile recent-kata lists.
// Extract per Soren — drop from current ~64-72 down to 48 so the list reads
// as a record, not a feed.
export function DenseSessionRow({
  type,
  difficulty,
  title,
  verdict,
  status,
  startedAt,
  completedAt,
  onClick,
  highlightUser = false,
}: DenseSessionRowProps) {
  const expired = status === 'failed' && !verdict
  const time = formatElapsed(startedAt, completedAt)
  const rel = formatRelative(startedAt)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-12 flex items-center gap-3 px-4 border-b border-border hover:bg-surface transition-colors text-left ${
        highlightUser ? 'bg-accent/5' : ''
      }`}
    >
      <div className="w-15 shrink-0">
        <TypeBadge type={type} />
      </div>
      <div className="w-17 shrink-0">
        <DifficultyBadge difficulty={difficulty} />
      </div>
      <span className="flex-1 min-w-0 text-primary text-[15px] truncate">{title}</span>
      <div className="w-35 shrink-0 flex justify-end">
        {verdict ? (
          <span
            className={`font-mono text-[10px] tracking-[0.08em] uppercase border px-2 py-0.5 rounded-sm ${VERDICT_TONE[verdict]}`}
          >
            {VERDICT_LABEL[verdict]}
          </span>
        ) : expired ? (
          <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted border border-border px-2 py-0.5 rounded-sm">
            Expired
          </span>
        ) : null}
      </div>
      <span className="w-15 shrink-0 text-right font-mono text-[13px] text-muted tabular-nums hidden md:block">
        {time}
      </span>
      <span className="w-22 shrink-0 text-right text-muted text-[13px] hidden lg:block">
        {rel}
      </span>
    </button>
  )
}

function formatElapsed(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return '--:--'
  const elapsedMs = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  if (elapsedMs <= 0 || !Number.isFinite(elapsedMs)) return '--:--'
  const totalSeconds = Math.floor(elapsedMs / 1000)
  const mm = Math.floor(totalSeconds / 60)
  const ss = totalSeconds % 60
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
}

function formatRelative(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffMs = now - then
  if (diffMs < 0 || !Number.isFinite(diffMs)) return ''
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(days / 365)
  return `${years}y ago`
}
