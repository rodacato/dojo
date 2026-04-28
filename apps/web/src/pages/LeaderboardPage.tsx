import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type LeaderboardEntry } from '../lib/api'
import { SkeletonList } from '../components/ui/SkeletonLoader'

type Period = 'month' | 'all-time'

const PERIOD_LABELS: Record<Period, string> = {
  month: 'This month',
  'all-time': 'All time',
}

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [period, setPeriod] = useState<Period>('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .getLeaderboard(period)
      .then((data) => setEntries(data.entries))
      .finally(() => setLoading(false))
  }, [period])

  const showLoader = loading && entries.length === 0
  const activePractitioners = useMemo(
    () => entries.filter((e) => e.kataCount > 0).length,
    [entries],
  )

  return (
    <div className="px-4 md:px-6 py-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-primary text-2xl md:text-[32px] font-semibold leading-tight tracking-tight mb-1">
            Leaderboard
          </h1>
          <p className="text-secondary text-[13px]">Ranked by consistency, not score.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6" role="tablist" aria-label="Leaderboard period">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
            className={`font-mono text-[11px] tracking-[0.08em] uppercase px-3 py-1.5 rounded-sm border transition-colors ${
              period === p
                ? 'border-accent text-accent'
                : 'border-border text-muted hover:text-secondary'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {showLoader ? (
        <SkeletonList rows={8} />
      ) : entries.length === 0 ? (
        <div className="bg-surface border border-border rounded-md py-16 px-4 text-center">
          <p className="text-secondary text-[15px]">
            No sessions in this period. Start one — the leaderboard fills slowly.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden">
          {/* Header */}
          <div className="h-10 grid grid-cols-[3rem_1fr_5rem_5rem_5rem_6rem] md:grid-cols-[3rem_1fr_6rem_6rem_6rem_7.5rem] items-center px-4 border-b border-border font-mono text-[11px] tracking-[0.08em] uppercase text-muted">
            <span>Rank</span>
            <span>Developer</span>
            <span className="text-right">Streak</span>
            <span className="text-right">Kata</span>
            <span className="text-right hidden md:block">Pass %</span>
            <span className="text-right hidden md:block">Last active</span>
          </div>

          {/* Body */}
          {entries.map((entry, i) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              isLast={i === entries.length - 1}
            />
          ))}
        </div>
      )}

      <p className="text-center text-muted text-[11px] font-mono tracking-[0.04em] mt-6">
        {entries.length > 0
          ? `Top ${entries.length} shown · ${activePractitioners} active practitioners this ${period === 'month' ? 'month' : 'period'}`
          : null}
      </p>
    </div>
  )
}

function LeaderboardRow({ entry, isLast }: { entry: LeaderboardEntry; isLast: boolean }) {
  const isTop3 = entry.rank <= 3
  const isFirst = entry.rank === 1
  const passColor =
    entry.passRate >= 80
      ? 'text-success/90'
      : entry.passRate >= 50
        ? 'text-warning/90'
        : 'text-danger/90'

  return (
    <div
      className={`relative h-14 grid grid-cols-[3rem_1fr_5rem_5rem_5rem_6rem] md:grid-cols-[3rem_1fr_6rem_6rem_6rem_7.5rem] items-center px-4 ${
        isLast ? '' : 'border-b border-border'
      } ${entry.isCurrentUser ? 'bg-accent/8' : 'hover:bg-elevated/50'} transition-colors`}
    >
      {isFirst && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent" />}

      {/* Rank */}
      <div className="flex items-center gap-1.5">
        {entry.isCurrentUser && (
          <span className="font-mono text-[9px] tracking-[0.08em] uppercase text-accent shrink-0">
            you
          </span>
        )}
        <span
          className={`font-mono text-lg font-bold tabular-nums ${
            isTop3 ? 'text-accent' : 'text-secondary'
          }`}
        >
          {entry.rank.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Developer */}
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={entry.avatarUrl}
          alt=""
          aria-hidden
          className="w-8 h-8 shrink-0 rounded-full bg-elevated"
        />
        <Link
          to={`/u/${entry.username}`}
          className="text-primary text-[15px] font-medium truncate hover:text-accent transition-colors"
        >
          @{entry.username}
        </Link>
      </div>

      {/* Streak */}
      <div className="text-right">
        <span className="font-mono text-lg text-primary tabular-nums">{entry.streak}</span>
        <span className="font-mono text-[11px] text-muted ml-1">days</span>
      </div>

      {/* Kata */}
      <div className="text-right font-mono text-lg text-primary tabular-nums">
        {entry.kataCount}
      </div>

      {/* Pass % */}
      <div className={`text-right hidden md:block font-mono text-lg tabular-nums ${passColor}`}>
        {entry.passRate}%
      </div>

      {/* Last active */}
      <div className="text-right hidden md:block font-mono text-[13px] text-muted">
        {formatLastActive(entry.lastActive)}
      </div>
    </div>
  )
}

function formatLastActive(dateStr: string): string {
  const then = new Date(dateStr).getTime()
  const diffMs = Date.now() - then
  if (!Number.isFinite(diffMs) || diffMs < 0) return ''
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
