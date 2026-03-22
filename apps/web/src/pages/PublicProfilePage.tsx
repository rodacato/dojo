import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, type PublicProfileData } from '../lib/api'
import { LogoWordmark } from '../components/Logo'

const TYPE_COLORS: Record<string, string> = {
  CODE: 'bg-accent/20 text-accent',
  CHAT: 'bg-purple-500/20 text-purple-400',
  WHITEBOARD: 'bg-teal-500/20 text-teal-400',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'text-success',
  MEDIUM: 'text-warning',
  HARD: 'text-danger',
}

const VERDICT_COLORS: Record<string, string> = {
  PASSED: 'text-success',
  PASSED_WITH_NOTES: 'text-warning',
  NEEDS_WORK: 'text-danger',
}

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!username) return
    api
      .getPublicProfile(username)
      .then(setProfile)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base text-muted font-mono text-sm">
        loading...
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
        <h1 className="font-mono text-2xl text-primary mb-3">Practitioner not found.</h1>
        <p className="text-secondary text-sm mb-8">This profile doesn't exist or hasn't joined the dojo yet.</p>
        <Link
          to="/"
          className="px-5 py-2.5 border border-border text-secondary font-mono text-sm rounded-sm hover:border-accent hover:text-primary transition-colors"
        >
          Go home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base text-primary">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border/20 max-w-5xl mx-auto">
        <Link to="/">
          <LogoWordmark />
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-4">
            <img
              src={profile.avatarUrl}
              alt={profile.username}
              className="w-12 h-12 rounded-md"
            />
            <div>
              <h1 className="font-mono text-xl text-primary">{profile.username}</h1>
              <p className="text-muted text-xs font-mono">
                Member since {new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-3xl text-primary">{profile.streak}</span>
            <p className="text-muted text-xs font-mono">day streak</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total kata" value={String(profile.stats.totalKata)} />
          <StatCard
            label="Pass rate"
            value={`${profile.stats.passRate}%`}
            color={profile.stats.passRate >= 70 ? 'text-success' : profile.stats.passRate >= 40 ? 'text-warning' : 'text-danger'}
          />
          <StatCard label="Avg time" value={`${profile.stats.avgTimeMinutes}m`} />
          <StatCard label="Languages" value={String(profile.stats.languages.length)} />
        </div>

        {/* Heatmap */}
        <section className="mb-10">
          <h2 className="text-muted text-xs font-mono mb-3">90-day activity</h2>
          <Heatmap data={profile.heatmapData} />
        </section>

        {/* Recent kata */}
        {profile.recentSessions.length > 0 && (
          <section>
            <h2 className="text-muted text-xs font-mono mb-3">Recent kata</h2>
            <div className="space-y-0">
              {profile.recentSessions.map((s, i) => (
                <div key={s.id}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm shrink-0 ${TYPE_COLORS[s.exerciseType] ?? 'text-muted'}`}>
                        {s.exerciseType}
                      </span>
                      <span className="text-sm text-primary truncate">{s.exerciseTitle}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-mono ${DIFFICULTY_COLORS[s.difficulty] ?? 'text-muted'}`}>
                        {s.difficulty}
                      </span>
                      {s.verdict && (
                        <span className={`text-xs font-mono ${VERDICT_COLORS[s.verdict] ?? 'text-muted'}`}>
                          {s.verdict.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  {i < profile.recentSessions.length - 1 && <hr className="border-border/20" />}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface border border-border/40 rounded-md p-4">
      <p className={`font-mono text-xl ${color ?? 'text-primary'}`}>{value}</p>
      <p className="text-muted text-xs mt-1">{label}</p>
    </div>
  )
}

function Heatmap({ data }: { data: Array<{ date: string; count: number }> }) {
  const dateMap = new Map(data.map((d) => [d.date, d.count]))
  const days: Array<{ date: string; count: number }> = []

  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 89)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    days.push({ date: key, count: dateMap.get(key) ?? 0 })
  }

  return (
    <div className="flex flex-wrap gap-1">
      {days.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.count} sessions`}
          className={`w-2.5 h-2.5 rounded-sm ${
            d.count === 0
              ? 'bg-border/30'
              : d.count === 1
                ? 'bg-accent/50'
                : 'bg-accent'
          }`}
        />
      ))}
    </div>
  )
}
