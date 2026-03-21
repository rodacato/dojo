import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, type DashboardData } from '../lib/api'
import { PageLoader } from '../components/PageLoader'
import { Heatmap } from '../components/ui/Heatmap'
import { TypeBadge, DifficultyBadge } from '../components/ui/Badge'
import type { ExerciseType, Difficulty } from '@dojo/shared'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.getDashboard().then(setDashboard)
  }, [])

  if (!dashboard) return <PageLoader />

  return (
    <div className="min-h-screen bg-base px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <span className="font-mono text-xl text-primary">
          dojo<span className="text-accent">_</span>
        </span>
        <div className="flex items-center gap-2">
          {user?.avatarUrl && (
            <img src={user.avatarUrl} className="w-7 h-7 rounded-sm" alt={user.username} />
          )}
          <span className="text-secondary text-sm font-mono">{user?.username}</span>
        </div>
      </header>

      {/* Streak */}
      <section className="mb-6">
        <div className="font-mono text-2xl text-primary">{dashboard.streak}</div>
        <div className="text-muted text-sm">day streak</div>
        <div className="mt-3">
          <Heatmap data={dashboard.heatmapData} />
        </div>
      </section>

      {/* Today card */}
      <TodayCard
        todayComplete={dashboard.todayComplete}
        activeSessionId={dashboard.activeSessionId}
        onStart={() => navigate('/start')}
        onResume={(id) => navigate(`/kata/${id}`)}
      />

      {/* Recent activity */}
      {dashboard.recentSessions.length > 0 && (
        <section className="mt-8">
          <h2 className="text-secondary text-xs font-mono uppercase tracking-wider mb-3">Recent</h2>
          <div className="space-y-2">
            {dashboard.recentSessions.map((s) => (
              <RecentSessionRow key={s.id} session={s} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center">
        <p className="text-muted text-xs font-mono">Consistency compounds.</p>
      </footer>
    </div>
  )
}

function TodayCard({
  todayComplete,
  activeSessionId,
  onStart,
  onResume,
}: {
  todayComplete: boolean
  activeSessionId: string | null
  onStart: () => void
  onResume: (id: string) => void
}) {
  if (activeSessionId) {
    return (
      <div className="bg-surface border border-accent/30 rounded-md p-4">
        <p className="text-secondary text-sm">You have an active kata.</p>
        <button
          onClick={() => onResume(activeSessionId)}
          className="mt-3 w-full py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
        >
          Resume kata →
        </button>
      </div>
    )
  }

  if (todayComplete) {
    return (
      <div className="bg-surface border border-border rounded-md p-4">
        <p className="text-secondary text-sm">Today's kata complete.</p>
        <p className="text-muted text-xs mt-1">Come back tomorrow. The dojo will be here.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <p className="text-secondary text-sm">The dojo was empty today.</p>
      <button
        onClick={onStart}
        className="mt-3 w-full py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
      >
        Enter the dojo →
      </button>
    </div>
  )
}

function RecentSessionRow({
  session,
}: {
  session: DashboardData['recentSessions'][number]
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-sm">
      <div className="flex items-center gap-2">
        <TypeBadge type={session.exerciseType as ExerciseType} />
        <DifficultyBadge difficulty={session.difficulty as Difficulty} />
        <span className="text-secondary text-sm">{session.exerciseTitle}</span>
      </div>
      <span className="text-muted text-xs font-mono">
        {new Date(session.startedAt).toLocaleDateString()}
      </span>
    </div>
  )
}
