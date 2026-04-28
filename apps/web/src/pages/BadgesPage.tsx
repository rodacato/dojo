import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { SkeletonCard } from '../components/ui/SkeletonLoader'
import { useAuth } from '../context/AuthContext'

interface Badge {
  slug: string
  name: string
  description: string
  category: string
  isPrestige: boolean
  earned: boolean
  earnedAt: string | null
}

const ALL_BADGES: Array<{
  slug: string
  name: string
  description: string
  category: string
  isPrestige: boolean
}> = [
  { slug: 'FIRST_KATA', name: 'First Kata', description: 'You completed your first exercise. The hardest one was always the first.', category: 'practice', isPrestige: false },
  { slug: 'POLYGLOT', name: 'Polyglot', description: 'Solved kata across all three types: CODE, CHAT, and WHITEBOARD.', category: 'practice', isPrestige: false },
  { slug: 'BRUTAL_TRUTH', name: 'Brutal Truth', description: 'Received NEEDS WORK three times. You kept showing up.', category: 'practice', isPrestige: false },
  { slug: 'RUBBER_DUCK', name: 'Rubber Duck', description: 'Completed three CHAT kata. You think by writing.', category: 'practice', isPrestige: false },
  { slug: 'SQL_SURVIVOR', name: 'SQL Survivor', description: 'Completed three kata involving SQL.', category: 'mastery', isPrestige: false },
  { slug: '5_STREAK', name: '5 Streak', description: 'Practiced five consecutive days.', category: 'consistency', isPrestige: false },
  { slug: 'CONSISTENT', name: 'Consistent', description: 'Thirty consecutive days of practice.', category: 'consistency', isPrestige: false },
  { slug: 'SENSEI_APPROVED', name: 'Sensei Approved', description: 'Received a clean PASSED verdict five times.', category: 'mastery', isPrestige: false },
  { slug: 'ARCHITECT', name: 'Architect', description: 'Completed ten WHITEBOARD kata.', category: 'architect', isPrestige: false },
  { slug: 'UNDEFINED_NO_MORE', name: 'Undefined No More', description: "Fifty kata completed. You're not undefined anymore. The cursor disagrees and keeps blinking.", category: 'mastery', isPrestige: true },
  { slug: 'COURSE_TYPESCRIPT_FUNDAMENTALS', name: 'TypeScript Fundamentals', description: 'Completed every step of the TypeScript Fundamentals course.', category: 'mastery', isPrestige: false },
  { slug: 'COURSE_JAVASCRIPT_DOM_FUNDAMENTALS', name: 'DOM Wrangler', description: 'Completed every step of the JavaScript DOM Fundamentals course.', category: 'mastery', isPrestige: false },
  { slug: 'COURSE_SQL_DEEP_CUTS', name: 'SQL Deep Cuts', description: 'Completed every step of the SQL Deep Cuts course.', category: 'mastery', isPrestige: false },
]

const CATEGORY_ORDER = ['practice', 'consistency', 'mastery', 'architect'] as const
type Filter = 'all' | 'earned' | 'locked'

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  earned: 'Earned',
  locked: 'Locked',
}

export function BadgesPage() {
  const { user } = useAuth()
  const [earnedSlugs, setEarnedSlugs] = useState<Map<string, string>>(new Map())
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.username) return
    api
      .getPublicProfile(user.username)
      .then((profile) => {
        const map = new Map<string, string>()
        for (const b of profile.badges) map.set(b.slug, b.earnedAt)
        setEarnedSlugs(map)
      })
      .finally(() => setLoading(false))
  }, [user?.username])

  const badges: Badge[] = useMemo(
    () =>
      ALL_BADGES.map((b) => ({
        ...b,
        earned: earnedSlugs.has(b.slug),
        earnedAt: earnedSlugs.get(b.slug) ?? null,
      })),
    [earnedSlugs],
  )

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h1 className="text-primary text-2xl md:text-[32px] font-semibold leading-tight tracking-tight">
            Badges
          </h1>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  const earnedCount = badges.filter((b) => b.earned).length
  const filtered =
    filter === 'earned'
      ? badges.filter((b) => b.earned)
      : filter === 'locked'
        ? badges.filter((b) => !b.earned)
        : badges

  return (
    <div className="px-4 md:px-6 py-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between gap-4 mb-6">
        <h1 className="text-primary text-2xl md:text-[32px] font-semibold leading-tight tracking-tight">
          Badges
        </h1>
        <div className="text-right shrink-0">
          <span className="block font-mono text-2xl text-primary tabular-nums leading-none">
            {earnedCount}
          </span>
          <span className="block text-muted text-[13px] mt-1">of {badges.length} earned</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8" role="tablist" aria-label="Badge filter">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`font-mono text-[11px] tracking-[0.08em] uppercase px-3 py-1.5 rounded-sm border transition-colors ${
              filter === f
                ? 'border-accent text-accent'
                : 'border-border text-muted hover:text-secondary'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const catBadges = filtered.filter((b) => b.category === cat)
        if (catBadges.length === 0) return null
        const regular = catBadges.filter((b) => !b.isPrestige)
        const prestige = catBadges.filter((b) => b.isPrestige)
        return (
          <section key={cat} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted">
                {cat}
              </p>
              <span className="flex-1 h-px bg-border" />
            </div>
            {regular.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {regular.map((badge) => (
                  <BadgeCard key={badge.slug} badge={badge} />
                ))}
              </div>
            )}
            {prestige.length > 0 && (
              <div className="flex flex-col gap-4 mt-4">
                {prestige.map((badge) => (
                  <PrestigeBadgeCard key={badge.slug} badge={badge} />
                ))}
              </div>
            )}
          </section>
        )
      })}

      <p className="text-center text-muted text-[10px] font-mono tracking-[0.08em] uppercase mt-12 opacity-70">
        Badges are earned in the dojo. There are no shortcuts.
      </p>
    </div>
  )
}

function BadgeCard({ badge }: { badge: Badge }) {
  const earnedDate = badge.earnedAt
    ? new Date(badge.earnedAt).toISOString().slice(0, 10)
    : null

  return (
    <div
      className={`bg-surface border border-border rounded-md p-6 min-h-50 flex flex-col justify-between ${
        badge.earned ? '' : 'opacity-50'
      }`}
    >
      <div>
        <h3
          className={`font-mono text-lg font-bold tracking-[0.04em] uppercase mb-2 ${
            badge.earned ? 'text-primary' : 'text-muted'
          }`}
        >
          {badge.name}
        </h3>
        <p className={`text-[13px] leading-relaxed ${badge.earned ? 'text-secondary' : 'text-muted'}`}>
          {badge.description}
        </p>
      </div>
      <p
        className={`font-mono text-[11px] tracking-[0.08em] uppercase mt-4 ${
          badge.earned ? 'text-muted' : 'text-muted/60 text-center'
        }`}
      >
        {earnedDate ? `Earned ${earnedDate}` : '—'}
      </p>
    </div>
  )
}

function PrestigeBadgeCard({ badge }: { badge: Badge }) {
  const earnedDate = badge.earnedAt
    ? new Date(badge.earnedAt).toISOString().slice(0, 10)
    : null

  return (
    <div
      className={`bg-surface border border-border border-l-2 border-l-accent rounded-md p-6 md:p-8 ${
        badge.earned ? '' : 'opacity-50'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3
            className={`font-mono text-2xl md:text-[32px] font-bold tracking-[0.04em] uppercase leading-none mb-3 ${
              badge.earned ? 'text-primary' : 'text-muted'
            }`}
          >
            {badge.name}
          </h3>
          <p className={`text-[13px] leading-relaxed ${badge.earned ? 'text-secondary' : 'text-muted'}`}>
            {badge.description}
          </p>
        </div>
        <p
          className={`font-mono text-[11px] tracking-[0.08em] uppercase shrink-0 ${
            badge.earned ? 'text-muted' : 'text-muted/60'
          }`}
        >
          {earnedDate ? `Earned ${earnedDate}` : '—'}
        </p>
      </div>
    </div>
  )
}
