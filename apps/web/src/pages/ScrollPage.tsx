import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { useScrollProgress } from '../hooks/useScrollProgress'
import { useAuth } from '../context/AuthContext'
import { useScrollExecution } from '../hooks/useScrollExecution'
import { PageLoader } from '../components/PageLoader'
import { ScrollFrame } from '../components/ScrollFrame'
import { ErrorState } from '../components/ui/ErrorState'
import { pickLocalized, preferredLocale } from '../lib/scrollLocale'
import { scrollOriginOf, withHostParam } from '../lib/scrollHost'

function Unavailable({ message }: Readonly<{ message: string }>) {
  return (
    <ErrorState
      variant="inline"
      kind="not-found"
      title="This scroll is not available."
      message={message}
      primaryAction={{ label: 'Browse scrolls', to: '/scrolls' }}
    />
  )
}

export function ScrollPage() {
  const { slug = '' } = useParams()
  const { user, loading: authLoading } = useAuth()
  const { data: scroll, loading, error, reload } = useAsync(() => api.getScroll(slug), [slug, user?.id])
  const headingRef = useRef<HTMLHeadingElement>(null)
  const tracksProgress = Boolean(scroll?.manifest.capabilities.includes('progress'))
  const progress = useScrollProgress({
    slug: scroll?.slug ?? null,
    enabled: tracksProgress && !authLoading,
    authenticated: user !== null,
  })
  const execution = useScrollExecution(slug, user !== null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [scroll?.id, progress.status])

  if (authLoading || loading || !execution.ready) return <PageLoader />

  if (error instanceof ApiError && error.status === 401) {
    return (
      <ErrorState
        kind="unauthorized"
        variant="inline"
        message="This scroll is private. Sign in to open it."
        primaryAction={{ label: 'Sign in', to: '/' }}
      />
    )
  }
  if (error instanceof ApiError && error.status === 404) {
    return <Unavailable message="It may have been unpublished, or the link is wrong." />
  }
  if (error || !scroll) {
    return (
      <ErrorState
        kind="generic"
        variant="inline"
        message="The scroll could not be loaded."
        primaryAction={{ label: 'Try again', onClick: reload }}
      />
    )
  }

  const { manifest } = scroll
  const origin = scrollOriginOf(manifest.entry)
  if (!origin) return <Unavailable message="This scroll has no valid address to load from." />

  if (progress.status === 'loading') return <PageLoader />
  if (progress.status === 'error') {
    return (
      <ErrorState
        kind="generic"
        variant="inline"
        message="Your progress in this scroll could not be loaded, so it was not opened."
        primaryAction={{ label: 'Try again', onClick: progress.retry }}
      />
    )
  }

  const locale = preferredLocale()
  const title = pickLocalized(manifest.title, manifest.locales, locale)
  const description = pickLocalized(manifest.description, manifest.locales, locale)

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <Link to="/scrolls" className="font-mono text-xs uppercase tracking-wider text-muted hover:text-secondary transition-colors">
        ← Scrolls
      </Link>
      <header className="mt-4 mb-6">
        <h1 ref={headingRef} tabIndex={-1} className="text-primary text-2xl md:text-3xl font-semibold leading-tight outline-none">
          {title}
        </h1>
        <p className="text-secondary text-base leading-relaxed mt-2 max-w-2xl">{description}</p>
      </header>
      <ScrollFrame
        title={title}
        src={withHostParam(manifest.entry, globalThis.location.origin)}
        origin={origin}
        manifest={manifest}
        authenticated={user !== null}
        initial={progress.initial}
        onProgress={tracksProgress ? progress.onProgress : undefined}
        onComplete={tracksProgress ? progress.onComplete : undefined}
        allowRun={execution.allowRun}
        onRun={execution.run}
      />
    </div>
  )
}
