import { Link } from 'react-router-dom'
import type { ScrollEntryDTO } from '@dojo/shared'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { PageLoader } from '../components/PageLoader'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { pickLocalized, preferredLocale } from '../lib/scrollLocale'

function ScrollRow({ entry, locale }: Readonly<{ entry: ScrollEntryDTO; locale: string }>) {
  const { slug, visibility, manifest } = entry
  const languages = manifest.programmingLanguages
  const instanceOnly = visibility === 'private'

  return (
    <Link
      to={`/scrolls/${slug}`}
      className="group ruled-row items-baseline gap-6 py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="min-w-0">
        <h2 className="text-primary text-[1.3125rem] md:text-2xl font-bold leading-[1.4] tracking-[-0.02em] wrap-anywhere group-hover:text-accent-text transition-colors">
          {pickLocalized(manifest.title, manifest.locales, locale)}
        </h2>
        <p className="paper-body mt-2.5 max-w-[41.25rem] wrap-anywhere">
          {pickLocalized(manifest.description, manifest.locales, locale)}
        </p>
        {(languages.length > 0 || instanceOnly) && (
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mt-4">
            {languages.length > 0 && <p className="paper-eyebrow">{languages.join(' · ')}</p>}
            {instanceOnly && (
              <p className={`paper-note ${languages.length > 0 ? 'pl-3 border-l border-border' : ''}`}>
                Instance access
              </p>
            )}
          </div>
        )}
      </div>
      <span aria-hidden className="shrink-0 font-mono text-xl leading-none text-accent-text">
        →
      </span>
    </Link>
  )
}

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
      <header className="max-w-[46.25rem] mb-7 md:mb-9">
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
        <>
          <p className="paper-note pb-3.5">
            {scrolls.length} {scrolls.length === 1 ? 'scroll' : 'scrolls'}
          </p>
          <ul aria-label="Scrolls" className="border-t border-border">
            {scrolls.map((entry) => (
              <li key={entry.id}>
                <ScrollRow entry={entry} locale={locale} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
