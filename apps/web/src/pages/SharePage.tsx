import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API_URL } from '../lib/config'
import { LogoWordmark } from '../components/Logo'
import { PageLoader } from '../components/PageLoader'

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

const VERDICT_STYLES: Record<string, { color: string; border: string; bg: string }> = {
  passed: { color: 'text-success', border: 'border-success/40', bg: 'bg-success/10' },
  passed_with_notes: { color: 'text-warning', border: 'border-warning/40', bg: 'bg-warning/10' },
  needs_work: { color: 'text-danger', border: 'border-danger/40', bg: 'bg-danger/10' },
}

const TYPE_COLORS: Record<string, string> = {
  code: 'text-type-code',
  chat: 'text-type-chat',
  whiteboard: 'text-type-whiteboard',
}

export function SharePage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const [data, setData] = useState<ShareData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    fetch(`${API_URL}/share/${sessionId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true))
  }, [sessionId])

  if (error) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
        <p className="text-secondary font-mono text-sm mb-4">This kata result doesn't exist or isn't public yet.</p>
        <Link to="/" className="text-accent font-mono text-sm hover:text-accent/80 transition-colors">
          ← Go to dojo_
        </Link>
      </div>
    )
  }

  if (!data) return <PageLoader />

  const verdictLabel = data.verdict.replace(/_/g, ' ').toUpperCase()
  const style = VERDICT_STYLES[data.verdict] ?? VERDICT_STYLES.needs_work!
  const ogImageUrl = `${API_URL}/share/${sessionId}.png`

  return (
    <>
      {/* Dynamic OG tags via helmet-like approach — injected in index.html via SSR or meta */}
      <title>{`${verdictLabel} — ${data.exerciseTitle} | dojo_`}</title>
      <meta property="og:title" content={`${verdictLabel} — ${data.exerciseTitle}`} />
      <meta property="og:description" content={data.pullQuote ?? `Kata result by @${data.username}`} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:type" content="article" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${verdictLabel} — ${data.exerciseTitle} | dojo_`} />
      <meta name="twitter:description" content={data.pullQuote ?? `Kata result by @${data.username}`} />
      <meta name="twitter:image" content={ogImageUrl} />

      <div className="min-h-screen bg-base text-primary">
        {/* Nav */}
        <nav className="flex items-center justify-between px-4 md:px-8 py-5 border-b border-border/20 max-w-4xl mx-auto">
          <Link to="/">
            <LogoWordmark />
          </Link>
          <Link
            to="/"
            className="text-sm font-mono text-muted hover:text-secondary transition-colors"
          >
            Enter the dojo →
          </Link>
        </nav>

        {/* Card */}
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-12">
          {/* Verdict */}
          <div className="text-center mb-10">
            <span className={`inline-block font-mono text-xs uppercase tracking-widest px-3 py-1.5 border rounded-sm ${style.color} ${style.border} ${style.bg}`}>
              {verdictLabel}
            </span>
          </div>

          {/* Exercise info */}
          <div className="text-center mb-8">
            <h1 className="font-mono text-2xl md:text-3xl text-primary mb-3">{data.exerciseTitle}</h1>
            <div className="flex items-center justify-center gap-3 text-xs font-mono">
              <span className={TYPE_COLORS[data.exerciseType] ?? 'text-muted'}>{data.exerciseType.toUpperCase()}</span>
              <span className="text-border">·</span>
              <span className="text-secondary">{data.difficulty.toUpperCase()}</span>
              {data.completionMinutes && (
                <>
                  <span className="text-border">·</span>
                  <span className="text-muted">{data.completionMinutes} min</span>
                </>
              )}
            </div>
          </div>

          {/* Pull quote */}
          {data.pullQuote && (
            <div className="border-l-2 border-accent pl-5 py-2 my-8 max-w-lg mx-auto">
              <p className="text-secondary text-sm leading-relaxed italic">
                "{data.pullQuote}"
              </p>
              {data.ownerRole && (
                <p className="text-muted/50 text-[10px] font-mono mt-3">
                  — sensei ({data.ownerRole.toLowerCase()})
                </p>
              )}
            </div>
          )}

          {/* User */}
          <div className="flex items-center justify-center gap-3 mt-10 mb-12">
            <img
              src={data.avatarUrl}
              alt={data.username}
              className="w-8 h-8 rounded-sm"
            />
            <span className="text-secondary text-sm font-mono">@{data.username}</span>
          </div>

          {/* CTA */}
          <div className="text-center space-y-4">
            <Link
              to="/"
              className="inline-block px-8 py-3 bg-accent text-primary font-mono text-sm uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors"
            >
              Enter the dojo →
            </Link>
            <p className="text-muted/40 text-xs font-mono">
              One kata a day. No shortcuts. No AI assistance.
            </p>
          </div>
        </div>

        {/* OG image preview (hidden, for crawlers that render) */}
        <img src={ogImageUrl} alt="" className="hidden" />
      </div>
    </>
  )
}
