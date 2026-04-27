import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type SessionWithExercise } from '../lib/api'
import type { Verdict } from '@dojo/shared'
import { PageLoader } from '../components/PageLoader'
import { TypeBadge, DifficultyBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PersonaEyebrow } from '../components/ui/PersonaEyebrow'
import { VerdictBlock } from '../components/ui/VerdictBlock'
import { KataBody } from '../components/ui/KataBody'
import { FeedbackSection } from '../components/ui/FeedbackSection'
import { ErrorState } from '../components/ui/ErrorState'
import { parseInsight } from '../lib/parse-insight'

export function ResultsPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionWithExercise | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [retryTick, setRetryTick] = useState(0)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    setLoadError(false)
    api.getSession(sessionId)
      .then((s) => { if (!cancelled) setSession(s) })
      .catch(() => { if (!cancelled) setLoadError(true) })
    api.getFeedback(sessionId)
      .then((r) => { if (!cancelled) setFeedbackSubmitted(r.submitted) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [sessionId, retryTick])

  if (loadError) {
    return (
      <ErrorState
        message="We couldn't load this kata result."
        primaryAction={{ label: 'Try again', onClick: () => setRetryTick((n) => n + 1) }}
        secondaryAction={{ label: 'Back to dashboard', to: '/dashboard' }}
      />
    )
  }

  if (!session) return <PageLoader />

  const attempt = session.finalAttempt
  const verdict = attempt?.verdict as Verdict | undefined
  const completionTime = formatCompletionTime(session.startedAt, session.completedAt)

  // No attempt + not active = the learner let the kata expire. Render a
  // compact layout — the wide grid is for verdict + insights, which don't
  // exist here and leave the page visually broken.
  if (!attempt && session.status !== 'active') {
    return (
      <div className="px-4 py-12 max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <TypeBadge type={session.exercise.type} />
          <DifficultyBadge difficulty={session.exercise.difficulty} />
        </div>
        <h1 className="text-primary text-3xl font-semibold leading-tight tracking-tight mb-2">
          {session.exercise.title}
        </h1>
        <p className="text-muted text-xs font-mono tracking-[0.08em] uppercase mb-8">
          {session.status === 'failed' ? 'Incomplete' : 'Pending'} · started{' '}
          {new Date(session.startedAt).toLocaleDateString()}
        </p>

        <div className="p-5 bg-surface border border-border rounded-md mb-6 text-center">
          <p className="text-secondary text-sm mb-1">This kata expired without a submission.</p>
          <p className="text-muted text-xs">Start a new one to keep practicing.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" size="md" onClick={() => navigate('/dashboard', { replace: true })} className="flex-1">
            Dashboard
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate('/start', { replace: true })} className="flex-1">
            Keep Practicing
          </Button>
        </div>

        <p className="text-center text-muted text-[11px] font-mono tracking-[0.08em] uppercase mt-8 opacity-60">
          Consistency compounds.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-6 py-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <p className="text-muted text-[10px] font-mono tracking-[0.08em] uppercase mb-6">
        Dashboard / Recent kata / This result
      </p>

      {/* Page header band */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          {session.ownerRole && <PersonaEyebrow role={session.ownerRole} className="mb-3 block" />}
          <h1 className="text-primary text-3xl md:text-[32px] font-semibold leading-tight tracking-tight mb-3">
            {session.exercise.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <TypeBadge type={session.exercise.type} />
            <DifficultyBadge difficulty={session.exercise.difficulty} />
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted px-2 py-1 border border-border rounded-sm">
              {session.exercise.duration} min
            </span>
          </div>
        </div>
        {completionTime && (
          <div className="shrink-0 text-right">
            <span className="block font-mono text-[10px] tracking-[0.08em] uppercase text-muted">
              Completed in
            </span>
            <span className="block font-mono text-[15px] text-primary tabular-nums">
              {completionTime}
            </span>
          </div>
        )}
      </div>

      {/* Hero verdict block */}
      {verdict && (
        <div className="mb-8">
          <VerdictBlock
            verdict={verdict}
            size="lg"
            topics={attempt?.topicsToReview ?? undefined}
          >
            {attempt?.analysis && <AnalysisProse analysis={attempt.analysis} />}
          </VerdictBlock>
        </div>
      )}

      {/* No verdict on a present attempt = eval failed — surface the retry */}
      {attempt && !verdict && !attempt.analysis && (
        <NoEvaluationCard sessionId={sessionId!} />
      )}

      {/* 2-col split — share rail (left 40%) + insights stack (right 60%) */}
      {verdict && sessionId && (
        <div className="grid lg:grid-cols-[2fr_3fr] gap-6 lg:gap-8 mb-8">
          {/* LEFT — share rail */}
          <div className="lg:sticky lg:top-8 self-start flex flex-col gap-3">
            <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted">
              Share this
            </p>
            <ShareCardPreview
              exerciseTitle={session.exercise.title}
              verdict={verdict}
              analysis={attempt?.analysis}
              approachNote={attempt?.analysis ? parseInsight(attempt.analysis).approachNote : null}
              ownerRole={session.ownerRole}
            />
            <ShareActions
              sessionId={sessionId}
              exerciseTitle={session.exercise.title}
              verdict={verdict}
              approachNote={attempt?.analysis ? parseInsight(attempt.analysis).approachNote : null}
            />
          </div>

          {/* RIGHT — insights + topics + collapsibles */}
          <div className="min-w-0 flex flex-col gap-6">
            <InsightCards analysis={attempt?.analysis} />

            {session.body && (
              <CollapsibleRow title="Original kata">
                <KataBody body={session.body} />
              </CollapsibleRow>
            )}

            {attempt?.userResponse && (
              <CollapsibleRow title="Your response">
                <pre className="text-secondary text-sm leading-relaxed whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                  {attempt.userResponse}
                </pre>
              </CollapsibleRow>
            )}
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center justify-between gap-3 pt-6 border-t border-border mb-8">
        <Button variant="ghost" size="md" onClick={() => navigate('/dashboard', { replace: true })}>
          ← Dashboard
        </Button>
        <Button variant="primary" size="md" onClick={() => navigate('/start', { replace: true })}>
          Keep practicing →
        </Button>
      </div>

      {/* Feedback */}
      {sessionId && (session.status === 'completed' || session.status === 'failed') && (
        <FeedbackSection sessionId={sessionId} alreadySubmitted={feedbackSubmitted} />
      )}

      <p className="text-center text-muted text-[10px] font-mono tracking-[0.08em] uppercase mt-8 opacity-60">
        Consistency compounds.
      </p>
    </div>
  )
}

function AnalysisProse({ analysis }: { analysis: string }) {
  const paragraphs = analysis.split(/\n\n+/).filter((p) => p.trim().length > 0)
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  )
}

function CollapsibleRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group bg-surface border border-border rounded-md">
      <summary className="px-4 py-3 cursor-pointer select-none flex items-center justify-between">
        <span className="text-primary text-[14px]">{title}</span>
        <span className="text-muted text-[14px] transition-transform group-open:rotate-90" aria-hidden>
          ›
        </span>
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-border">
        {children}
      </div>
    </details>
  )
}

function InsightCards({ analysis }: { analysis?: string }) {
  if (!analysis) return null
  const insight = parseInsight(analysis)
  const hasAny = insight.strengths || insight.improvements || insight.approachNote
  if (!hasAny) return null

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {insight.strengths && (
        <InsightCard title="Strengths" tone="success">
          <ul className="list-disc list-outside ml-4 text-secondary text-[13px] leading-relaxed space-y-1">
            {insight.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </InsightCard>
      )}
      {insight.improvements && (
        <InsightCard title="Improvements" tone="warning">
          <ul className="list-disc list-outside ml-4 text-secondary text-[13px] leading-relaxed space-y-1">
            {insight.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </InsightCard>
      )}
      {insight.approachNote && (
        <InsightCard title="Alternative approach" tone="accent">
          <p className="text-secondary text-[13px] italic leading-relaxed">{insight.approachNote}</p>
        </InsightCard>
      )}
    </div>
  )
}

function InsightCard({
  title,
  tone,
  children,
}: {
  title: string
  tone: 'success' | 'warning' | 'accent'
  children: React.ReactNode
}) {
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'warning'
        ? 'text-warning'
        : 'text-accent'
  return (
    <div className="bg-surface border border-border rounded-md p-4 flex flex-col gap-3 min-h-50">
      <p className={`font-mono text-[10px] tracking-[0.08em] uppercase ${toneClass}`}>
        {title}
      </p>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function NoEvaluationCard({ sessionId }: { sessionId: string }) {
  const navigate = useNavigate()
  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    setRetrying(true)
    try {
      const { attemptId } = await api.retryEvaluation(sessionId)
      sessionStorage.setItem(`dojo-attempt-${sessionId}`, attemptId)
      navigate(`/kata/${sessionId}/eval`)
    } catch {
      setRetrying(false)
    }
  }

  return (
    <div className="p-5 bg-surface border border-border rounded-md mb-6 text-center">
      <p className="text-secondary text-sm mb-1">The sensei couldn't finish evaluating this kata.</p>
      <p className="text-muted text-xs mb-4">This usually means the LLM timed out or hit a rate limit.</p>
      <Button variant="primary" size="md" onClick={handleRetry} disabled={retrying} loading={retrying}>
        Request re-evaluation
      </Button>
    </div>
  )
}

function ShareActions({
  sessionId,
  exerciseTitle,
  verdict,
  approachNote,
}: {
  sessionId: string
  exerciseTitle: string
  verdict: string
  approachNote?: string | null
}) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/share/${sessionId}`

  async function handleCopy() {
    const base = `${verdict.replace(/_/g, ' ').toUpperCase()} — ${exerciseTitle} | dojo_`
    const text = approachNote ? `${base}\n\n"${approachNote}"` : base
    try {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — silently no-op; user can use the Twitter button.
    }
  }

  function handleTwitter() {
    const text = `${verdict.replace(/_/g, ' ').toUpperCase()} — ${exerciseTitle} | dojo_`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <div className="flex flex-col gap-2 mt-1">
      <Button variant="primary" size="md" onClick={handleCopy} className="w-full">
        {copied ? 'Link copied!' : 'Copy share link'}
      </Button>
      <Button variant="ghost" size="md" onClick={handleTwitter} className="w-full">
        Share to Twitter
      </Button>
      <p className="text-muted text-[10px] font-mono tracking-[0.08em] truncate mt-1">
        {shareUrl.replace(/^https?:\/\//, '')}
      </p>
    </div>
  )
}

function ShareCardPreview({
  exerciseTitle,
  verdict,
  analysis,
  approachNote,
  ownerRole,
}: {
  exerciseTitle: string
  verdict: string
  analysis?: string
  approachNote?: string | null
  ownerRole?: string
}) {
  const verdictLabel = verdict.replace(/_/g, ' ').toUpperCase()
  const verdictColor =
    verdict === 'passed'
      ? 'text-success'
      : verdict === 'needs_work'
        ? 'text-danger'
        : 'text-warning'
  const pullQuote = approachNote ?? (analysis
    ? analysis.length > 120 ? analysis.slice(0, 117) + '...' : analysis
    : null)

  return (
    <div className="bg-page border border-border rounded-md p-5 flex flex-col gap-4 aspect-1200/630">
      <span className="font-mono font-bold text-accent text-sm inline-flex items-center select-none">
        dojo<span className="animate-cursor ml-0.5" aria-hidden>_</span>
      </span>
      <p className={`font-mono text-2xl font-bold uppercase tracking-tight leading-none ${verdictColor}`}>
        {verdictLabel}
      </p>
      <p className="text-primary text-[15px] font-semibold leading-snug line-clamp-2">
        {exerciseTitle}
      </p>
      {pullQuote && (
        <p className="text-secondary text-[12px] italic leading-relaxed line-clamp-3">
          &ldquo;{pullQuote}&rdquo;
        </p>
      )}
      <div className="mt-auto flex items-end justify-between gap-2">
        {ownerRole && (
          <p className="text-muted text-[10px] font-mono tracking-[0.08em] uppercase truncate">
            sensei — {ownerRole.toLowerCase()}
          </p>
        )}
        <p className="text-accent text-[10px] font-mono tracking-[0.08em] uppercase shrink-0">
          Find yours →
        </p>
      </div>
    </div>
  )
}

function formatCompletionTime(startedAt: string, completedAt: string | null): string | null {
  if (!completedAt) return null
  const elapsedMs = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  if (elapsedMs <= 0 || !Number.isFinite(elapsedMs)) return null
  const totalSeconds = Math.floor(elapsedMs / 1000)
  const mm = Math.floor(totalSeconds / 60)
  const ss = totalSeconds % 60
  return `${mm}:${ss.toString().padStart(2, '0')}`
}
