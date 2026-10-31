import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { BeltDTO, KataType } from '@dojo/shared'
import { api, type DashboardData } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { TypeRuleBadge } from '../components/ui/Badge'
import { DashboardLoadState } from '../components/dashboard/DashboardLoadState'
import { TodayCard } from '../components/dashboard/TodayCard'
import { RecentSessionRow } from '../components/dashboard/RecentSessionRow'
import { OnboardingOverlay } from '../components/onboarding/OnboardingOverlay'
import { useFirstVisit } from '../hooks/useFirstVisit'
import { useOnline } from '../hooks/useOnline'
import { BELT_COLOR } from '../lib/belt-colors'

const PAGE = 'paper-container py-8 md:py-12'

const TEXT_LINK =
  'inline-flex items-center min-h-11 font-mono text-xs uppercase tracking-[0.08em] text-accent-text hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const START_ERROR = "Couldn't start that kata. Try again."

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

export function DashboardPage() {
  const navigate = useNavigate()
  const { online } = useOnline()
  const { data: dashboard, error, reload } = useAsync(() => api.getDashboard(), [])

  const isFirstVisit = !!dashboard && dashboard.streak === 0 && dashboard.recentSessions.length === 0
  const onboarding = useFirstVisit(isFirstVisit)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  async function startDailyKata() {
    setStarting(true)
    setStartError(null)
    try {
      const { sessionId } = await api.startDailyKata()
      navigate(`/katas/${sessionId}`)
    } catch {
      setStartError(START_ERROR)
      setStarting(false)
    }
  }

  function retry() {
    reload()
    focusMain()
  }

  if (!dashboard) {
    return (
      <div className={PAGE}>
        <DateStrip />
        {error ? <DashboardLoadState status="error" onRetry={retry} /> : <DashboardLoadState status="loading" />}
      </div>
    )
  }

  const daily = dashboard.dailyKataMinutes !== null
  const startKata = daily ? startDailyKata : () => navigate('/katas')
  const startDisabled = daily && !online
  const showPatterns = dashboard.totalCompleted >= 3

  return (
    <div className={`${PAGE} state-reveal`}>
      <DateStrip />
      {onboarding.isFirstVisit ? (
        <OnboardingOverlay
          daily={daily}
          startDisabled={startDisabled}
          onStart={startKata}
          onDismiss={() => {
            onboarding.dismiss()
            focusMain()
          }}
        />
      ) : (
        <TodayCard
          todayComplete={dashboard.todayComplete}
          todaySession={dashboard.todaySession}
          activeSessionId={dashboard.activeSessionId}
          dailyKataMinutes={dashboard.dailyKataMinutes}
          isFirstVisit={isFirstVisit}
          starting={starting}
          startDisabled={startDisabled}
          startError={startError}
          onStart={startKata}
          onResume={(id) => navigate(`/katas/${id}`)}
          onViewResults={(id) => navigate(`/katas/${id}/result`)}
        />
      )}

      <div
        className={`grid gap-7 md:gap-8 lg:gap-14 border-t border-border py-6 md:py-6.5 ${showPatterns ? 'md:grid-cols-2' : ''}`}
      >
        <StreakCard streak={dashboard.streak} heatmapData={dashboard.heatmapData} weeklyGoal={dashboard.weeklyGoal} />
        {showPatterns && <PracticePatternsCard practicePatterns={dashboard.practicePatterns} />}
      </div>

      <BeltStrip belt={dashboard.belt} />

      {dashboard.recentSessions.length > 0 && <RecentActivity sessions={dashboard.recentSessions} />}

      {showPatterns && dashboard.weakAreas.length > 0 && <WeakAreasCard weakAreas={dashboard.weakAreas} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sections                                                           */
/* ------------------------------------------------------------------ */

function DateStrip() {
  const today = useMemo(() => DATE_FORMATTER.format(new Date()), [])
  return (
    <p className="paper-eyebrow date-strip">{today}</p>
  )
}

function BeltStrip({ belt }: Readonly<{ belt: BeltDTO }>) {
  return (
    <section
      aria-labelledby="belt-heading"
      className="grid grid-cols-[1fr_auto] lg:grid-cols-[1.15fr_2.5fr_auto] items-center gap-5 lg:gap-6 py-5.5 md:py-6 border-y border-border"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="size-6 shrink-0 rounded-full border border-border"
          style={{ backgroundColor: BELT_COLOR[belt.rank] }}
        />
        <h2 id="belt-heading" className="font-sans font-bold text-lg text-primary tracking-tight whitespace-nowrap">
          {belt.rank} belt
        </h2>
      </div>
      <dl className="max-lg:row-start-2 max-lg:col-span-2 grid grid-cols-2 min-[360px]:grid-cols-4 gap-2.5 lg:gap-4.5">
        <BeltFactor label="katas" value={belt.factors.completed} />
        <BeltFactor label="clusters" value={belt.factors.distinctClusters} />
        <BeltFactor label="active (30)" value={belt.factors.activeDays30} />
        <BeltFactor label="at rank" value={belt.factors.daysAtRank} />
      </dl>
      <Link to="/belts" className={TEXT_LINK} aria-label="View belt progress">
        View →
      </Link>
    </section>
  )
}

function BeltFactor({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div>
      <dt className="paper-eyebrow whitespace-nowrap max-md:tracking-[0.02em]!">{label}</dt>
      <dd className="mt-1 font-mono text-xl text-primary tabular-nums">{value}</dd>
    </div>
  )
}

function StreakCard({
  streak,
  heatmapData,
  weeklyGoal,
}: Readonly<{
  streak: number
  heatmapData: DashboardData['heatmapData']
  weeklyGoal: DashboardData['weeklyGoal']
}>) {
  const week = useMemo(() => weekActivity(heatmapData), [heatmapData])
  return (
    <section aria-labelledby="streak-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="paper-eyebrow" id="streak-heading">Current streak</h2>
        {weeklyGoal.target !== null && weeklyGoal.target > 0 && (
          <p className="paper-note tabular-nums">
            {weeklyGoal.completed}/{weeklyGoal.target} this week
          </p>
        )}
      </div>
      <p className="flex items-baseline gap-2.5 mt-2">
        <span className="font-mono text-4xl md:text-5xl text-primary tracking-tight tabular-nums">{streak}</span>
        <span className="font-mono text-secondary text-sm">days</span>
      </p>
      <div className="grid grid-cols-7 gap-2 mt-3.5 md:mt-4.5">
        {week.map((active, i) => (
          <div key={WEEKDAY_LABELS[i]} className="flex flex-col gap-1.5 text-center">
            <div
              className={`h-2 rounded-sm border ${active ? 'bg-success border-success' : 'border-border'}`}
              aria-hidden
            />
            <span className="text-secondary text-xs font-mono">
              {WEEKDAY_LABELS[i]}
              <span className="sr-only">{active ? ': kata done' : ': no kata'}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function focusMain() {
  document.getElementById('main')?.focus({ preventScroll: true })
}

function formatAvgTime(minutes: number): string {
  if (minutes <= 0) return '—'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function PracticePatternsCard({ practicePatterns }: Readonly<{ practicePatterns: DashboardData['practicePatterns'] }>) {
  const { avgTimeMinutes, mostAvoidedType, sessionsTimedOut } = practicePatterns
  return (
    <section aria-labelledby="patterns-heading" className="max-md:border-t max-md:border-border max-md:pt-6">
      <h2 className="paper-eyebrow mb-2.5" id="patterns-heading">Practice patterns</h2>
      <dl>
        <PatternRow label="Avg time">{formatAvgTime(avgTimeMinutes)}</PatternRow>
        {mostAvoidedType && (
          <PatternRow label="Most avoided">
            <TypeRuleBadge type={mostAvoidedType as KataType} />
          </PatternRow>
        )}
        <PatternRow label="Sessions timed out">
          <span className={sessionsTimedOut > 0 ? 'text-danger-text' : 'text-success-text'}>{sessionsTimedOut}</span>
        </PatternRow>
      </dl>
    </section>
  )
}

function PatternRow({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="flex items-center justify-between gap-4 min-h-10 md:min-h-9.25 border-b border-border last:border-b-0">
      <dt className="text-sm text-secondary">{label}</dt>
      <dd className="font-mono text-base text-primary tabular-nums">{children}</dd>
    </div>
  )
}

function RecentActivity({ sessions }: Readonly<{ sessions: DashboardData['recentSessions'] }>) {
  return (
    <section className="mt-5.5 md:mt-6.5" aria-labelledby="recent-heading">
      <div className="section-heading">
        <h2 className="paper-eyebrow" id="recent-heading">Recent kata</h2>
        <Link to="/history" className={TEXT_LINK}>Full history →</Link>
      </div>
      <div className="border-t border-border">
        {sessions.map((s) => (
          <RecentSessionRow key={s.id} session={s} to={`/katas/${s.id}/result`} />
        ))}
      </div>
    </section>
  )
}

function WeakAreasCard({ weakAreas }: Readonly<{ weakAreas: DashboardData['weakAreas'] }>) {
  return (
    <section aria-labelledby="weak-heading" className="flex flex-wrap items-baseline gap-3 md:gap-6 pt-6">
      <h2 className="paper-eyebrow" id="weak-heading">Weak areas</h2>
      <div className="flex flex-wrap gap-3 md:gap-4.5">
        {weakAreas.map((a) => (
          <span key={a.topic} className="font-mono text-xs text-secondary">
            {a.topic} <span className="text-warning-text">({a.frequency})</span>
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
