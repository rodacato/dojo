import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { PublicPageLayout } from '../components/PublicPageLayout'
import { PageLoader } from '../components/PageLoader'
import { useAuth } from '../context/AuthContext'
import { buttonClasses } from '../components/ui/Button'
import type { ScrollDTO } from '@dojo/shared'

export function ScrollsPage() {
  const { user } = useAuth()
  const [scrolls, setScrolls] = useState<ScrollDTO[] | null>(null)

  useEffect(() => {
    api.getScrolls().then(setScrolls).catch(() => setScrolls([]))
  }, [])

  if (!scrolls) return <PageLoader />

  return (
    <PublicPageLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Hero */}
        <section className="mb-12 md:mb-16">
          <p className="font-mono text-xs tracking-[0.08em] uppercase text-accent mb-4">
            Free scrolls
          </p>
          <h1 className="text-primary text-3xl md:text-5xl font-semibold leading-tight tracking-tight max-w-3xl">
            Learn deliberately. No AI helping you cheat.
          </h1>
          <p className="text-secondary text-base md:text-lg leading-relaxed mt-4 max-w-2xl">
            Step-by-step scrolls on the things you keep delegating. Free. No account required to
            begin. Progress merges into your account if you sign in later.
          </p>
          <p className="font-mono text-xs tracking-[0.04em] text-muted mt-3">
            Anonymous progress is held in your browser — visible only to you.
          </p>
        </section>

        {/* Catalog */}
        {scrolls.length === 0 ? (
          <div className="bg-surface border border-border rounded-md py-16 px-4 text-center">
            <p className="font-mono text-xs tracking-[0.08em] uppercase text-muted mb-2">
              Empty
            </p>
            <p className="text-secondary text-base">No scrolls available yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {scrolls.map((scroll) => (
              <ScrollCard key={scroll.id} scroll={scroll} showVisibilityBadges={!!user} />
            ))}
          </div>
        )}

        {/* Promo band */}
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

function ScrollCard({
  scroll,
  showVisibilityBadges,
}: {
  scroll: ScrollDTO
  showVisibilityBadges: boolean
}) {
  const isDraft = showVisibilityBadges && scroll.status === 'draft'
  const isPrivate = showVisibilityBadges && !scroll.isPublic

  return (
    <Link
      to={`/scrolls/${scroll.slug}`}
      className={`group bg-surface border border-border rounded-md p-6 flex flex-col gap-3 hover:border-accent transition-colors min-h-70 ${
        isDraft || isPrivate ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap">
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
        {isDraft && (
          <span className="font-mono text-xs tracking-[0.08em] uppercase text-warning border border-warning/40 bg-warning/10 px-2 py-1 rounded-sm">
            Draft
          </span>
        )}
        {isPrivate && !isDraft && (
          <span className="font-mono text-xs tracking-[0.08em] uppercase text-muted border border-border px-2 py-1 rounded-sm">
            Private
          </span>
        )}
      </div>
      <h3 className="text-primary text-2xl font-semibold leading-tight tracking-tight group-hover:text-accent transition-colors">
        {scroll.title}
      </h3>
      <p className="text-secondary text-sm leading-relaxed flex-1 line-clamp-3">
        {scroll.description}
      </p>
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="font-mono text-xs tracking-[0.08em] uppercase text-muted">
          {scroll.lessonCount} lessons · {scroll.stepCount} steps
        </span>
        <span aria-hidden className="text-accent text-lg leading-none">→</span>
      </div>
    </Link>
  )
}
