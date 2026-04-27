import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type DashboardData } from '../lib/api'
import { PageLoader } from '../components/PageLoader'
import { TodayCard } from '../components/dashboard/TodayCard'
import { RecentSessionRow } from '../components/dashboard/RecentSessionRow'

export function DashboardPage() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.getDashboard().then(setDashboard)
  }, [])

  if (!dashboard) return <PageLoader />

  return (
    <div className="px-4 md:px-6 py-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        {/* ── Streak card ── */}
        <section className="md:col-span-4 bg-surface rounded-md p-6 flex flex-col justify-between min-h-45">
          <div>
            <span className="text-[10px] text-muted uppercase tracking-[0.2em] font-mono">
              active_streak
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl sm:text-5xl md:text-6xl font-mono text-accent tracking-tighter">
                {dashboard.streak}
              </span>
              <span className="text-lg font-mono text-muted lowercase">day streak</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-xs text-secondary/60 font-mono lowercase">
              {dashboard.totalCompleted > 0
                ? `last practiced: ${dashboard.streak > 0 ? 'today' : 'yesterday'}`
                : 'no sessions yet'}
            </p>
          </div>
          {/* Weekly goal */}
          {dashboard.weeklyGoal && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted font-mono lowercase">this week</span>
                <span className="text-[10px] text-muted font-mono">
                  {dashboard.weeklyGoal.completed}/{dashboard.weeklyGoal.target}
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: dashboard.weeklyGoal.target }, (_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${
                      i < dashboard.weeklyGoal.completed ? 'bg-accent' : 'bg-border/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Today's kata ── */}
        <section className="md:col-span-8 bg-elevated rounded-md p-6 flex flex-col justify-center relative overflow-hidden">
          <TodayCard
            todayComplete={dashboard.todayComplete}
            todaySession={dashboard.todaySession}
            activeSessionId={dashboard.activeSessionId}
            isFirstVisit={dashboard.streak === 0 && dashboard.recentSessions.length === 0}
            onStart={() => navigate('/start')}
            onResume={(id) => navigate(`/kata/${id}`)}
            onViewResults={(id) => navigate(`/kata/${id}/result`)}
          />
          {/* Decorative element */}
          <div className="absolute -right-5 -top-5 opacity-[0.04] pointer-events-none">
            <svg width="160" height="160" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </section>

        {/* ── Recent activity ── */}
        <section className="md:col-span-8 space-y-4">
          {dashboard.recentSessions.length > 0 && (
            <>
              <div className="flex justify-between items-end mb-2 px-1">
                <h4 className="font-mono text-sm text-muted lowercase tracking-wider">
                  recent_activity
                </h4>
                <button
                  onClick={() => navigate('/history')}
                  className="text-[10px] text-secondary/50 font-mono uppercase hover:text-secondary transition-colors"
                >
                  view_all_logs
                </button>
              </div>
              <div className="space-y-3">
                {dashboard.recentSessions.map((s) => (
                  <RecentSessionRow
                    key={s.id}
                    session={s}
                    onClick={() => navigate(`/kata/${s.id}/result`)}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* ── Right panel ── */}
        {dashboard.totalCompleted >= 3 && (
          <div className="md:col-span-4 space-y-6">
            {/* Where you struggle */}
            {dashboard.weakAreas.length > 0 && (
              <section className="bg-surface/50 p-6 rounded-md">
                <h4 className="font-mono text-xs text-muted lowercase tracking-[0.2em] mb-4">
                  where you struggle
                </h4>
                <div className="flex flex-col gap-2">
                  {dashboard.weakAreas.map((a) => (
                    <div
                      key={a.topic}
                      className="flex justify-between items-center p-3 border border-danger/20 bg-danger/5 rounded-md"
                    >
                      <span className="text-xs text-primary">{a.topic}</span>
                      <span className="text-[10px] font-mono text-danger">
                        {a.frequency} sessions
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* How you practice */}
            <section className="bg-page p-6 rounded-md border border-border/20">
              <h4 className="font-mono text-xs text-muted lowercase tracking-[0.2em] mb-4">
                how you practice
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-muted lowercase">avg time to submit</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-primary">
                      {dashboard.practicePatterns.avgTimeMinutes}:00
                    </span>
                    <span className="text-[10px] font-mono text-success uppercase">
                      vs 20:00
                    </span>
                  </div>
                </div>
                {dashboard.practicePatterns.mostAvoidedType && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-muted lowercase">most avoided type</span>
                    <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
                      {dashboard.practicePatterns.mostAvoidedType.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-muted lowercase">sessions timed out</span>
                  <span
                    className={`text-xs font-mono ${dashboard.practicePatterns.sessionsTimedOut > 0 ? 'text-danger' : 'text-success'}`}
                  >
                    {dashboard.practicePatterns.sessionsTimedOut}
                  </span>
                </div>
              </div>
            </section>

            {/* Sensei suggests */}
            {dashboard.senseiSuggests.length > 0 && (
              <section className="px-1">
                <h4 className="font-mono text-xs text-muted lowercase tracking-[0.2em] mb-3">
                  the sensei suggests revisiting
                </h4>
                <div className="flex flex-wrap gap-2">
                  {dashboard.senseiSuggests.map((topic) => (
                    <span
                      key={topic}
                      className="px-3 py-1.5 bg-warning/10 border border-warning/30 text-warning text-[10px] font-mono rounded-full lowercase"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* System status */}
      <p className="text-muted/20 text-[10px] font-mono mt-12 text-center">
        system_status: online
      </p>
    </div>
  )
}
