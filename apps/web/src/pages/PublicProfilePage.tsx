import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError, type PublicProfileData } from '../lib/api'
import { PublicPageLayout } from '../components/PublicPageLayout'
import { ErrorState } from '../components/ui/ErrorState'
import { DenseSessionRow } from '../components/ui/DenseSessionRow'
import type { ExerciseType, Difficulty, Verdict } from '@dojo/shared'

const BADGE_NAMES: Record<string, string> = {
  FIRST_KATA: 'First Kata',
  '5_STREAK': '5 Day Streak',
  POLYGLOT: 'Polyglot',
  BRUTAL_TRUTH: 'Brutal Truth',
  RUBBER_DUCK: 'Rubber Duck',
  SQL_SURVIVOR: 'SQL Survivor',
  CONSISTENT: 'Consistent',
  SENSEI_APPROVED: 'Sensei Approved',
  ARCHITECT: 'Architect',
  UNDEFINED_NO_MORE: 'Undefined No More',
  COURSE_TYPESCRIPT_FUNDAMENTALS: 'TypeScript Fundamentals',
  COURSE_JAVASCRIPT_DOM_FUNDAMENTALS: 'DOM Wrangler',
  COURSE_SQL_DEEP_CUTS: 'SQL Deep Cuts',
}

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [error, setError] = useState<'notfound' | 'network' | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    if (!username) return
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .getPublicProfile(username)
      .then((p) => { if (!cancelled) setProfile(p) })
      .catch((err) => {
        if (cancelled) return
        const is404 = err instanceof ApiError && err.status === 404
        setError(is404 ? 'notfound' : 'network')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [username, retryTick])

  if (loading) {
    return (
      <PublicPageLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-muted font-mono text-sm">
          Loading profile<span className="animate-cursor text-accent ml-0.5" aria-hidden>_</span>
        </div>
      </PublicPageLayout>
    )
  }

  if (error === 'notfound') {
    return (
      <ErrorState
        title="Practitioner not found."
        message="No one practices under that handle. Maybe they never did."
        primaryAction={{ label: 'Go home', to: '/' }}
      />
    )
  }

  if (error === 'network' || !profile) {
    return (
      <ErrorState
        message="We couldn't load this profile."
        primaryAction={{ label: 'Try again', onClick: () => setRetryTick((n) => n + 1) }}
        secondaryAction={{ label: 'Go home', to: '/' }}
      />
    )
  }

  const memberSince = new Date(profile.memberSince).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const passColor =
    profile.stats.passRate >= 80
      ? 'text-success/90'
      : profile.stats.passRate >= 50
        ? 'text-warning/90'
        : 'text-danger/90'
  const avgTime = formatAvgTime(profile.stats.avgTimeMinutes)

  return (
    <PublicPageLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-6">
        {/* Header band */}
        <section className="relative bg-surface border border-border rounded-md p-6 md:p-8">
          {profile.streak > 0 && (
            <span className="absolute top-4 right-4 font-mono text-[11px] tracking-[0.08em] uppercase text-accent border border-accent/40 bg-accent/10 px-2 py-1 rounded-sm">
              {profile.streak} day streak
            </span>
          )}
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
            <div className="flex items-center gap-4 md:w-[40%] min-w-0">
              <img
                src={profile.avatarUrl}
                alt=""
                aria-hidden
                className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-elevated shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-primary text-2xl md:text-[32px] font-semibold leading-tight tracking-tight truncate">
                  {profile.username}
                </h1>
                <p className="text-secondary text-[15px]">@{profile.username}</p>
                <p className="text-muted text-[11px] font-mono tracking-[0.04em] mt-1">
                  Member since {memberSince}
                </p>
              </div>
            </div>
            <div className="md:flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 md:divide-x md:divide-border">
              <StatCell label="Kata" value={String(profile.stats.totalKata)} />
              <StatCell label="Pass rate" value={`${profile.stats.passRate}%`} colorClass={passColor} />
              <StatCell label="Avg time" value={avgTime} />
              <StatCell label="Languages" value={String(profile.stats.languages.length)} />
            </div>
          </div>
        </section>

        {/* Activity */}
        <section className="bg-surface border border-border rounded-md p-6 md:p-8">
          <SectionEyebrow title="Activity" />
          <Heatmap data={profile.heatmapData} />
          <div className="flex items-center justify-between mt-3 font-mono text-[11px] text-muted">
            <span>Each square is one day. Darker = more kata.</span>
            <HeatmapLegend />
          </div>
        </section>

        {/* Earned badges */}
        {profile.badges.length > 0 && (
          <section className="bg-surface border border-border rounded-md p-6 md:p-8">
            <SectionEyebrow title="Earned badges" />
            <div className="flex gap-3 overflow-x-auto pb-2">
              {profile.badges.map((badge) => (
                <BadgeMiniCard
                  key={badge.slug}
                  name={BADGE_NAMES[badge.slug] ?? badge.slug}
                  earnedAt={badge.earnedAt}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent kata */}
        {profile.recentSessions.length > 0 && (
          <section className="bg-surface border border-border rounded-md overflow-hidden">
            <div className="px-6 md:px-8 pt-6 md:pt-8">
              <SectionEyebrow title="Recent kata" />
            </div>
            <div>
              {profile.recentSessions.map((s) => (
                <DenseSessionRow
                  key={s.id}
                  type={s.exerciseType as ExerciseType}
                  difficulty={s.difficulty as Difficulty}
                  title={s.exerciseTitle}
                  verdict={s.verdict as Verdict | null}
                  status={s.status}
                  startedAt={s.startedAt}
                  completedAt={s.completedAt}
                  onClick={() => navigate(`/share/${s.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </PublicPageLayout>
  )
}

function StatCell({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="md:px-6 first:md:pl-0 last:md:pr-0">
      <p className={`font-mono text-2xl md:text-[32px] tabular-nums leading-none ${colorClass ?? 'text-primary'}`}>
        {value}
      </p>
      <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted mt-2">
        {label}
      </p>
    </div>
  )
}

function SectionEyebrow({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted">{title}</p>
      <span className="flex-1 h-px bg-border" />
    </div>
  )
}

function BadgeMiniCard({ name, earnedAt }: { name: string; earnedAt: string }) {
  const earnedLabel = new Date(earnedAt).toISOString().slice(0, 10)
  return (
    <div className="bg-page border border-border rounded-md px-4 py-3 min-w-50 shrink-0">
      <p className="font-mono text-[13px] font-bold tracking-[0.04em] uppercase text-primary">
        {name}
      </p>
      <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted mt-1">
        Earned {earnedLabel}
      </p>
    </div>
  )
}

function Heatmap({ data }: { data: Array<{ date: string; count: number }> }) {
  const dateMap = useMemo(() => new Map(data.map((d) => [d.date, d.count])), [data])
  const days = useMemo(() => {
    const out: Array<{ date: string; count: number }> = []
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    const start = new Date(end)
    start.setDate(start.getDate() - 89)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10)
      out.push({ date: key, count: dateMap.get(key) ?? 0 })
    }
    return out
  }, [dateMap])

  return (
    <div className="grid grid-cols-18 gap-0.5">
      {days.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.count} ${d.count === 1 ? 'session' : 'sessions'}`}
          className={`aspect-square rounded-sm ${heatmapColor(d.count)}`}
        />
      ))}
    </div>
  )
}

function HeatmapLegend() {
  return (
    <div className="inline-flex items-center gap-1">
      <span>less</span>
      {[0, 1, 2, 3, 4].map((n) => (
        <span key={n} className={`w-2.5 h-2.5 rounded-sm ${heatmapColor(n)}`} aria-hidden />
      ))}
      <span>more</span>
    </div>
  )
}

function heatmapColor(count: number): string {
  if (count <= 0) return 'bg-page border border-border'
  if (count === 1) return 'bg-accent/30'
  if (count === 2) return 'bg-accent/55'
  if (count === 3) return 'bg-accent/75'
  return 'bg-accent'
}

function formatAvgTime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—'
  const mm = Math.floor(minutes)
  const ss = Math.floor((minutes - mm) * 60)
  return `${mm}:${ss.toString().padStart(2, '0')}`
}
