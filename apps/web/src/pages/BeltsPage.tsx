import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { LoadState } from '../components/ui/LoadState'
import { Skeleton } from '../components/ui/SkeletonLoader'
import { useAuth } from '../context/AuthContext'
import { BELT_COLOR } from '../lib/belt-colors'
import { PractitionerSection } from '../components/recognition/PractitionerSection'
import type { BeltDTO, BeltPromotionDTO, BeltRank, MilestoneDTO, NextBeltDTO } from '@dojo/shared'

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

const RANKS: BeltRank[] = ['white', 'yellow', 'green', 'brown', 'black']

const FACTORS = [
  { key: 'completed', label: 'Kata completed' },
  { key: 'distinctClusters', label: 'Topic clusters' },
  { key: 'activeDays30', label: 'Active days (30)' },
  { key: 'daysAtRank', label: 'Days at rank' },
] as const

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export function BeltsPage() {
  const { user } = useAuth()
  const [belt, setBelt] = useState<BeltDTO | null>(null)
  const [record, setRecord] = useState<BeltPromotionDTO[]>([])
  const [next, setNext] = useState<NextBeltDTO | null>(null)
  const [milestones, setMilestones] = useState<MilestoneDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError(false)
    api
      .getBelts()
      .then((res) => {
        if (cancelled) return
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
          <h1 className="paper-heading mb-6">Belts</h1>
          <LoadState
            status="error"
            flush
            eyebrow="Error · Belts"
            title="We couldn't load your belt progress."
            onRetry={() => setRetryTick((n) => n + 1)}
          />
        </div>
      </div>
    )
  }

  if (loading || !belt) {
    return (
      <div className="paper-container py-8 md:py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="paper-heading mb-6">Belts</h1>
          <LoadState status="loading" eyebrow="Loading your belt record">
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

  return (
    <div className="paper-container py-8 md:py-12">
      <header className="mb-8 md:mb-10">
        <p className="paper-eyebrow mb-2">Your rank</p>
        <div className="flex items-center gap-3 md:gap-4">
          <span
            aria-hidden
            className="inline-block size-6 md:size-8 rounded-full border border-secondary shrink-0"
            style={{ backgroundColor: BELT_COLOR[belt.rank] }}
          />
          <h1 className="paper-heading">{belt.rank} belt</h1>
        </div>
      </header>

      <BeltRecordSection current={belt.rank} record={record} />
      <BeltCriteria belt={belt} next={next} />

      <PractitionerSection />

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

function rankStatus(rank: BeltRank, current: BeltRank, reached: boolean): string {
  if (rank === current) return 'Current belt'
  if (reached) return 'Earned'
  return RANKS.indexOf(rank) === RANKS.indexOf(current) + 1 ? 'Next belt' : 'Ahead'
}

function BeltRecordSection({ current, record }: Readonly<{ current: BeltRank; record: BeltPromotionDTO[] }>) {
  const reachedAt = new Map(record.map((p) => [p.rank, p.reachedAt]))
  return (
    <section aria-labelledby="belts-heading" className="border-t border-border pt-6 md:pt-8 mb-8 md:mb-10">
      <h2 id="belts-heading" className={SECTION_TITLE}>Your belts</h2>
      <p className="paper-note mt-1 mb-5">The dates you reached each belt.</p>
      <ol className="grid grid-cols-1 md:grid-cols-5 md:gap-2 max-md:border-t max-md:border-border">
        {RANKS.map((rank) => {
          const date = reachedAt.get(rank)
          const isCurrent = rank === current
          return (
            <li
              key={rank}
              aria-current={isCurrent ? 'step' : undefined}
              className={`max-md:flex max-md:items-center max-md:gap-3 max-md:min-h-14 max-md:border-b border-border px-1 md:p-3 md:border-b-2 ${
                isCurrent ? 'bg-surface md:border-b-primary' : 'md:border-b-transparent'
              }`}
            >
              <span
                aria-hidden
                className="block h-2 max-md:w-7 shrink-0 rounded-[2px] border border-secondary md:mb-3"
                style={{ backgroundColor: BELT_COLOR[rank] }}
              />
              <span className="capitalize text-primary text-[15px] font-medium max-md:flex-1">{rank}</span>
              <span className="paper-note md:block md:mt-1">{rankStatus(rank, current, !!date)}</span>
              {date && <span className="paper-note md:block max-md:ml-3 tabular-nums">{DATE_FORMATTER.format(new Date(date))}</span>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function BeltCriteria({ belt, next }: Readonly<{ belt: BeltDTO; next: NextBeltDTO | null }>) {
  return (
    <section aria-labelledby="criteria-heading" className="mb-10">
      <h2 id="criteria-heading" className="paper-eyebrow pb-2.5">
        {next ? `Next · ${next.rank} belt` : 'Your practice'}
      </h2>
      <dl className="border-t border-border">
        {FACTORS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-4 min-h-11 border-b border-border">
            <dt className="text-sm text-secondary">{label}</dt>
            <dd className="flex items-baseline gap-3">
              <span className="font-mono text-primary tabular-nums">{belt.factors[key]}</span>
              {next && <span className="paper-note tabular-nums min-w-22 text-right">Asks for {next.criteria[key]}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function earnedLabel({ earnedAt, isLegacy }: MilestoneView): string {
  if (!earnedAt) return 'Not yet'
  const earned = `Earned ${DATE_FORMATTER.format(new Date(earnedAt))}`
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
