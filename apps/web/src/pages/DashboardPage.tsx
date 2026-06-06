import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { BeltDTO } from '@dojo/shared'
import { api, type DashboardData } from '../lib/api'
import { PageLoader } from '../components/PageLoader'
import { TodayCard } from '../components/dashboard/TodayCard'
import { RecentSessionRow } from '../components/dashboard/RecentSessionRow'
import { OnboardingOverlay } from '../components/onboarding/OnboardingOverlay'
import { useFirstVisit } from '../hooks/useFirstVisit'
import { BELT_COLOR } from '../lib/belt-colors'

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
          onStart={() => navigate('/katas')}
          onResume={(id) => navigate(`/kata/${id}`)}
          onViewResults={(id) => navigate(`/kata/${id}/result`)}
        />
      </section>

      <BeltStrip belt={dashboard.belt} />

      <div className="grid md:grid-cols-12 gap-4 md:gap-6">
        <StreakCard
          streak={dashboard.streak}
          heatmapData={dashboard.heatmapData}
          weeklyGoal={dashboard.weeklyGoal}
          spanWhenAlone={dashboard.totalCompleted < 3}
        />
        {dashboard.totalCompleted >= 3 && (
          <PracticePatternsCard practicePatterns={dashboard.practicePatterns} />
        )}
      </div>

      {dashboard.recentSessions.length > 0 && (
        <RecentActivity sessions={dashboard.recentSessions} onView={(id) => navigate(`/kata/${id}/result`)} onAll={() => navigate('/history')} />
      )}

      {dashboard.totalCompleted >= 3 && dashboard.weakAreas.length > 0 && (
        <WeakAreasCard weakAreas={dashboard.weakAreas} />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sections                                                           */
/* ------------------------------------------------------------------ */

function DateStrip() {
  const today = useMemo(() => DATE_FORMATTER.format(new Date()), [])
  return (
    <div className="flex items-center -mb-2">
      <p className="text-secondary text-xs font-mono uppercase tracking-wider">{today}</p>
    </div>
  )
}

function BeltStrip({ belt }: { belt: BeltDTO }) {
  return (
    <section className="bg-surface border border-border/40 rounded-md p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
      <div className="flex items-center gap-3 shrink-0">
        <span
          aria-hidden
          className="inline-block w-7 h-7 rounded-full border border-border"
          style={{ backgroundColor: BELT_COLOR[belt.rank] }}
        />
        <h2 className="font-mono uppercase text-base md:text-lg text-primary tracking-tight">
          {belt.rank} belt
        </h2>
      </div>
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 flex-1">
        <BeltFactor label="katas" value={belt.factors.completed} />
        <BeltFactor label="clusters" value={belt.factors.distinctClusters} />
        <BeltFactor label="active (30)" value={belt.factors.activeDays30} />
        <BeltFactor label="at rank" value={belt.factors.daysAtRank} />
      </dl>
      <Link
        to="/belts"
        className="text-muted text-xs font-mono uppercase tracking-wider hover:text-secondary transition-colors shrink-0 self-start md:self-auto"
      >
        View →
      </Link>
    </section>
  )
}

function BeltFactor({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="font-mono text-xs tracking-[0.08em] uppercase text-muted mb-1">{label}</dt>
      <dd className="font-mono text-xl text-primary tabular-nums leading-none">{value}</dd>
    </div>
  )
}

function StreakCard({
  streak,
  heatmapData,
  weeklyGoal,
  spanWhenAlone = false,
}: {
  streak: number
  heatmapData: DashboardData['heatmapData']
  weeklyGoal: DashboardData['weeklyGoal']
  spanWhenAlone?: boolean
}) {
  const week = useMemo(() => weekActivity(heatmapData), [heatmapData])
  return (
    <section
      className={`${spanWhenAlone ? 'md:col-span-12' : 'md:col-span-7'} bg-surface border border-border/40 rounded-md p-6`}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-muted text-xs font-mono uppercase tracking-wider">Current streak</p>
        {weeklyGoal.target !== null && weeklyGoal.target > 0 && (
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
            <span className="text-muted text-xs font-mono uppercase">{WEEKDAY_LABELS[i]}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function formatAvgTime(minutes: number): string {
  if (minutes <= 0) return '—'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function PracticePatternsCard({ practicePatterns }: { practicePatterns: DashboardData['practicePatterns'] }) {
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    {
      label: 'Avg time',
      value: (
        <span className="font-mono text-primary text-base">
          {formatAvgTime(practicePatterns.avgTimeMinutes)}
        </span>
      ),
    },
  ]
  if (practicePatterns.mostAvoidedType) {
    rows.push({
      label: 'Most avoided',
      value: (
        <span className="font-mono text-accent text-xs uppercase tracking-wider bg-accent/10 px-2 py-0.5 rounded-sm">
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
            className="font-mono text-xs text-warning bg-warning/10 border border-warning/30 rounded-sm px-2.5 py-1 inline-flex items-center gap-1.5"
          >
            <span className="text-primary lowercase">{a.topic}</span>
            <span className="text-warning/70">({a.frequency})</span>
          </span>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function weekActivity(heatmap: DashboardData['heatmapData']): boolean[] {
  const active = new Set(heatmap.filter((d) => d.count > 0).map((d) => d.date))
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() + (day === 0 ? -6 : 1 - day))

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return active.has(iso)
  })
}
