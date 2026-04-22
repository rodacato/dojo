import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type SessionWithExercise } from '../lib/api'
import type { Verdict } from '@dojo/shared'
import { PageLoader } from '../components/PageLoader'
import { TypeBadge, DifficultyBadge, VerdictBadge } from '../components/ui/Badge'
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
  const completionMinutes = session.completedAt
    ? Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)
    : null

  // No attempt + not active = the learner let the kata expire. Render a
  // compact standalone layout — the wide grid is for verdict + insights,
  // which do not exist here and leave the page visually broken.
  if (!attempt && session.status !== 'active') {
    return (
      <div className="px-4 py-12 max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-muted text-xs font-mono uppercase tracking-wider">
            {session.exercise.title}
          </span>
          <TypeBadge type={session.exercise.type} />
          <DifficultyBadge difficulty={session.exercise.difficulty} />
        </div>
        <h1 className="font-mono text-3xl uppercase tracking-wider text-muted leading-none mb-2">
          {session.status === 'failed' ? 'Incomplete' : 'Pending'}
        </h1>
        <p className="text-muted text-sm font-mono mb-8">
          Started {new Date(session.startedAt).toLocaleDateString()}
        </p>

        <div className="p-5 bg-surface border border-border rounded-md mb-6 text-center">
          <p className="text-secondary text-sm mb-1">This kata expired without a submission.</p>
          <p className="text-muted text-xs">Start a new one to keep practicing.</p>
        </div>

        <div className="flex gap-3 pt-6 border-t border-border/40">
          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            className="flex-1 py-2.5 border border-border text-secondary font-mono text-sm rounded-sm hover:border-accent hover:text-primary transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/start', { replace: true })}
            className="flex-1 py-2.5 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
          >
            Keep Practicing
          </button>
        </div>

        <p className="text-center text-muted/50 text-xs font-mono mt-6">Consistency compounds.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-8 max-w-5xl mx-auto">
      {/* Exercise title + badges */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-muted text-xs font-mono uppercase tracking-wider">
          {session.exercise.title}
        </span>
        <TypeBadge type={session.exercise.type} />
        <DifficultyBadge difficulty={session.exercise.difficulty} />
      </div>

      {/* Verdict */}
      {verdict ? (
        <div className="mb-2">
          <h1 className="font-mono text-3xl sm:text-4xl md:text-5xl uppercase tracking-wider text-primary leading-none">
            {verdict.replace(/_/g, ' ')}
            <span className="text-accent animate-pulse">|</span>
          </h1>
        </div>
      ) : (
        <div className="mb-2">
          <h1 className="font-mono text-3xl md:text-4xl uppercase tracking-wider text-muted leading-none">
            {session.status === 'failed' ? 'Incomplete' : 'Pending'}
          </h1>
        </div>
      )}

      {/* Completion info */}
      <p className="text-muted text-sm font-mono mb-8">
        {session.completedAt
          ? `Completed ${new Date(session.completedAt).toLocaleDateString()}`
          : `Started ${new Date(session.startedAt).toLocaleDateString()}`}
        {completionMinutes != null && ` · ${completionMinutes} min`}
      </p>

      {/* Main content — 2-col on desktop */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-4 lg:gap-8">
        {/* Left column — analysis + collapsibles */}
        <div className="min-w-0">
          {/* Sensei analysis */}
          {attempt?.analysis && (
            <div className="p-5 bg-surface border-l-2 border-accent rounded-md mb-6">
              <p className="text-muted text-xs font-mono uppercase tracking-wider mb-4">
                {session.ownerRole ? `Sensei — ${session.ownerRole}` : "Sensei's Analysis"}
              </p>
              {verdict && (
                <div className="mb-4">
                  <VerdictBadge verdict={verdict} />
                </div>
              )}
              <div className="text-secondary text-sm font-sans leading-relaxed whitespace-pre-wrap">
                {attempt.analysis}
              </div>
            </div>
          )}

          {/* Insight cards */}
          <InsightCards analysis={attempt?.analysis} />

          {/* Topics to review */}
          {attempt?.topicsToReview && attempt.topicsToReview.length > 0 && (
            <div className="mb-6">
              <p className="text-muted text-xs font-mono uppercase tracking-wider mb-3">Topics to review</p>
              <div className="flex flex-wrap gap-2">
                {attempt.topicsToReview.map((t) => (
                  <span
                    key={t}
                    className="text-warning text-xs font-mono px-2.5 py-1 border border-warning/30 rounded-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Kata body — collapsible */}
          {session.body && (
            <details className="mb-4 group">
              <summary className="text-muted text-xs font-mono uppercase tracking-wider cursor-pointer hover:text-secondary transition-colors select-none">
                The kata <span className="text-muted/40 group-open:hidden">+</span><span className="text-muted/40 hidden group-open:inline">−</span>
              </summary>
              <div className="mt-3 p-4 bg-surface border border-border/40 rounded-md">
                <KataBody body={session.body} />
              </div>
            </details>
          )}

          {/* User response — collapsible */}
          {attempt?.userResponse && (
            <details className="mb-6 group">
              <summary className="text-muted text-xs font-mono uppercase tracking-wider cursor-pointer hover:text-secondary transition-colors select-none">
                Your response <span className="text-muted/40 group-open:hidden">+</span><span className="text-muted/40 hidden group-open:inline">−</span>
              </summary>
              <div className="mt-3 p-4 bg-surface border border-border/40 rounded-md text-secondary text-sm leading-relaxed whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                {attempt.userResponse}
              </div>
            </details>
          )}

          {/* Attempt exists but evaluation failed */}
          {attempt && !verdict && !attempt.analysis && (
            <NoEvaluationCard sessionId={sessionId!} />
          )}
        </div>

        {/* Right column — share card preview */}
        {verdict && sessionId && (
          <div className="lg:sticky lg:top-8 self-start">
            <ShareCardPreview
              exerciseTitle={session.exercise.title}
              verdict={verdict}
              analysis={attempt?.analysis}
              approachNote={attempt?.analysis ? parseInsight(attempt.analysis).approachNote : null}
              ownerRole={session.ownerRole}
            />
          </div>
        )}
      </div>

      {/* Dojo position stat */}
      {verdict && (
        <p className="text-center text-muted text-xs font-mono mt-10">
          +1 position in the dojo this week
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-4 pt-6 border-t border-border/40 max-w-md mx-auto">
        <button
          onClick={() => navigate('/dashboard', { replace: true })}
          className="flex-1 py-2.5 border border-border text-secondary font-mono text-sm rounded-sm hover:border-accent hover:text-primary transition-colors"
        >
          Dashboard
        </button>
        <button
          onClick={() => navigate('/start', { replace: true })}
          className="flex-1 py-2.5 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
        >
          Keep Practicing
        </button>
        {verdict && sessionId && (
          <ShareButton
            sessionId={sessionId}
            exerciseTitle={session.exercise.title}
            verdict={verdict}
            approachNote={attempt?.analysis ? parseInsight(attempt.analysis).approachNote : null}
          />
        )}
      </div>

      {/* Feedback */}
      {sessionId && (session.status === 'completed' || session.status === 'failed') && (
        <FeedbackSection sessionId={sessionId} alreadySubmitted={feedbackSubmitted} />
      )}

      {/* Footer */}
      <p className="text-center text-muted/50 text-xs font-mono mt-6">Consistency compounds.</p>
    </div>
  )
}

function InsightCards({ analysis }: { analysis?: string }) {
  if (!analysis) return null
  const insight = parseInsight(analysis)
  const hasAny = insight.strengths || insight.improvements || insight.approachNote
  if (!hasAny) return null

  return (
    <div className="flex flex-col gap-4 mb-6">
      {insight.strengths && (
        <div className="p-4 bg-surface border-l-2 border-success rounded-md">
          <p className="text-success text-xs font-mono uppercase tracking-wider mb-2">Strengths</p>
          <ul className="list-disc list-inside text-secondary text-sm leading-relaxed space-y-1">
            {insight.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {insight.improvements && (
        <div className="p-4 bg-surface border-l-2 border-warning rounded-md">
          <p className="text-warning text-xs font-mono uppercase tracking-wider mb-2">Improvements</p>
          <ul className="list-disc list-inside text-secondary text-sm leading-relaxed space-y-1">
            {insight.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {insight.approachNote && (
        <div className="p-4 bg-surface border-l-2 border-accent rounded-md">
          <p className="text-accent text-xs font-mono uppercase tracking-wider mb-2">Alternative Approach</p>
          <p className="text-secondary text-sm italic leading-relaxed">{insight.approachNote}</p>
        </div>
      )}
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
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="px-5 py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
      >
        {retrying ? 'Requesting...' : 'Request re-evaluation'}
      </button>
    </div>
  )
}

function ShareButton({ sessionId, exerciseTitle, verdict, approachNote }: { sessionId: string; exerciseTitle: string; verdict: string; approachNote?: string | null }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/share/${sessionId}`

  async function handleShare() {
    const base = `${verdict.replace(/_/g, ' ')} — ${exerciseTitle} | dojo_`
    const text = approachNote ? `${base}\n\n"${approachNote}"` : base

    if (navigator.share) {
      try {
        await navigator.share({ title: 'dojo_ kata result', text, url: shareUrl })
        return
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
        '_blank',
      )
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex-1 py-2.5 border border-border text-secondary font-mono text-sm rounded-sm hover:border-accent hover:text-primary transition-colors"
    >
      {copied ? 'Copied!' : 'Share'}
    </button>
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
  const verdictLabel = verdict.replace(/_/g, ' ')
  const verdictColor =
    verdict === 'passed'
      ? 'text-success border-success/40'
      : verdict === 'needs_work'
        ? 'text-danger border-danger/40'
        : 'text-warning border-warning/40'
  const pullQuote = approachNote ?? (analysis
    ? analysis.length > 120 ? analysis.slice(0, 117) + '...' : analysis
    : null)
  const snippet = pullQuote ? `"${pullQuote}"` : null

  return (
    <div className="border border-border/40 rounded-md bg-surface p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-accent text-xs">dojo_</span>
        <span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded-sm ${verdictColor}`}>
          {verdictLabel}
        </span>
      </div>
      <div>
        <p className="font-mono text-primary text-sm font-bold">{exerciseTitle}</p>
        {snippet && (
          <p className="text-muted text-xs mt-2 leading-relaxed italic">{snippet}</p>
        )}
      </div>
      {ownerRole && (
        <p className="text-muted/50 text-[10px] font-mono border-t border-border/30 pt-3">
          sensei — {ownerRole.toLowerCase()}
        </p>
      )}
    </div>
  )
}
