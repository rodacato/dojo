import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { API_URL } from '../lib/config'
import { PublicPageLayout } from '../components/PublicPageLayout'
import { PageLoader } from '../components/PageLoader'
import { useAuth } from '../context/AuthContext'
import { buttonClasses } from '../components/ui/Button'
import { getAnonymousId } from '../lib/anonymousId'
import type { ScrollDTO } from '@dojo/shared'

// The five crash-language scrolls are a closed set (ADR 022). Grouping the
// catalog by kind keys off that invariant — anything outside the set is a
// topic scroll. Encoding the closed set as a constant is honest, not brittle:
// adding a sixth language requires dropping one, and that touches this line.
const LANGUAGE_SCROLL_LANGS = new Set(['ruby', 'go', 'python', 'rust', 'typescript'])

type ScrollState = 'not-started' | 'in-progress' | 'completed'
type FilterKey = 'all' | ScrollState

const STATE_META: Record<ScrollState, { label: string; glyph: string; chip: string; cta: string }> = {
  'not-started': { label: 'Not started', glyph: '◇', chip: 'text-muted border-border', cta: 'Start' },
  'in-progress': { label: 'In progress', glyph: '◐', chip: 'text-accent border-accent/40', cta: 'Continue' },
  completed: { label: 'Completed', glyph: '✓', chip: 'text-success border-success/40', cta: 'Review' },
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'not-started', label: 'Not started' },
]

function deriveState(completedSteps: number, totalSteps: number): ScrollState {
  if (totalSteps > 0 && completedSteps >= totalSteps) return 'completed'
  if (completedSteps > 0) return 'in-progress'
  return 'not-started'
}

export function ScrollsPage() {
  const { user } = useAuth()
  const [scrolls, setScrolls] = useState<ScrollDTO[] | null>(null)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState<FilterKey>('all')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.getScrolls(),
      // Anon callers without a stored session legitimately have no progress —
      // getAllProgress returns [] and the catalog reads "not started".
      api.getAllProgress(user ? undefined : (getAnonymousId() ?? undefined)).catch(() => []),
    ])
      .then(([scrollList, progressList]) => {
        if (cancelled) return
        setScrolls(scrollList)
        setProgress(Object.fromEntries(progressList.map((p) => [p.scrollId, p.completedStepCount])))
      })
      .catch(() => {
        if (!cancelled) setScrolls([])
      })
    return () => {
      cancelled = true
    }
  }, [user])

  if (!scrolls) return <PageLoader />

  const withState = scrolls.map((scroll) => ({
    scroll,
    state: deriveState(progress[scroll.id] ?? 0, scroll.stepCount),
  }))

  const counts = withState.reduce(
    (acc, { state }) => ({ ...acc, [state]: acc[state] + 1 }),
    { 'not-started': 0, 'in-progress': 0, completed: 0 } as Record<ScrollState, number>,
  )

  const visible = withState.filter(({ state }) => filter === 'all' || state === filter)
  const languages = visible.filter(({ scroll }) => LANGUAGE_SCROLL_LANGS.has(scroll.language))
  const topics = visible.filter(({ scroll }) => !LANGUAGE_SCROLL_LANGS.has(scroll.language))
  const totalSteps = scrolls.reduce((sum, s) => sum + s.stepCount, 0)

  let catalog: ReactNode
  if (scrolls.length === 0) {
    catalog = <EmptyState message="No scrolls available yet. Check back soon." />
  } else if (visible.length === 0) {
    catalog = <EmptyState message="No scrolls match this filter." />
  } else {
    catalog = (
      <div className="flex flex-col gap-12">
        {languages.length > 0 && <ScrollSection title="Languages" items={languages} />}
        {topics.length > 0 && <ScrollSection title="Topics" items={topics} />}
      </div>
    )
  }

  return (
    <PublicPageLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Hero */}
        <section className="mb-8 md:mb-10">
          <p className="font-mono text-xs tracking-[0.08em] uppercase text-accent mb-4">Free scrolls</p>
          <h1 className="text-primary text-3xl md:text-5xl font-semibold leading-tight tracking-tight max-w-3xl">
            Learn deliberately. No AI helping you cheat.
          </h1>
          <p className="text-secondary text-base md:text-lg leading-relaxed mt-4 max-w-2xl">
            Step-by-step scrolls on the things you keep delegating. Free. No account required —
            start any scroll, in any order, right now.
          </p>
          {scrolls.length > 0 && (
            <p className="font-mono text-xs tracking-[0.04em] text-muted mt-4">
              {scrolls.length} scrolls · {totalSteps} steps
            </p>
          )}
        </section>

        {/* Anonymous: offer to save progress without gating the work */}
        {!user && (
          <section className="mb-8 bg-surface border border-border rounded-md px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-secondary text-sm leading-relaxed">
              <span className="font-mono text-xs tracking-[0.08em] uppercase text-muted mr-2">
                Progress
              </span>{' '}
              Saved in this browser. Sign in to keep it across devices — you can keep going either way.
            </p>
            <a
              href={`${API_URL}/auth/github`}
              className={buttonClasses({ variant: 'ghost', size: 'sm' })}
            >
              Sign in to save
            </a>
          </section>
        )}

        {/* Filters */}
        {scrolls.length > 0 && (
          <nav className="flex flex-wrap gap-2 mb-8" aria-label="Filter scrolls by progress">
            {FILTERS.map(({ key, label }) => {
              const count = key === 'all' ? withState.length : counts[key]
              const active = filter === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  aria-pressed={active}
                  className={`font-mono text-xs tracking-[0.06em] uppercase px-3 py-1.5 rounded-sm border transition-colors ${
                    active
                      ? 'text-primary border-accent bg-accent/10'
                      : 'text-muted border-border hover:text-secondary'
                  }`}
                >
                  {label} <span className="text-muted">{count}</span>
                </button>
              )
            })}
          </nav>
        )}

        {/* Catalog */}
        {catalog}

        {/* Kata invite — distinct from the sign-in-to-save offer above */}
        <section className="mt-12 md:mt-16 bg-surface border border-border rounded-md p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="md:flex-1">
            <p className="font-mono text-xs tracking-[0.08em] uppercase text-muted mb-2">
              Ready for more?
            </p>
            <h2 className="text-primary text-xl md:text-2xl font-semibold leading-tight tracking-tight">
              Step into the dojo.
            </h2>
            <p className="text-secondary text-sm mt-1">
              Daily kata. Brutally honest sensei evaluation. No AI inside the kata.
            </p>
          </div>
          <Link to="/" className={buttonClasses({ variant: 'primary', size: 'md' })}>
            Request invite →
          </Link>
        </section>
      </div>
    </PublicPageLayout>
  )
}

function ScrollSection({
  title,
  items,
}: Readonly<{
  title: string
  items: { scroll: ScrollDTO; state: ScrollState }[]
}>) {
  return (
    <section>
      <h2 className="font-mono text-xs tracking-[0.08em] uppercase text-muted mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {items.map(({ scroll, state }) => (
          <ScrollCard key={scroll.id} scroll={scroll} state={state} />
        ))}
      </div>
    </section>
  )
}

function ScrollCard({ scroll, state }: Readonly<{ scroll: ScrollDTO; state: ScrollState }>) {
  const meta = STATE_META[state]
  return (
    <Link
      to={`/scrolls/${scroll.slug}`}
      className="group bg-surface border border-border rounded-md p-6 flex flex-col gap-3 hover:border-accent transition-colors min-h-70"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="font-mono text-xs tracking-[0.08em] uppercase border px-2 py-1 rounded-sm"
          style={{
            color: scroll.accentColor,
            borderColor: `${scroll.accentColor}66`,
            backgroundColor: `${scroll.accentColor}1a`,
          }}
        >
          {scroll.language}
        </span>
        <span
          className={`font-mono text-xs tracking-[0.06em] uppercase border px-2 py-1 rounded-sm ${meta.chip}`}
        >
          <span aria-hidden>{meta.glyph}</span> {meta.label}
        </span>
      </div>
      <h3 className="text-primary text-2xl font-semibold leading-tight tracking-tight group-hover:text-accent transition-colors">
        {scroll.title}
      </h3>
      <p className="text-secondary text-sm leading-relaxed flex-1 line-clamp-3">{scroll.description}</p>
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="font-mono text-xs tracking-[0.06em] uppercase text-muted">
          {scroll.lessonCount} lessons · {scroll.stepCount} steps
          {scroll.estimatedMinutes != null && ` · ~${scroll.estimatedMinutes} min`}
        </span>
        <span className="font-mono text-xs tracking-[0.08em] uppercase text-accent">{meta.cta} →</span>
      </div>
    </Link>
  )
}

function EmptyState({ message }: Readonly<{ message: string }>) {
  return (
    <div className="bg-surface border border-border rounded-md py-16 px-4 text-center">
      <p className="font-mono text-xs tracking-[0.08em] uppercase text-muted mb-2">Empty</p>
      <p className="text-secondary text-base">{message}</p>
    </div>
  )
}
