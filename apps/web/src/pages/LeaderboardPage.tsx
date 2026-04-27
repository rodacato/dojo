import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type LeaderboardEntry } from '../lib/api'
import { PageLoader } from '../components/PageLoader'

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [period, setPeriod] = useState<'month' | 'all-time'>('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .getLeaderboard(period)
      .then((data) => setEntries(data.entries))
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div className="min-h-screen bg-page px-4 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-mono text-2xl text-primary mb-1">Leaderboard</h1>
        <p className="text-muted text-sm">Ranked by consistency, not score.</p>
      </div>

      {/* Period filter */}
      <div className="flex gap-1 mb-6 bg-surface border border-border/40 rounded-md p-1 w-fit">
        {(['month', 'all-time'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 text-xs font-mono rounded-sm transition-colors ${
              period === p
                ? 'bg-accent text-primary'
                : 'text-muted hover:text-secondary'
            }`}
          >
            {p === 'month' ? 'This month' : 'All time'}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted text-sm font-mono">No kata completed this period.</p>
        </div>
      ) : (
        <>
          <p className="text-muted text-xs font-mono mb-4">
            {entries.length} practitioner{entries.length !== 1 ? 's' : ''}
          </p>

          <div className="space-y-0">
            {/* Header */}
            <div className="grid grid-cols-[2rem_1fr_3rem_3rem] sm:grid-cols-[2rem_1fr_3.5rem_3.5rem_3rem_5rem] gap-2 px-3 py-2 text-muted text-[10px] font-mono uppercase tracking-wider">
              <div>#</div>
              <div>Practitioner</div>
              <div className="text-right">Streak</div>
              <div className="text-right">Kata</div>
              <div className="text-right hidden sm:block">Pass</div>
              <div className="text-right hidden sm:block">Last</div>
            </div>

            {entries.map((entry) => (
              <div
                key={entry.userId}
                className={`grid grid-cols-[2rem_1fr_3rem_3rem] sm:grid-cols-[2rem_1fr_3.5rem_3.5rem_3rem_5rem] gap-2 px-3 py-3 items-center rounded-sm ${
                  entry.isCurrentUser ? 'bg-accent/10 border border-accent/20' : 'hover:bg-surface/50'
                }`}
              >
                <div>
                  <span
                    className={`font-mono text-sm ${
                      entry.rank <= 3 ? 'text-accent' : 'text-muted'
                    }`}
                  >
                    {entry.rank}
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={entry.avatarUrl}
                    alt={entry.username}
                    className="w-6 h-6 rounded-sm shrink-0"
                  />
                  <Link
                    to={`/u/${entry.username}`}
                    className="font-mono text-sm text-primary truncate hover:text-accent transition-colors"
                  >
                    {entry.username}
                  </Link>
                </div>
                <div className="text-right font-mono text-sm text-primary">
                  {entry.streak}d
                </div>
                <div className="text-right font-mono text-sm text-secondary">
                  {entry.kataCount}
                </div>
                <div className="text-right hidden sm:block">
                  <span
                    className={`font-mono text-xs ${
                      entry.passRate >= 70
                        ? 'text-success'
                        : entry.passRate >= 40
                          ? 'text-warning'
                          : 'text-danger'
                    }`}
                  >
                    {entry.passRate}%
                  </span>
                </div>
                <div className="text-right hidden sm:block text-muted text-xs font-mono">
                  {formatLastActive(entry.lastActive)}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-muted text-xs font-mono mt-10">
            {period === 'month'
              ? 'Ranking resets on the 1st. Consistency compounds.'
              : 'All time. Every kata counts.'}
          </p>
        </>
      )}
    </div>
  )
}

function formatLastActive(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
