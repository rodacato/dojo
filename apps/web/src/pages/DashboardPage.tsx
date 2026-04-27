import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type DashboardData } from '../lib/api'
import { PageLoader } from '../components/PageLoader'
import { TodayCard } from '../components/dashboard/TodayCard'
import { RecentSessionRow } from '../components/dashboard/RecentSessionRow'
import { OnboardingOverlay } from '../components/onboarding/OnboardingOverlay'
import { useFirstVisit } from '../hooks/useFirstVisit'

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const
const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

export function DashboardPage() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.getDashboard().then(setDashboard)
  }, [])

  const isFirstVisit = !!dashboard && dashboard.streak === 0 && dashboard.recentSessions.length === 0
  const onboarding = useFirstVisit(isFirstVisit)

  if (!dashboard) return <PageLoader />

  return (
    <div className="px-4 md:px-6 py-6 md:py-10 max-w-6xl mx-auto flex flex-col gap-8">
      {onboarding.isFirstVisit && <OnboardingOverlay onDismiss={onboarding.dismiss} />}
      <DateStrip />

      <section className="bg-surface border border-border/40 rounded-md p-6 md:p-8">
        <TodayCard
          todayComplete={dashboard.todayComplete}
          todaySession={dashboard.todaySession}
          activeSessionId={dashboard.activeSessionId}
          isFirstVisit={isFirstVisit}
          onStart={() => navigate('/start')}
          onResume={(id) => navigate(`/kata/${id}`)}
          onViewResults={(id) => navigate(`/kata/${id}/result`)}
        />
      </section>

      <div className="grid md:grid-cols-12 gap-4 md:gap-6">
        <StreakCard
          streak={dashboard.streak}
          recentSessions={dashboard.recentSessions}
          weeklyGoal={dashboard.weeklyGoal}
        />
        <PracticePatternsCard practicePatterns={dashboard.practicePatterns} />
      </div>

      {dashboard.recentSessions.length > 0 && (
        <RecentActivity sessions={dashboard.recentSessions} onView={(id) => navigate(`/kata/${id}/result`)} onAll={() => navigate('/history')} />
      )}

      {dashboard.totalCompleted >= 3 && (
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <WeakAreasCard weakAreas={dashboard.weakAreas} />
          <SenseiSuggestsCard suggestions={dashboard.senseiSuggests} />
        </div>
      )}

      <SystemStatusFooter />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sections                                                           */
/* ------------------------------------------------------------------ */

function DateStrip() {
  const today = useMemo(() => DATE_FORMATTER.format(new Date()), [])
  return (
    <div className="flex items-center justify-between gap-4 -mb-2">
      <p className="text-secondary text-xs font-mono uppercase tracking-wider">{today}</p>
      <p className="text-muted text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" aria-hidden />
        api · ok
      </p>
    </div>
  )
}

function StreakCard({
  streak,
  recentSessions,
  weeklyGoal,
}: {
  streak: number
  recentSessions: DashboardData['recentSessions']
  weeklyGoal?: { target: number; completed: number }
}) {
  const week = useMemo(() => weekActivity(recentSessions), [recentSessions])
  return (
    <section className="md:col-span-7 bg-surface border border-border/40 rounded-md p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-muted text-xs font-mono uppercase tracking-wider">Current streak</p>
        {weeklyGoal && weeklyGoal.target > 0 && (
          <p className="text-muted text-xs font-mono">
            {weeklyGoal.completed}/{weeklyGoal.target} this week
          </p>
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-6">
        <span className="font-mono text-5xl text-accent leading-none tracking-tight">{streak}</span>
        <span className="font-mono text-secondary text-sm">days</span>
      </div>
      <div className="flex gap-1.5">
        {week.map((active, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={`h-2 w-full rounded-sm ${active ? 'bg-success' : 'bg-page border border-border/40'}`}
              aria-hidden
            />
            <span className="text-muted text-[10px] font-mono uppercase">{WEEKDAY_LABELS[i]}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function PracticePatternsCard({ practicePatterns }: { practicePatterns: DashboardData['practicePatterns'] }) {
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    {
      label: 'Avg time',
      value: (
        <span className="font-mono text-primary text-base">
          {String(practicePatterns.avgTimeMinutes).padStart(2, '0')}:00
        </span>
      ),
    },
  ]
  if (practicePatterns.mostAvoidedType) {
    rows.push({
      label: 'Most avoided',
      value: (
        <span className="font-mono text-accent text-[11px] uppercase tracking-wider bg-accent/10 px-2 py-0.5 rounded-sm">
          {practicePatterns.mostAvoidedType}
        </span>
      ),
    })
  }
  rows.push({
    label: 'Sessions timed out',
    value: (
      <span
        className={`font-mono text-base ${practicePatterns.sessionsTimedOut > 0 ? 'text-danger' : 'text-success'}`}
      >
        {practicePatterns.sessionsTimedOut}
      </span>
    ),
  })

  return (
    <section className="md:col-span-5 bg-surface border border-border/40 rounded-md p-6">
      <p className="text-muted text-xs font-mono uppercase tracking-wider mb-5">Practice patterns</p>
      <div className="flex flex-col">
        {rows.map(({ label, value }, i) => (
          <div
            key={label}
            className={`flex items-center justify-between py-3 ${
              i < rows.length - 1 ? 'border-b border-border/30' : ''
            }`}
          >
            <span className="text-secondary text-sm">{label}</span>
            {value}
          </div>
        ))}
      </div>
    </section>
  )
}

function RecentActivity({
  sessions,
  onView,
  onAll,
}: {
  sessions: DashboardData['recentSessions']
  onView: (id: string) => void
  onAll: () => void
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3 px-1">
        <h3 className="text-muted text-xs font-mono uppercase tracking-wider">Recent kata</h3>
        <button
          onClick={onAll}
          className="text-muted text-xs font-mono uppercase tracking-wider hover:text-secondary transition-colors"
        >
          Full history →
        </button>
      </div>
      <div className="bg-surface border border-border/40 rounded-md overflow-hidden">
        {sessions.map((s, i) => (
          <RecentSessionRow
            key={s.id}
            session={s}
            onClick={() => onView(s.id)}
            isLast={i === sessions.length - 1}
          />
        ))}
      </div>
    </section>
  )
}

function WeakAreasCard({ weakAreas }: { weakAreas: DashboardData['weakAreas'] }) {
  if (weakAreas.length === 0) return null
  return (
    <section className="bg-surface border border-border/40 rounded-md p-6">
      <p className="text-muted text-xs font-mono uppercase tracking-wider mb-4">Weak areas</p>
      <div className="flex flex-wrap gap-2">
        {weakAreas.map((a) => (
          <span
            key={a.topic}
            className="font-mono text-[11px] text-warning bg-warning/10 border border-warning/30 rounded-sm px-2.5 py-1 inline-flex items-center gap-1.5"
          >
            <span className="text-primary lowercase">{a.topic}</span>
            <span className="text-warning/70">({a.frequency})</span>
          </span>
        ))}
      </div>
    </section>
  )
}

function SenseiSuggestsCard({ suggestions }: { suggestions: string[] }) {
  if (suggestions.length === 0) return null
  return (
    <section className="bg-surface border border-border/40 rounded-md p-6">
      <p className="text-muted text-xs font-mono uppercase tracking-wider mb-4">Sensei suggests</p>
      <ul className="space-y-3">
        {suggestions.map((topic) => (
          <li key={topic} className="flex items-start gap-3 text-secondary text-sm leading-relaxed">
            <span className="text-accent shrink-0 mt-0.5" aria-hidden>→</span>
            <span>
              Revisit <span className="text-primary lowercase">{topic}</span>.
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function SystemStatusFooter() {
  return (
    <footer className="border-t border-border/30 pt-4 mt-4">
      <p className="text-center text-muted text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-3">
        <StatusDot label="api" ok />
        <StatusDot label="db" ok />
        <StatusDot label="llm" ok />
      </p>
    </footer>
  )
}

function StatusDot({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${ok ? 'bg-success' : 'bg-danger'}`} aria-hidden />
      {label} {ok ? 'ok' : 'down'}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Derive a Mon-Sun activity boolean array for the current week from the
 * sessions we already have client-side. Marks a weekday true if at least
 * one session started on that day.
 *
 * NOTE: recentSessions is capped server-side (typically the last 5-10),
 * so this is a best-effort derivation. A dedicated `weekHeatmap` field
 * on DashboardData would be more accurate — see stitch/TODO.md G-029.
 */
function weekActivity(sessions: DashboardData['recentSessions']): boolean[] {
  const today = new Date()
  const day = today.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const monday = new Date(today)
  monday.setDate(today.getDate() + (day === 0 ? -6 : 1 - day))
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const start = new Date(monday)
    start.setDate(monday.getDate() + i)
    const end = new Date(start)
    end.setDate(start.getDate() + 1)
    return sessions.some((s) => {
      const ts = new Date(s.startedAt)
      return ts >= start && ts < end
    })
  })
}
