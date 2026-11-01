import { useRef } from 'react'
import { Link } from 'react-router-dom'
import type { ScrollEntryDTO } from '@dojo/shared'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../context/AuthContext'
import { LoadState } from '../components/ui/LoadState'
import { SkeletonCard } from '../components/ui/SkeletonLoader'
import { pickLocalized, preferredLocale } from '../lib/scrollLocale'

const LOAD_ERROR = 'The scrolls could not be loaded.'

const STATUS = 'border-t border-border pt-7 text-center'

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
        <h2 className="text-primary text-[21px] md:text-xl font-bold leading-[1.4] tracking-[-0.02em] wrap-anywhere group-hover:text-accent-text transition-colors">
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

function ScrollsList({ scrolls }: Readonly<{ scrolls: ScrollEntryDTO[] }>) {
  const locale = preferredLocale()

  return (
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
  )
}

export function ScrollsPage() {
  const { data: scrolls, loading, error, reload } = useAsync(() => api.getScrolls(), [])
  const { user, loading: authLoading } = useAuth()
  const anonymous = !authLoading && !user
  const headingRef = useRef<HTMLHeadingElement>(null)

  function retry() {
    headingRef.current?.focus()
    reload()
  }

  function renderCatalog() {
    if (loading || authLoading) {
      return (
        <div className={STATUS}>
          <LoadState status="loading" eyebrow="Loading scrolls">
            <SkeletonCard />
          </LoadState>
        </div>
      )
    }
    if (error || !scrolls) {
      return (
        <div className={STATUS}>
          <LoadState
            status="error"
            flush
            eyebrow="Scrolls"
            title={LOAD_ERROR}
            retryVariant={anonymous ? 'ghost' : 'primary'}
            onRetry={retry}
          />
        </div>
      )
    }
    if (scrolls.length === 0) {
      return (
        <section className={STATUS}>
          <p className="paper-eyebrow">Empty · Scrolls</p>
          <h2 className="text-primary text-[22px] md:text-xl font-bold leading-[1.4] mt-3">
            {anonymous ? 'No public scrolls are available here.' : 'No scrolls are published yet.'}
          </h2>
          <p className="paper-body mt-4 max-w-[35rem] mx-auto">
            Scrolls are small apps the operator of this instance adds.
          </p>
        </section>
      )
    }
    return <ScrollsList scrolls={scrolls} />
  }

  return (
    <div className="paper-container py-8 md:py-12">
      <div className="max-w-[57.5rem]">
        <header className="max-w-[46.25rem] mb-7 md:mb-9">
          <p className="paper-eyebrow mb-3">Scrolls</p>
          <h1 ref={headingRef} tabIndex={-1} className="paper-heading focus:outline-none">
            Small apps that teach one thing well.
          </h1>
          {anonymous && (
            <p className="paper-body mt-5 max-w-[35rem]">
              Public scrolls are open without an account.
            </p>
          )}
        </header>
        {renderCatalog()}
      </div>
    </div>
  )
}
