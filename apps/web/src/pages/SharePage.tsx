import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API_URL } from '../lib/config'
import { api, ApiError } from '../lib/api'
import type { ShareData } from '../lib/api'
import { PublicPageLayout } from '../components/PublicPageLayout'
import { PageLoader } from '../components/PageLoader'
import { ErrorPanel } from '../components/ui/ErrorPanel'
import { LogoMark } from '../components/Logo'
import { PersonaEyebrow } from '../components/ui/PersonaEyebrow'
import { Button, buttonClasses } from '../components/ui/Button'
import { isVerdict, VERDICT_LABELS, VERDICT_TEXT } from '../lib/verdict'

export function SharePage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const [data, setData] = useState<ShareData | null>(null)
  const [error, setError] = useState<'notfound' | 'network' | null>(null)
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    setError(null)
    api
      .getShareCard(sessionId)
      .then((d) => { if (!cancelled) setData(d) })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError && err.status === 404 ? 'notfound' : 'network')
      })
    return () => { cancelled = true }
  }, [sessionId, retryTick])

  if (error === 'notfound') {
    return (
      <PublicPageLayout hideCta>
        <ErrorPanel
          code="ERR · 404 · NOT FOUND"
          title="That isn't here."
          actions={<Link to="/" className={buttonClasses({ size: 'lg' })}>Enter the dojo</Link>}
        >
          <p className="paper-body max-w-xl">This kata result doesn't exist or isn't public yet.</p>
        </ErrorPanel>
      </PublicPageLayout>
    )
  }

  if (error === 'network') {
    return (
      <PublicPageLayout hideCta>
        <ErrorPanel
          code="ERROR"
          title="Something went wrong."
          actions={
            <>
              <Button size="lg" onClick={() => setRetryTick((n) => n + 1)}>Try again</Button>
              <Link to="/" className={buttonClasses({ variant: 'ghost', size: 'lg' })}>Go home</Link>
            </>
          }
        >
          <p className="paper-body max-w-xl">We couldn't load this share card.</p>
        </ErrorPanel>
      </PublicPageLayout>
    )
  }

  if (!data) return <PageLoader />

  const { verdict } = data
  const verdictLabel = isVerdict(verdict) ? VERDICT_LABELS[verdict] : verdict.replaceAll('_', ' ').toUpperCase()
  const verdictColor = isVerdict(verdict) ? VERDICT_TEXT[verdict] : 'text-warning-text'
  const ogImageUrl = `${API_URL}/share/${sessionId}.png`

  return (
    <>
      <title>{`${verdictLabel} — ${data.kataTitle} | dojo_`}</title>
      <meta property="og:title" content={`${verdictLabel} — ${data.kataTitle}`} />
      <meta property="og:description" content={data.pullQuote ?? `Kata result by @${data.username}`} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:type" content="article" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${verdictLabel} — ${data.kataTitle} | dojo_`} />
      <meta name="twitter:description" content={data.pullQuote ?? `Kata result by @${data.username}`} />
      <meta name="twitter:image" content={ogImageUrl} />

      <PublicPageLayout hideCta>
        <div className="w-full max-w-180 mx-auto px-4 md:px-0 pt-12 md:pt-20 pb-16">
          <p className="paper-eyebrow mb-4">Shared kata</p>

          <article className="bg-surface border border-border rounded-sm px-5 py-12 md:p-12 text-center flex flex-col items-center">
            <LogoMark size={40} className="text-accent mb-6" />
            <h1
              className={`font-mono text-4xl md:text-5xl font-bold tracking-tight uppercase leading-none ${verdictColor}`}
            >
              {verdictLabel}
            </h1>

            <h2 className="text-primary text-2xl leading-tight mt-4 md:mt-6">
              {data.kataTitle}
            </h2>
            <div className="mt-2 flex items-center gap-3 font-mono text-xs tracking-[0.08em] uppercase text-secondary">
              <span>{data.kataType}</span>
              <span aria-hidden>·</span>
              <span>{data.difficulty}</span>
              {data.completionMinutes != null && (
                <>
                  <span aria-hidden>·</span>
                  <span>{data.completionMinutes} min</span>
                </>
              )}
            </div>

            {data.pullQuote && (
              <blockquote className="mt-6 md:mt-8 max-w-lg">
                <p className="text-secondary text-lg md:text-xl italic leading-relaxed">
                  <span aria-hidden>&ldquo;</span>
                  <span>{data.pullQuote}</span>
                  <span aria-hidden>&rdquo;</span>
                </p>
              </blockquote>
            )}

            {data.ownerRole && (
              <PersonaEyebrow role={data.ownerRole} className="mt-6 md:mt-8 block" />
            )}

            <div className="flex items-center gap-2 mt-3">
              <img
                src={data.avatarUrl}
                alt=""
                aria-hidden
                className="w-8 h-8 rounded-full bg-elevated"
              />
              <span className="text-secondary text-base">@{data.username}</span>
            </div>

            <Link
              to="/"
              className={`${buttonClasses({ variant: 'primary', size: 'lg' })} w-full mt-6 md:mt-8`}
            >
              Find yours. Enter the dojo →
            </Link>
            <p className="text-secondary text-xs font-mono tracking-[0.04em] mt-3">
              Daily practice. Self-hosted. {globalThis.location.host}
            </p>
          </article>

          <p className="paper-eyebrow text-center mt-6">
            kata_id: {sessionId?.slice(0, 6) ?? ''}
          </p>
        </div>

        {/* OG image preview (hidden, for crawlers that render) */}
        <img src={ogImageUrl} alt="" className="hidden" />
      </PublicPageLayout>
    </>
  )
}
