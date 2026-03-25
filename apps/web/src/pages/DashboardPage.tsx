import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, type DashboardData } from '../lib/api'
import { PageLoader } from '../components/PageLoader'
import { Heatmap } from '../components/ui/Heatmap'
import { TypeBadge, VerdictBadge } from '../components/ui/Badge'
import type { ExerciseType, Verdict } from '@dojo/shared'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.getDashboard().then(setDashboard)
  }, [])

  if (!dashboard) return <PageLoader />

  return (
    <div className="px-4 py-8 max-w-5xl mx-auto">
      {/* Header — user info (logo is in sidebar) */}
      <header className="flex items-center justify-end mb-8">
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

      {/* Main grid — 2 col on desktop */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Left column */}
        <div>
          {/* Streak */}
          <section className="mb-8">
            <p className="text-muted text-xs font-mono uppercase tracking-wider mb-2">practice_streak</p>
            <div className="flex items-baseline gap-3 mb-1">
              <span className="font-mono text-5xl text-primary">{dashboard.streak}</span>
              <span className="text-secondary text-sm font-mono">day streak</span>
            </div>
            <p className="text-muted text-xs font-mono mb-4">
              {dashboard.totalCompleted > 0
                ? `${dashboard.totalCompleted} kata completed · ${dashboard.streak > 0 ? 'Last practiced: today' : 'Last practiced: yesterday'}`
                : 'No kata completed yet'}
            </p>
            <Heatmap data={dashboard.heatmapData} />
          </section>

          {/* Today card */}
          <section className="mb-8">
            <TodayCard
              todayComplete={dashboard.todayComplete}
              todaySession={dashboard.todaySession}
              activeSessionId={dashboard.activeSessionId}
              isFirstVisit={dashboard.streak === 0 && dashboard.recentSessions.length === 0}
              onStart={() => navigate('/start')}
              onResume={(id) => navigate(`/kata/${id}`)}
              onViewResults={(id) => navigate(`/kata/${id}/result`)}
            />
          </section>

          {/* Extended dashboard — Phase 2 */}
          {dashboard.totalCompleted >= 3 && (
            <section className="space-y-6">
              {/* Where you struggle */}
              {dashboard.weakAreas.length > 0 && (
                <div>
                  <h2 className="text-muted text-xs font-mono uppercase tracking-wider mb-3">Where you struggle</h2>
                  <div className="flex flex-wrap gap-2">
                    {dashboard.weakAreas.map((a) => (
                      <span
                        key={a.topic}
                        className="text-danger text-xs font-mono px-2.5 py-1 border border-danger/30 rounded-sm"
                      >
                        {a.topic} <span className="text-muted ml-1">×{a.frequency}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* How you practice */}
              <div>
                <h2 className="text-muted text-xs font-mono uppercase tracking-wider mb-3">How you practice</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">Avg time per kata</span>
                    <span className="font-mono text-primary">{dashboard.practicePatterns.avgTimeMinutes}min</span>
                  </div>
                  {dashboard.practicePatterns.mostAvoidedType && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary">Most avoided type</span>
                      <span className="font-mono text-primary">{dashboard.practicePatterns.mostAvoidedType}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">Sessions timed out</span>
                    <span className={`font-mono ${dashboard.practicePatterns.sessionsTimedOut > 0 ? 'text-danger' : 'text-primary'}`}>
                      {dashboard.practicePatterns.sessionsTimedOut}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sensei suggests */}
              {dashboard.senseiSuggests.length > 0 && (
                <div>
                  <h2 className="text-muted text-xs font-mono uppercase tracking-wider mb-3">Sensei suggests revisiting</h2>
                  <div className="flex flex-wrap gap-2">
                    {dashboard.senseiSuggests.map((topic) => (
                      <span
                        key={topic}
                        className="text-warning text-xs font-mono px-2.5 py-1 border border-warning/30 rounded-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right column — recent activity */}
        <div>
          {dashboard.recentSessions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-muted text-xs font-mono uppercase tracking-wider">Recent activity</h2>
                <button
                  onClick={() => navigate('/history')}
                  className="text-muted text-xs font-mono hover:text-secondary transition-colors"
                >
                  View all →
                </button>
              </div>
              <div className="space-y-0 divide-y divide-border/30">
                {dashboard.recentSessions.map((s) => (
                  <RecentSessionRow
                    key={s.id}
                    session={s}
                    onClick={() => navigate(`/kata/${s.id}/result`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System status */}
      <p className="text-muted/30 text-[10px] font-mono mt-12 text-center">
        system_status: online
      </p>
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
  todaySession: DashboardData['todaySession']
  activeSessionId: string | null
  isFirstVisit: boolean
  onStart: () => void
  onResume: (id: string) => void
  onViewResults: (id: string) => void
}) {
  if (activeSessionId) {
    return (
      <div className="bg-surface border border-accent/30 rounded-md p-5">
        <p className="text-secondary text-sm">You have an active kata.</p>
        <button
          onClick={() => onResume(activeSessionId)}
          className="mt-3 w-full py-2.5 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
        >
          Resume kata →
        </button>
      </div>
    )
  }

  if (todayComplete && todaySession) {
    return (
      <div className="bg-surface border border-success/20 rounded-md p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-secondary text-sm">Today's kata complete.</p>
          {todaySession.verdict && <VerdictBadge verdict={todaySession.verdict as Verdict} />}
        </div>
        <p className="text-primary text-sm font-medium">{todaySession.exerciseTitle}</p>
        <button
          onClick={() => onViewResults(todaySession.id)}
          className="mt-3 w-full py-2.5 border border-border text-secondary font-mono text-sm rounded-sm hover:border-accent hover:text-primary transition-colors"
        >
          View results →
        </button>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-md p-5 text-center">
      <p className="text-primary font-mono text-sm mb-2">
        {isFirstVisit ? 'Day 1. The dojo opens.' : 'the dojo was empty today.'}
      </p>
      <p className="text-muted text-xs mb-4">
        {isFirstVisit
          ? 'Your first kata awaits.'
          : 'Maintain your momentum and hone your muscle memory with today\'s algorithmic challenge.'}
      </p>
      <button
        onClick={onStart}
        className="px-8 py-2.5 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
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
      className="w-full flex items-center justify-between py-3 hover:bg-surface/50 transition-colors text-left"
    >
      <div className="flex items-center gap-2 min-w-0">
        <TypeBadge type={session.exerciseType as ExerciseType} />
        <span className="text-secondary text-sm truncate">{session.exerciseTitle}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {session.verdict && <VerdictBadge verdict={session.verdict as Verdict} />}
        <span className="text-muted text-xs font-mono">
          {new Date(session.startedAt).toLocaleDateString()}
        </span>
      </div>
    </button>
  )
}
