import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { PublicPageLayout } from '../components/PublicPageLayout'
import { ErrorPanel } from '../components/ui/ErrorPanel'
import { Button, buttonClasses } from '../components/ui/Button'
import { DenseSessionRow } from '../components/ui/DenseSessionRow'
import { BeltRingAvatar } from '../components/ui/BeltRingAvatar'
import { Heatmap, heatmapIntensity } from '../components/ui/Heatmap'
import { BELT_COLOR } from '../lib/belt-colors'
import { PublicPractitioner } from '../components/recognition/PublicPractitioner'
import type { KataType, Difficulty, Verdict } from '@dojo/shared'

const BADGE_NAMES: Record<string, string> = {
  FIRST_KATA: 'First Kata',
  '5_STREAK': '5 Day Streak',
  POLYGLOT: 'Polyglot',
  BRUTAL_TRUTH: 'Brutal Truth',
  RUBBER_DUCK: 'Rubber Duck',
  SQL_SURVIVOR: 'SQL Survivor',
  CONSISTENT: 'Consistent',
  SENSEI_APPROVED: 'Sensei Approved · Legacy',
  ARCHITECT: 'Architect',
  UNDEFINED_NO_MORE: 'Undefined No More',
  COURSE_TYPESCRIPT_FUNDAMENTALS: 'TypeScript Fundamentals',
  COURSE_JAVASCRIPT_DOM_FUNDAMENTALS: 'DOM Wrangler',
  COURSE_SQL_DEEP_CUTS: 'SQL Deep Cuts',
}

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { data: profile, loading, error, reload } = useAsync(
    () => api.getPublicProfile(username!),
    [username],
  )

  if (loading) {
    return (
      <PublicPageLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-secondary font-mono text-sm">
          Loading profile<span className="animate-cursor text-accent ml-0.5" aria-hidden>_</span>
        </div>
      </PublicPageLayout>
    )
  }

  const isNotFound = error instanceof ApiError && error.status === 404
  if (isNotFound) {
    return (
      <PublicPageLayout hideCta>
        <ErrorPanel
          code="ERR · 404 · NOT FOUND"
          title="Practitioner not found."
          actions={<Link to="/" className={buttonClasses({ size: 'lg' })}>Go home</Link>}
        >
          <p className="paper-body max-w-xl">No one practices under that handle. Maybe they never did.</p>
        </ErrorPanel>
      </PublicPageLayout>
    )
  }

  if (error || !profile) {
    return (
      <PublicPageLayout hideCta>
        <ErrorPanel
          code="ERR · 500 · INTERNAL"
          title="Something broke. The dojo is still here."
          actions={
            <>
              <Button size="lg" onClick={reload}>Try again</Button>
              <Link to="/" className={buttonClasses({ variant: 'ghost', size: 'lg' })}>Go home</Link>
            </>
          }
        >
          <p className="paper-body max-w-xl">We couldn't load this profile.</p>
        </ErrorPanel>
      </PublicPageLayout>
    )
  }

  const memberSince = new Date(profile.memberSince).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const passColor = passRateColor(profile.stats.passRate)
  const avgTime = formatAvgTime(profile.stats.avgTimeMinutes)

  return (
    <PublicPageLayout>
      <div className="paper-container py-8 md:py-16 flex flex-col gap-8 md:gap-12">
        <header className="border-b border-border">
          <div aria-hidden className="h-1" style={{ backgroundColor: BELT_COLOR[profile.belt.rank] }} />
          <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8 pt-6 md:pt-8 pb-6 md:pb-8">
            <div className="flex items-start gap-6 md:gap-15 md:w-[42%] min-w-0">
              <BeltRingAvatar src={profile.avatarUrl} rank={profile.belt.rank} size={56} alt="" />
              <div className="min-w-0">
                <h1 className="text-primary text-2xl md:text-[2rem] font-bold leading-tight tracking-tight truncate">
                  {profile.username}
                </h1>
                <p className="paper-note tracking-[0.04em] mt-2">
                  Member since {memberSince} · {profile.belt.rank} belt
                </p>
                {profile.streak > 0 && (
                  <p className="paper-eyebrow mt-2">{profile.streak} day streak</p>
                )}
              </div>
            </div>
            <div className="md:flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6 md:gap-y-0 md:pt-2 md:divide-x md:divide-border">
              <StatCell label="Kata" value={String(profile.stats.totalKata)} />
              <StatCell label="Pass rate" value={`${profile.stats.passRate}%`} colorClass={passColor} />
              <StatCell label="Avg time" value={avgTime} />
              <StatCell label="Languages" value={String(profile.stats.languages.length)} />
            </div>
          </div>
        </header>

        <section>
          <SectionEyebrow title="Practitioner" />
          <PublicPractitioner username={profile.username} practitioner={profile.practitioner} />
        </section>

        <section>
          <SectionEyebrow title="Activity" />
          <Heatmap data={profile.heatmapData} days={90} />
          <div className="flex items-center justify-between gap-4 mt-3 font-mono text-xs text-secondary">
            <span>Each square is one day. Brighter = more kata.</span>
            <HeatmapLegend />
          </div>
        </section>

        {profile.milestones.length > 0 && (
          <section>
            <SectionEyebrow title="Earned badges" />
            <div className="flex gap-3 overflow-x-auto pb-2">
              {profile.milestones.map((badge) => (
                <BadgeMiniCard
                  key={badge.slug}
                  name={BADGE_NAMES[badge.slug] ?? badge.slug}
                  earnedAt={badge.earnedAt}
                />
              ))}
            </div>
          </section>
        )}

        {profile.recentSessions.length > 0 && (
          <section>
            <SectionEyebrow title="Recent kata" />
            <div>
              {profile.recentSessions.map((s) => (
                <DenseSessionRow
                  key={s.id}
                  type={s.kataType as KataType}
                  difficulty={s.difficulty as Difficulty}
                  title={s.kataTitle}
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

function StatCell({ label, value, colorClass }: Readonly<{ label: string; value: string; colorClass?: string }>) {
  return (
    <div className="md:px-6 first:md:pl-0">
      <p className={`font-mono text-2xl tabular-nums leading-none ${colorClass ?? 'text-primary'}`}>
        {value}
      </p>
      <p className="paper-eyebrow mt-3">{label}</p>
    </div>
  )
}

function SectionEyebrow({ title }: Readonly<{ title: string }>) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <h2 className="paper-eyebrow">{title}</h2>
      <span aria-hidden className="flex-1 h-px bg-border" />
    </div>
  )
}

function BadgeMiniCard({ name, earnedAt }: Readonly<{ name: string; earnedAt: string }>) {
  const earnedLabel = new Date(earnedAt).toISOString().slice(0, 10)
  return (
    <div className="bg-page border border-border rounded-md px-4 py-3 min-w-50 shrink-0">
      <p className="font-mono text-sm font-bold tracking-[0.04em] uppercase text-primary">
        {name}
      </p>
      <p className="font-mono text-xs tracking-[0.08em] uppercase text-secondary mt-1">
        Earned {earnedLabel}
      </p>
    </div>
  )
}

function HeatmapLegend() {
  return (
    <div className="inline-flex items-center gap-1">
      <span>less</span>
      {[0, 1, 2, 3, 4].map((n) => (
        <span key={n} className={`w-2.5 h-2.5 rounded-sm ${heatmapIntensity(n)}`} aria-hidden />
      ))}
      <span>more</span>
    </div>
  )
}

function passRateColor(passRate: number): string {
  if (passRate >= 80) return 'text-success-text/90'
  if (passRate >= 50) return 'text-warning-text/90'
  return 'text-danger-text'
}

function formatAvgTime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—'
  const mm = Math.floor(minutes)
  const ss = Math.floor((minutes - mm) * 60)
  return `${mm}:${ss.toString().padStart(2, '0')}`
}
