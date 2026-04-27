import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API_URL } from '../lib/config'
import { PublicPageLayout } from '../components/PublicPageLayout'
import { PageLoader } from '../components/PageLoader'
import { ErrorState } from '../components/ui/ErrorState'
import { PersonaEyebrow } from '../components/ui/PersonaEyebrow'
import { buttonClasses } from '../components/ui/Button'

interface ShareData {
  sessionId: string
  exerciseTitle: string
  exerciseType: string
  difficulty: string
  verdict: string
  pullQuote: string | null
  completionMinutes: number | null
  username: string
  avatarUrl: string
  ownerRole: string | null
}

const VERDICT_LABELS: Record<string, string> = {
  passed: 'PASSED',
  passed_with_notes: 'PASSED WITH NOTES',
  needs_work: 'NEEDS WORK',
}

const VERDICT_COLORS: Record<string, string> = {
  passed: 'text-success',
  passed_with_notes: 'text-warning',
  needs_work: 'text-danger',
}

export function SharePage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const [data, setData] = useState<ShareData | null>(null)
  const [error, setError] = useState<'notfound' | 'network' | null>(null)
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    setError(null)
    fetch(`${API_URL}/share/${sessionId}`)
      .then((r) => {
        if (cancelled) return
        if (r.status === 404) {
          setError('notfound')
          return null
        }
        if (!r.ok) {
          setError('network')
          return null
        }
        return r.json()
      })
      .then((d) => { if (!cancelled && d) setData(d as ShareData) })
      .catch(() => { if (!cancelled) setError('network') })
    return () => { cancelled = true }
  }, [sessionId, retryTick])

  if (error === 'notfound') {
    return (
      <ErrorState
        message="This kata result doesn't exist or isn't public yet."
        primaryAction={{ label: 'Enter the dojo', to: '/' }}
      />
    )
  }

  if (error === 'network') {
    return (
      <ErrorState
        message="We couldn't load this share card."
        primaryAction={{ label: 'Try again', onClick: () => setRetryTick((n) => n + 1) }}
        secondaryAction={{ label: 'Go home', to: '/' }}
      />
    )
  }

  if (!data) return <PageLoader />

  const verdictLabel = VERDICT_LABELS[data.verdict] ?? data.verdict.replace(/_/g, ' ').toUpperCase()
  const verdictColor = VERDICT_COLORS[data.verdict] ?? 'text-warning'
  const ogImageUrl = `${API_URL}/share/${sessionId}.png`

  return (
    <>
      <title>{`${verdictLabel} — ${data.exerciseTitle} | dojo_`}</title>
      <meta property="og:title" content={`${verdictLabel} — ${data.exerciseTitle}`} />
      <meta property="og:description" content={data.pullQuote ?? `Kata result by @${data.username}`} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:type" content="article" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${verdictLabel} — ${data.exerciseTitle} | dojo_`} />
      <meta name="twitter:description" content={data.pullQuote ?? `Kata result by @${data.username}`} />
      <meta name="twitter:image" content={ogImageUrl} />

      <PublicPageLayout>
        <div className="max-w-180 mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-16">
          <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted text-center mb-6">
            Shared kata
          </p>

          <article className="bg-surface border border-border rounded-md p-6 md:p-12 text-center flex flex-col items-center">
            {/* Verdict */}
            <h1
              className={`font-mono text-4xl md:text-[56px] font-bold tracking-tight uppercase leading-none ${verdictColor}`}
            >
              {verdictLabel}
            </h1>

            {/* Title + badges */}
            <h2 className="text-primary text-2xl font-semibold leading-tight tracking-tight mt-4 md:mt-6">
              {data.exerciseTitle}
            </h2>
            <div className="mt-2 flex items-center gap-3 font-mono text-[11px] tracking-[0.08em] uppercase text-muted">
              <span>{data.exerciseType}</span>
              <span aria-hidden>·</span>
              <span>{data.difficulty}</span>
              {data.completionMinutes != null && (
                <>
                  <span aria-hidden>·</span>
                  <span>{data.completionMinutes} min</span>
                </>
              )}
            </div>

            {/* Pull quote */}
            {data.pullQuote && (
              <blockquote className="relative mt-8 md:mt-10 max-w-lg">
                <span
                  className="absolute -top-4 -left-2 font-mono text-5xl text-muted leading-none select-none"
                  aria-hidden
                >
                  &ldquo;
                </span>
                <p className="text-primary text-lg md:text-[22px] italic leading-relaxed">
                  {data.pullQuote}
                </p>
                <span
                  className="absolute -bottom-6 -right-2 font-mono text-5xl text-muted leading-none select-none"
                  aria-hidden
                >
                  &rdquo;
                </span>
              </blockquote>
            )}

            {/* Persona */}
            {data.ownerRole && (
              <PersonaEyebrow role={data.ownerRole} className="mt-8 md:mt-10 block" />
            )}

            {/* User identity */}
            <div className="flex items-center gap-2 mt-3">
              <img
                src={data.avatarUrl}
                alt=""
                aria-hidden
                className="w-8 h-8 rounded-full bg-elevated"
              />
              <span className="text-secondary text-[15px]">@{data.username}</span>
            </div>

            {/* CTA */}
            <Link
              to="/"
              className={`${buttonClasses({ variant: 'primary', size: 'lg' })} w-full mt-8 md:mt-10`}
            >
              Find yours. Enter the dojo →
            </Link>
            <p className="text-muted text-[11px] font-mono tracking-[0.04em] mt-3">
              Daily practice. Invite-only. dojo.notdefined.dev
            </p>
          </article>

          <p className="text-muted text-[10px] font-mono tracking-[0.08em] uppercase text-center mt-10 opacity-60">
            kata_id: {sessionId?.slice(0, 6) ?? ''}
          </p>
        </div>

        {/* OG image preview (hidden, for crawlers that render) */}
        <img src={ogImageUrl} alt="" className="hidden" />
      </PublicPageLayout>
    </>
  )
}
