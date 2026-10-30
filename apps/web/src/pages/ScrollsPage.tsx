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
    <div className="paper-container py-8 md:py-12">
      <header className="mb-10">
        <p className="paper-eyebrow mb-3">Scrolls</p>
        <h1 className="paper-heading">
          Small apps that teach one thing well.
        </h1>
      </header>

      {scrolls.length === 0 ? (
        <EmptyState
          variant="inline"
          eyebrow="Empty · Scrolls"
          headline="No scrolls are published yet."
          microcopy="Scrolls are small apps the operator of this instance adds."
        />
      ) : (
        <ul aria-label="Scrolls" className="border-y border-border divide-y divide-border">
          {scrolls.map(({ id, slug, manifest }) => (
            <li key={id}>
              <Link
                to={`/scrolls/${slug}`}
                className="group block py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <h2 className="text-primary text-xl font-bold leading-snug group-hover:text-accent-text transition-colors">
                  {pickLocalized(manifest.title, manifest.locales, locale)}
                </h2>
                <p className="paper-body mt-2 max-w-2xl">
                  {pickLocalized(manifest.description, manifest.locales, locale)}
                </p>
                {manifest.programmingLanguages.length > 0 && (
                  <p className="paper-eyebrow mt-4">
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
