import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { SkeletonCard } from '../components/ui/SkeletonLoader'
import { EmptyState } from '../components/ui/EmptyState'
import { HankoBadge } from '../components/ui/HankoBadge'
import { BrushstrokeUnderline } from '../components/ui/BrushstrokeUnderline'
import { useAuth } from '../context/AuthContext'
import { BELT_COLOR } from '../lib/belt-colors'
import type { BeltDTO, MilestoneDTO } from '@dojo/shared'

interface MilestoneView {
  slug: string
  name: string
  description: string
  category: string
  isPrestige: boolean
  earned: boolean
  earnedAt: string | null
}

const ALL_MILESTONES: Array<{
  slug: string
  name: string
  description: string
  category: string
  isPrestige: boolean
}> = [
  { slug: 'FIRST_KATA', name: 'First Kata', description: 'You completed your first kata. The hardest one was always the first.', category: 'practice', isPrestige: false },
  { slug: 'POLYGLOT', name: 'Polyglot', description: 'Solved kata across all three types: CODE, CHAT, and WHITEBOARD.', category: 'practice', isPrestige: false },
  { slug: 'BRUTAL_TRUTH', name: 'Brutal Truth', description: 'Received NEEDS WORK three times. You kept showing up.', category: 'practice', isPrestige: false },
  { slug: 'RUBBER_DUCK', name: 'Rubber Duck', description: 'Completed three CHAT kata. You think by writing.', category: 'practice', isPrestige: false },
  { slug: 'SQL_SURVIVOR', name: 'SQL Survivor', description: 'Completed three kata involving SQL.', category: 'mastery', isPrestige: false },
  { slug: '5_STREAK', name: '5 Streak', description: 'Practiced five consecutive days.', category: 'consistency', isPrestige: false },
  { slug: 'CONSISTENT', name: 'Consistent', description: 'Thirty consecutive days of practice.', category: 'consistency', isPrestige: false },
  { slug: 'SENSEI_APPROVED', name: 'Sensei Approved', description: 'Received a clean PASSED verdict five times.', category: 'mastery', isPrestige: false },
  { slug: 'ARCHITECT', name: 'Architect', description: 'Completed ten WHITEBOARD kata.', category: 'architect', isPrestige: false },
  { slug: 'UNDEFINED_NO_MORE', name: 'Undefined No More', description: "Fifty kata completed. You're not undefined anymore. The cursor disagrees and keeps blinking.", category: 'mastery', isPrestige: true },
  { slug: 'COURSE_TYPESCRIPT_FUNDAMENTALS', name: 'TypeScript Fundamentals', description: 'Completed every step of the TypeScript Fundamentals scroll.', category: 'mastery', isPrestige: false },
  { slug: 'COURSE_JAVASCRIPT_DOM_FUNDAMENTALS', name: 'DOM Wrangler', description: 'Completed every step of the JavaScript DOM Fundamentals scroll.', category: 'mastery', isPrestige: false },
  { slug: 'COURSE_SQL_DEEP_CUTS', name: 'SQL Deep Cuts', description: 'Completed every step of the SQL Deep Cuts scroll.', category: 'mastery', isPrestige: false },
]

const CATEGORY_ORDER = ['practice', 'consistency', 'mastery', 'architect'] as const

export function BeltsPage() {
  const { user } = useAuth()
  const [belt, setBelt] = useState<BeltDTO | null>(null)
  const [milestones, setMilestones] = useState<MilestoneDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    api
      .getBelts()
      .then((res) => {
        setBelt(res.belt)
        setMilestones(res.milestones)
      })
      .finally(() => setLoading(false))
  }, [user])

  const earnedMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const x of milestones) m.set(x.id, x.earnedAt)
    return m
  }, [milestones])

  const views: MilestoneView[] = useMemo(
    () =>
      ALL_MILESTONES.map((m) => ({
        ...m,
        earned: earnedMap.has(m.slug),
        earnedAt: earnedMap.get(m.slug) ?? null,
      })),
    [earnedMap],
  )

  if (loading || !belt) {
    return (
      <div className="px-4 md:px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h1 className="text-primary text-2xl md:text-2xl font-semibold leading-tight tracking-tight">
            Belts
          </h1>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  const earnedCount = views.filter((m) => m.earned).length

  return (
    <div className="px-4 md:px-6 py-8 max-w-7xl mx-auto">
      <header className="mb-10">
        <p className="font-mono text-xs tracking-[0.08em] uppercase text-muted mb-2">
          Your rank
        </p>
        <div className="flex items-center gap-4 mb-2">
          <span
            aria-label={`${belt.rank} belt`}
            className="inline-block w-12 h-12 rounded-full border border-border"
            style={{ backgroundColor: BELT_COLOR[belt.rank] }}
          />
          <h1 className="text-primary text-3xl md:text-4xl font-semibold leading-none tracking-tight uppercase font-mono">
            {belt.rank} belt
          </h1>
        </div>
        <BrushstrokeUnderline seed={`belt-${belt.rank}`} className="w-48 h-2 mb-6" />
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
          <Factor label="Katas completed" value={belt.factors.completed} />
          <Factor label="Topic clusters" value={belt.factors.distinctClusters} />
          <Factor label="Active days (30)" value={belt.factors.activeDays30} />
          <Factor label="Days at rank" value={belt.factors.daysAtRank} />
        </dl>
      </header>

      <section>
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="text-primary text-xl font-semibold tracking-tight">Milestones</h2>
          <div className="text-right shrink-0">
            <span className="block font-mono text-2xl text-primary tabular-nums leading-none">
              {earnedCount}
            </span>
            <span className="block text-muted text-sm mt-1">of {views.length} earned</span>
          </div>
        </div>

        {views.length === 0 && (
          <EmptyState
            eyebrow="Empty"
            headline="No milestones defined yet. The dojo is patient."
          />
        )}

        {CATEGORY_ORDER.map((cat) => {
          const catViews = views.filter((m) => m.category === cat)
          if (catViews.length === 0) return null
          const regular = catViews.filter((m) => !m.isPrestige)
          const prestige = catViews.filter((m) => m.isPrestige)
          return (
            <section key={cat} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <p className="font-mono text-xs tracking-[0.08em] uppercase text-muted">{cat}</p>
                <span className="flex-1 h-px bg-border" />
              </div>
              {regular.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regular.map((m) => (
                    <MilestoneCard key={m.slug} milestone={m} />
                  ))}
                </div>
              )}
              {prestige.length > 0 && (
                <div className="flex flex-col gap-4 mt-4">
                  {prestige.map((m) => (
                    <PrestigeMilestoneCard key={m.slug} milestone={m} />
                  ))}
                </div>
              )}
            </section>
          )
        })}

        <p className="text-center text-muted text-xs font-mono tracking-[0.08em] uppercase mt-12 opacity-70">
          Belts are earned in the dojo. There are no shortcuts.
        </p>
      </section>
    </div>
  )
}

function Factor({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="font-mono text-xs tracking-[0.08em] uppercase text-muted mb-1">{label}</dt>
      <dd className="font-mono text-2xl text-primary tabular-nums leading-none">{value}</dd>
    </div>
  )
}

function MilestoneCard({ milestone }: { milestone: MilestoneView }) {
  const earnedDate = milestone.earnedAt
    ? new Date(milestone.earnedAt).toISOString().slice(0, 10)
    : null

  return (
    <div
      className={`bg-surface border border-border rounded-md p-6 min-h-50 flex flex-col justify-between ${
        milestone.earned ? '' : 'opacity-50'
      }`}
    >
      <div className="flex items-start gap-4">
        <HankoBadge text={milestone.name} earned={milestone.earned} />
        <div className="flex-1 min-w-0">
          <h3
            className={`font-mono text-lg font-bold tracking-[0.04em] uppercase mb-2 ${
              milestone.earned ? 'text-primary' : 'text-muted'
            }`}
          >
            {milestone.name}
          </h3>
          <p className={`text-sm leading-relaxed ${milestone.earned ? 'text-secondary' : 'text-muted'}`}>
            {milestone.description}
          </p>
        </div>
      </div>
      <p
        className={`font-mono text-xs tracking-[0.08em] uppercase mt-4 ${
          milestone.earned ? 'text-muted' : 'text-muted/60 text-center'
        }`}
      >
        {earnedDate ? `Earned ${earnedDate}` : '—'}
      </p>
    </div>
  )
}

function PrestigeMilestoneCard({ milestone }: { milestone: MilestoneView }) {
  const earnedDate = milestone.earnedAt
    ? new Date(milestone.earnedAt).toISOString().slice(0, 10)
    : null

  return (
    <div
      className={`bg-surface border border-border border-l-2 border-l-accent rounded-md p-6 md:p-8 ${
        milestone.earned ? '' : 'opacity-50'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <HankoBadge text={milestone.name} earned={milestone.earned} />
          <div className="flex-1 min-w-0">
            <h3
              className={`font-mono text-2xl md:text-2xl font-bold tracking-[0.04em] uppercase leading-none mb-3 ${
                milestone.earned ? 'text-primary' : 'text-muted'
              }`}
            >
              {milestone.name}
            </h3>
            <p className={`text-sm leading-relaxed ${milestone.earned ? 'text-secondary' : 'text-muted'}`}>
              {milestone.description}
            </p>
          </div>
        </div>
        <p
          className={`font-mono text-xs tracking-[0.08em] uppercase shrink-0 ${
            milestone.earned ? 'text-muted' : 'text-muted/60'
          }`}
        >
          {earnedDate ? `Earned ${earnedDate}` : '—'}
        </p>
      </div>
    </div>
  )
}
