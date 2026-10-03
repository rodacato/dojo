import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { PageLoader } from '../components/PageLoader'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { pickLocalized, preferredLocale } from '../lib/scrollLocale'

export function ScrollsPage() {
  const { data: scrolls, loading, error, reload } = useAsync(() => api.getScrolls(), [])

  if (loading) return <PageLoader />

  if (error || !scrolls) {
    return (
      <ErrorState
        kind="generic"
        variant="inline"
        message="The scrolls could not be loaded."
        primaryAction={{ label: 'Try again', onClick: reload }}
      />
    )
  }

  const locale = preferredLocale()

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <header className="mb-8">
        <p className="font-mono text-xs tracking-[0.08em] uppercase text-accent mb-3">Scrolls</p>
        <h1 className="text-primary text-2xl md:text-3xl font-semibold leading-tight">
          Small apps that teach one thing well.
        </h1>
      </header>

      {scrolls.length === 0 ? (
        <EmptyState
          eyebrow="Empty · Scrolls"
          headline="No scrolls are published yet."
          microcopy="Check back soon."
        />
      ) : (
        <ul aria-label="Scrolls" className="grid gap-4 sm:grid-cols-2">
          {scrolls.map(({ id, slug, manifest }) => (
            <li key={id}>
              <Link
                to={`/scrolls/${slug}`}
                className="block h-full rounded-md border border-border border-l-[3px] border-l-accent bg-surface p-5 transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <h2 className="text-primary text-lg font-semibold leading-snug">
                  {pickLocalized(manifest.title, manifest.locales, locale)}
                </h2>
                <p className="mt-2 text-sm text-secondary leading-relaxed">
                  {pickLocalized(manifest.description, manifest.locales, locale)}
                </p>
                {manifest.programmingLanguages.length > 0 && (
                  <p className="mt-4 font-mono text-xs uppercase tracking-wider text-muted">
                    {manifest.programmingLanguages.join(' · ')}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
