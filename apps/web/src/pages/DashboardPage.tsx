import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, type DashboardData } from '../lib/api'
import { PageLoader } from '../components/PageLoader'
import { LogoWordmark } from '../components/Logo'
import { Heatmap } from '../components/ui/Heatmap'
import { TypeBadge, DifficultyBadge, VerdictBadge } from '../components/ui/Badge'
import type { ExerciseType, Difficulty, Verdict } from '@dojo/shared'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.getDashboard().then(setDashboard)
  }, [])

  if (!dashboard) return <PageLoader />

  // Find today's completed session for the today card
  const today = new Date().toISOString().slice(0, 10)
  const todaySession = dashboard.recentSessions.find(
    (s) => s.startedAt.slice(0, 10) === today,
  )

  return (
    <div className="min-h-screen bg-base px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <LogoWordmark />
        <div className="flex items-center gap-3">
          {user?.avatarUrl && (
            <img src={user.avatarUrl} className="w-7 h-7 rounded-sm" alt={user.username} />
          )}
          <span className="text-secondary text-sm font-mono">{user?.username}</span>
          <button
            onClick={logout}
            className="text-muted text-xs font-mono hover:text-secondary transition-colors ml-1"
          >
            logout
          </button>
        </div>
      </header>

      {/* Profile + Stats */}
      <section className="mb-8">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-surface border border-border rounded-md p-4 text-center">
            <div className="font-mono text-2xl text-primary">{dashboard.streak}</div>
            <div className="text-muted text-xs mt-1">day streak</div>
          </div>
          <div className="bg-surface border border-border rounded-md p-4 text-center">
            <div className="font-mono text-2xl text-primary">{dashboard.totalCompleted}</div>
            <div className="text-muted text-xs mt-1">kata completed</div>
          </div>
          <div className="bg-surface border border-border rounded-md p-4 text-center">
            <div className="font-mono text-2xl text-primary">
              {user?.createdAt
                ? Math.max(1, Math.ceil((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
                : '—'}
            </div>
            <div className="text-muted text-xs mt-1">days in dojo</div>
          </div>
        </div>
        <Heatmap data={dashboard.heatmapData} />
      </section>

      {/* Today card */}
      <TodayCard
        todayComplete={dashboard.todayComplete}
        todaySession={todaySession}
        activeSessionId={dashboard.activeSessionId}
        isFirstVisit={dashboard.streak === 0 && dashboard.recentSessions.length === 0}
        onStart={() => navigate('/start')}
        onResume={(id) => navigate(`/kata/${id}`)}
        onViewResults={(id) => navigate(`/kata/${id}/result`)}
      />

      {/* Recent activity */}
      {dashboard.recentSessions.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-secondary text-xs font-mono uppercase tracking-wider">Recent</h2>
            <button
              onClick={() => navigate('/history')}
              className="text-muted text-xs font-mono hover:text-secondary transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {dashboard.recentSessions.map((s) => (
              <RecentSessionRow
                key={s.id}
                session={s}
                onClick={() => navigate(`/kata/${s.id}/result`)}
              />
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
  todaySession,
  activeSessionId,
  isFirstVisit,
  onStart,
  onResume,
  onViewResults,
}: {
  todayComplete: boolean
  todaySession?: DashboardData['recentSessions'][number]
  activeSessionId: string | null
  isFirstVisit: boolean
  onStart: () => void
  onResume: (id: string) => void
  onViewResults: (id: string) => void
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

  if (todayComplete && todaySession) {
    return (
      <div className="bg-surface border border-success/20 rounded-md p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-secondary text-sm">Today's kata complete.</p>
          {todaySession.verdict && (
            <VerdictBadge verdict={todaySession.verdict as Verdict} />
          )}
        </div>
        <p className="text-primary text-sm font-medium">{todaySession.exerciseTitle}</p>
        <button
          onClick={() => onViewResults(todaySession.id)}
          className="mt-3 w-full py-2 border border-border text-secondary font-mono text-sm rounded-sm hover:border-accent hover:text-primary transition-colors"
        >
          View results →
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
      <p className="text-secondary text-sm">
        {isFirstVisit ? 'Day 1. The dojo opens.' : 'The dojo was empty today.'}
      </p>
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
  onClick,
}: {
  session: DashboardData['recentSessions'][number]
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 bg-surface border border-border rounded-sm hover:border-accent/40 transition-colors text-left"
    >
      <div className="flex items-center gap-2">
        <TypeBadge type={session.exerciseType as ExerciseType} />
        <DifficultyBadge difficulty={session.difficulty as Difficulty} />
        <span className="text-secondary text-sm">{session.exerciseTitle}</span>
      </div>
      <div className="flex items-center gap-2">
        {session.verdict && <VerdictBadge verdict={session.verdict as Verdict} />}
        <span className="text-muted text-xs font-mono">
          {new Date(session.startedAt).toLocaleDateString()}
        </span>
      </div>
    </button>
  )
}
