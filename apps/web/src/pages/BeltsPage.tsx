import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'
import { LoadState } from '../components/ui/LoadState'
import { Skeleton } from '../components/ui/SkeletonLoader'
import { useAuth } from '../context/AuthContext'
import { BELT_COLOR } from '../lib/belt-colors'
import { BeltRecord, formatDate } from '../components/recognition/BeltRecord'
import { belongingsFrom } from '../components/recognition/belongings'
import { DojoBelongings } from '../components/recognition/DojoBelongings'
import { DojoRoom } from '../components/recognition/DojoRoom'
import type { BeltDTO, BeltPromotionDTO, MilestoneDTO, NextBeltDTO, PractitionerDTO } from '@dojo/shared'
import type { DashboardData } from '../lib/api'

interface MilestoneView {
  slug: string
  name: string
  description: string
  category: string
  isLegacy?: boolean
  earned: boolean
  earnedAt: string | null
}

const ALL_MILESTONES: Array<{
  slug: string
  name: string
  description: string
  category: string
  /** No longer earnable; shown only to those who earned it. */
  isLegacy?: boolean
}> = [
  { slug: 'FIRST_KATA', name: 'First Kata', description: 'You completed your first kata. The hardest one was always the first.', category: 'practice' },
  { slug: 'POLYGLOT', name: 'Polyglot', description: 'Practiced kata of three different types.', category: 'practice' },
  { slug: 'BRUTAL_TRUTH', name: 'Brutal Truth', description: 'Received NEEDS WORK three times. You kept showing up.', category: 'practice' },
  { slug: 'RUBBER_DUCK', name: 'Rubber Duck', description: 'Completed three CHAT kata. You think by writing.', category: 'practice' },
  { slug: 'SQL_SURVIVOR', name: 'SQL Survivor', description: 'Completed three kata involving SQL.', category: 'mastery' },
  { slug: '5_STREAK', name: '5 Streak', description: 'Practiced five consecutive days.', category: 'consistency' },
  { slug: 'CONSISTENT', name: 'Consistent', description: 'Thirty consecutive days of practice.', category: 'consistency' },
  { slug: 'SENSEI_APPROVED', name: 'Sensei Approved', description: 'Received a clean PASSED verdict five times.', category: 'mastery', isLegacy: true },
  { slug: 'ARCHITECT', name: 'Architect', description: 'Completed three WHITEBOARD kata.', category: 'architect' },
  { slug: 'UNDEFINED_NO_MORE', name: 'Undefined No More', description: "Fifty kata completed. You're not undefined anymore. The cursor disagrees and keeps blinking.", category: 'mastery' },
]

const CATEGORY_ORDER = ['practice', 'consistency', 'mastery', 'architect'] as const



export function BeltsPage() {
  const { user } = useAuth()
  const [belt, setBelt] = useState<BeltDTO | null>(null)
  const [record, setRecord] = useState<BeltPromotionDTO[]>([])
  const [next, setNext] = useState<NextBeltDTO | null>(null)
  const [milestones, setMilestones] = useState<MilestoneDTO[]>([])
  const [practitioner, setPractitioner] = useState<PractitionerDTO | null>(null)
  const [daily, setDaily] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError(false)
    api.getDashboard().then((res) => !cancelled && setDaily(res)).catch(() => undefined)
    Promise.all([api.getBelts(), api.getPractitioner()])
      .then(([res, practitionerRes]) => {
        if (cancelled) return
        setPractitioner(practitionerRes)
        setBelt(res.belt)
        setRecord(res.record)
        setNext(res.next)
        setMilestones(res.milestones)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, retryTick])

  const earnedMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const x of milestones) m.set(x.id, x.earnedAt)
    return m
  }, [milestones])

  const views: MilestoneView[] = useMemo(
    () =>
      ALL_MILESTONES.filter((m) => !m.isLegacy || earnedMap.has(m.slug)).map((m) => ({
        ...m,
        earned: earnedMap.has(m.slug),
        earnedAt: earnedMap.get(m.slug) ?? null,
      })),
    [earnedMap],
  )

  if (error) {
    return (
      <div className="paper-container py-8 md:py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="paper-heading mb-6">Your dojo</h1>
          <LoadState
            status="error"
            flush
            eyebrow="Error · Your dojo"
            title="We couldn't load your dojo."
            onRetry={() => setRetryTick((n) => n + 1)}
          />
        </div>
      </div>
    )
  }

  if (loading || !belt || !practitioner) {
    return (
      <div className="paper-container py-8 md:py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="paper-heading mb-6">Your dojo</h1>
          <LoadState status="loading" eyebrow="Opening your corner…">
            <div className="grid gap-4 mt-5 max-w-110 mx-auto" aria-hidden>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/5 mx-auto" />
              <Skeleton className="h-3 w-full" />
            </div>
          </LoadState>
        </div>
      </div>
    )
  }

  const earnedCount = views.filter((m) => m.earned).length

  const belongings = belongingsFrom(practitioner.pieces)

  return (
    <div className="paper-container py-8 md:py-12">
      <header className="flex max-md:flex-col md:items-end justify-between gap-5 mb-6 md:mb-8">
        <div>
          <a href="#belt-journey" aria-label={`View your ${belt.rank} belt record`} className="paper-eyebrow capitalize flex items-center gap-2.5 min-h-6 mb-3">
            <span aria-hidden className="w-6 h-1 border border-secondary" style={{ backgroundColor: BELT_COLOR[belt.rank] }} />
            {belt.rank} belt ↘
          </a>
          <h1 className="paper-heading">Your dojo</h1>
          <p className="paper-body mt-2">Your practice, in one place.</p>
        </div>
        {daily && <DailyAction daily={daily} />}
      </header>

      <DojoRoom rank={belt.rank} belongings={belongings.map(({ id }) => id)} />
      <BeltRecord belt={belt} record={record} next={next} />
      <DojoBelongings belongings={belongings} />

      <section aria-labelledby="milestones-heading" className="border-t border-border pt-6 md:pt-8">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <h2 id="milestones-heading" className={SECTION_TITLE}>Milestones</h2>
          <p className="paper-note tabular-nums">{earnedCount} of {views.length} earned</p>
        </div>

        {earnedCount === 0 && (
          <p className="paper-body mb-6">
            Complete a kata to earn your first milestone. Your belt grows with the katas you
            finish, the topics you cover and the days you show up.
          </p>
        )}

        {CATEGORY_ORDER.map((cat) => {
          const catViews = views.filter((m) => m.category === cat)
          if (catViews.length === 0) return null
          return (
            <section key={cat} className="mb-8">
              <h3 className="paper-eyebrow pb-2.5">{cat}</h3>
              <ul className="border-t border-border">
                {catViews.map((m) => (
                  <MilestoneRow key={m.slug} milestone={m} />
                ))}
              </ul>
            </section>
          )
        })}

        <p className="paper-note mt-10">Belts are earned in the dojo. There are no shortcuts.</p>
      </section>
    </div>
  )
}

const SECTION_TITLE = 'text-[22px] md:text-xl leading-[1.4] font-bold text-primary'

function dailyAction({ activeSessionId, todayComplete, todaySession, dailyKataMinutes }: DashboardData) {
  if (activeSessionId) return { note: 'In progress', label: 'Resume kata →', to: `/katas/${activeSessionId}` }
  if (todayComplete && todaySession) {
    return { note: 'Done today', label: 'View results →', to: `/katas/${todaySession.id}/result` }
  }
  if (!dailyKataMinutes) return { note: 'Today', label: 'Practice', to: '/dashboard' }
  return { note: `Today · ~${dailyKataMinutes} min`, label: `Practice · ${dailyKataMinutes} min`, to: '/dashboard' }
}

function DailyAction({ daily }: Readonly<{ daily: DashboardData }>) {
  const navigate = useNavigate()
  const action = dailyAction(daily)
  return (
    <div className="flex md:flex-col max-md:items-center max-md:justify-between gap-2 md:items-end">
      <p className="paper-note">{action.note}</p>
      <Button onClick={() => navigate(action.to)}>{action.label}</Button>
    </div>
  )
}

function earnedLabel({ earnedAt, isLegacy }: MilestoneView): string {
  if (!earnedAt) return 'Not yet'
  const earned = `Earned ${formatDate(earnedAt)}`
  return isLegacy ? `${earned} · Legacy` : earned
}
function MilestoneRow({ milestone }: Readonly<{ milestone: MilestoneView }>) {
  const { earned, name, description } = milestone
  return (
    <li className="ruled-row items-baseline gap-4 py-3.5 max-md:flex-col max-md:items-start max-md:gap-1">
      <div className="min-w-0">
        <p className={`text-[15px] font-medium ${earned ? 'text-primary' : 'text-secondary'}`}>{name}</p>
        <p className="text-sm text-secondary mt-0.5">{description}</p>
      </div>
      <span className="paper-note shrink-0 md:text-right">{earnedLabel(milestone)}</span>
    </li>
  )
}
