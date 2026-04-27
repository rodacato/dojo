import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { PageLoader } from '../components/PageLoader'
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

const ALL_BADGES: Array<{ slug: string; name: string; description: string; category: string; isPrestige: boolean }> = [
  { slug: 'FIRST_KATA', name: 'First Kata', description: 'Completed your first kata in the dojo.', category: 'practice', isPrestige: false },
  { slug: '5_STREAK', name: '5 Day Streak', description: 'Practiced five consecutive days.', category: 'consistency', isPrestige: false },
  { slug: 'POLYGLOT', name: 'Polyglot', description: 'Completed kata across all three types: CODE, CHAT, and WHITEBOARD.', category: 'mastery', isPrestige: false },
  { slug: 'ARCHITECT', name: 'Architect', description: 'Completed three or more WHITEBOARD kata.', category: 'mastery', isPrestige: false },
  { slug: 'RUBBER_DUCK', name: 'Rubber Duck', description: 'Completed three CHAT kata. You think by writing.', category: 'practice', isPrestige: false },
  { slug: 'BRUTAL_TRUTH', name: 'Brutal Truth', description: 'Received NEEDS WORK three times. You keep showing up.', category: 'practice', isPrestige: false },
  { slug: 'SENSEI_APPROVED', name: 'Sensei Approved', description: 'Received a clean PASSED verdict five times.', category: 'mastery', isPrestige: false },
  { slug: 'SQL_SURVIVOR', name: 'SQL Survivor', description: 'Completed three kata involving SQL.', category: 'practice', isPrestige: false },
  { slug: 'CONSISTENT', name: 'Consistent', description: 'Thirty consecutive days of practice.', category: 'consistency', isPrestige: true },
  { slug: 'UNDEFINED_NO_MORE', name: 'Undefined No More', description: 'Completed fifty kata. You are no longer undefined.', category: 'mastery', isPrestige: true },
  { slug: 'COURSE_TYPESCRIPT_FUNDAMENTALS', name: 'TypeScript Fundamentals', description: 'Completed every step of the TypeScript Fundamentals course.', category: 'mastery', isPrestige: false },
  { slug: 'COURSE_JAVASCRIPT_DOM_FUNDAMENTALS', name: 'DOM Wrangler', description: 'Completed every step of the JavaScript DOM Fundamentals course.', category: 'mastery', isPrestige: false },
  { slug: 'COURSE_SQL_DEEP_CUTS', name: 'SQL Deep Cuts', description: 'Completed every step of the SQL Deep Cuts course.', category: 'mastery', isPrestige: false },
]

type Filter = 'all' | 'earned' | 'locked'

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

  if (loading) return <PageLoader />

  const badges: Badge[] = ALL_BADGES.map((b) => ({
    ...b,
    earned: earnedSlugs.has(b.slug),
    earnedAt: earnedSlugs.get(b.slug) ?? null,
  }))

  const earnedCount = badges.filter((b) => b.earned).length

  const filtered =
    filter === 'earned'
      ? badges.filter((b) => b.earned)
      : filter === 'locked'
        ? badges.filter((b) => !b.earned)
        : badges

  return (
    <div className="min-h-screen bg-page px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-mono text-2xl text-primary mb-1">Badges</h1>
          <p className="text-muted text-sm">
            {earnedCount} of {badges.length} earned
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-1 bg-surface border border-border/40 rounded-md p-1">
          {(['all', 'earned', 'locked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-mono rounded-sm transition-colors ${
                filter === f ? 'bg-accent text-primary' : 'text-muted hover:text-secondary'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Badges grouped by category */}
      {(['practice', 'consistency', 'mastery'] as const).map((cat) => {
        const catBadges = filtered.filter((b) => b.category === cat)
        if (catBadges.length === 0) return null
        const catRegular = catBadges.filter((b) => !b.isPrestige)
        const catPrestige = catBadges.filter((b) => b.isPrestige)
        return (
          <div key={cat} className="mb-8">
            <h2 className="text-muted text-[10px] font-mono uppercase tracking-widest mb-3">{cat}</h2>
            {catRegular.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {catRegular.map((badge) => (
                  <BadgeCard key={badge.slug} badge={badge} />
                ))}
              </div>
            )}
            {catPrestige.length > 0 && (
              <div className="space-y-4">
                {catPrestige.map((badge) => (
                  <PrestigeBadgeCard key={badge.slug} badge={badge} />
                ))}
              </div>
            )}
          </div>
        )
      })}

      <p className="text-center text-muted/40 text-xs font-mono mt-12">
        Badges are earned in the dojo. There are no shortcuts.
      </p>
    </div>
  )
}

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div
      className={`rounded-md p-5 border transition-all ${
        badge.earned
          ? 'bg-surface border-accent/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
          : 'bg-surface/50 border-border/20 opacity-40'
      }`}
    >
      <p className={`font-mono text-sm mb-1 ${badge.earned ? 'text-primary' : 'text-muted'}`}>
        {badge.name}
      </p>
      <p className={`text-xs leading-relaxed ${badge.earned ? 'text-secondary' : 'text-muted/60'}`}>
        {badge.description}
      </p>
      {badge.earned && badge.earnedAt && (
        <p className="text-muted text-[10px] font-mono mt-2">
          {new Date(badge.earnedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

function PrestigeBadgeCard({ badge }: { badge: Badge }) {
  return (
    <div
      className={`rounded-md p-6 border w-full transition-all ${
        badge.earned
          ? 'bg-surface border-accent/40 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
          : 'bg-surface/50 border-border/20 opacity-40'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-mono text-lg mb-1 ${badge.earned ? 'text-primary' : 'text-muted'}`}>
            {badge.name}
          </p>
          <p className={`text-sm leading-relaxed ${badge.earned ? 'text-secondary' : 'text-muted/60'}`}>
            {badge.description}
          </p>
        </div>
        {badge.earned && badge.earnedAt && (
          <p className="text-muted text-xs font-mono shrink-0 ml-4">
            {new Date(badge.earnedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
}
