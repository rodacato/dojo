import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { KataType, Difficulty, Verdict, HistoryOutcome } from '@dojo/shared'
import { TypeRuleBadge } from './Badge'
import { VERDICT_LABELS, VERDICT_TEXT } from '../../lib/verdict'

interface RowContent {
  type: KataType
  difficulty: Difficulty
  title: string
  verdict: Verdict | null
  status: string
  startedAt: string
  completedAt: string | null
  /** The server's reading of the session. Without it, a failed session with no verdict reads as expired. */
  outcome?: HistoryOutcome
  /** Show the start time instead of elapsed and relative time, for rows already grouped by day. */
  showClock?: boolean
  highlightUser?: boolean
}

type RowTarget =
  | { onClick: () => void; to?: never; linkState?: never }
  | { to: string; linkState?: unknown; onClick?: never }

const ROW_CLASSES =
  'w-full min-h-22 md:min-h-14 py-3.5 md:py-2.5 px-1 md:px-2 grid grid-cols-[minmax(0,1fr)_auto_1rem] md:flex items-center gap-x-3 gap-y-2 md:gap-x-4 border-b border-border hover:bg-surface transition-colors text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent'

export function DenseSessionRow({
  type,
  difficulty,
  title,
  verdict,
  status,
  startedAt,
  completedAt,
  outcome,
  showClock = false,
  highlightUser = false,
  ...target
}: Readonly<RowContent & RowTarget>) {
  const className = `${ROW_CLASSES} ${highlightUser ? 'bg-elevated' : ''}`
  const contents = (
    <>
      <span className="col-span-2 row-start-1 md:flex-1 min-w-0 text-primary text-sm md:text-[15px] font-medium wrap-anywhere">
        {title}
      </span>
      <span className="col-start-1 row-start-2 md:w-32.5 shrink-0 flex items-center gap-2.5 font-mono text-[10px] md:text-[11px] text-secondary">
        <TypeRuleBadge type={type} />
        {difficulty}
      </span>
      <span className="col-start-2 col-span-2 row-start-2 md:w-42 shrink-0 text-right">
        <OutcomeLabel outcome={outcome ?? verdict ?? (status === 'failed' ? 'expired' : null)} />
      </span>
      {showClock ? (
        <time
          dateTime={startedAt}
          className="hidden md:block w-12 shrink-0 text-right font-mono text-xs text-secondary tabular-nums"
        >
          {formatClock(startedAt)}
        </time>
      ) : (
        <>
          <span className="w-15 shrink-0 text-right font-mono text-sm text-secondary tabular-nums hidden md:block">
            {formatElapsed(startedAt, completedAt)}
          </span>
          <span className="w-22 shrink-0 text-right text-secondary text-sm hidden lg:block">
            {formatRelative(startedAt)}
          </span>
        </>
      )}
      <span aria-hidden className="col-start-3 row-start-1 self-start md:self-center w-4 shrink-0 text-right text-accent-text">
        ↗
      </span>
    </>
  )

  if (target.to !== undefined) {
    return (
      <Link to={target.to} state={target.linkState} className={className}>
        {contents}
      </Link>
    )
  }
  return (
    <button type="button" onClick={target.onClick} className={className}>
      {contents}
    </button>
  )
}

function OutcomeLabel({ outcome }: Readonly<{ outcome: HistoryOutcome | null }>): ReactNode {
  if (outcome === null) return null
  const base = 'font-mono text-xs uppercase'
  if (outcome === 'expired') return <span className={`${base} text-secondary`}>Expired</span>
  if (outcome === 'no_evaluation') return <span className={`${base} text-secondary`}>No evaluation</span>
  return <span className={`${base} ${VERDICT_TEXT[outcome]}`}>{VERDICT_LABELS[outcome]}</span>
}

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
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
