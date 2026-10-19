import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type SessionWithKata } from '../lib/api'
import type { Verdict } from '@dojo/shared'
import { PageLoader } from '../components/PageLoader'
import { TypeBadge, DifficultyBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { VerdictBlock } from '../components/ui/VerdictBlock'
import { KataBody } from '../components/ui/KataBody'
import { FeedbackSection } from '../components/ui/FeedbackSection'
import { ErrorState } from '../components/ui/ErrorState'
import { stripInsightTags } from '../lib/parse-insight'
import { KataNotes, PostKataActions, TheAnswer, YourPointAnswer, parsePointResponse } from '../components/eval/PostKata'

export function ResultsPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionWithKata | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    setLoadError(false)
    api.getSession(sessionId)
      .then((s) => { if (!cancelled) setSession(s) })
      .catch(() => { if (!cancelled) setLoadError(true) })
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
          <TypeBadge type={session.kata.type} />
          <DifficultyBadge difficulty={session.kata.difficulty} />
        </div>
        <h1 className="text-primary text-3xl font-semibold leading-tight tracking-tight mb-2">
          {session.kata.title}
        </h1>
        <p className="text-secondary text-xs font-mono tracking-[0.08em] uppercase mb-8">
          {session.status === 'failed' ? 'Incomplete' : 'Pending'} · started{' '}
          {new Date(session.startedAt).toLocaleDateString()}
        </p>

        <div className="p-5 bg-surface border border-border rounded-md mb-6 text-center">
          <p className="text-secondary text-sm mb-1">This kata expired without a submission.</p>
          <p className="text-secondary text-xs">Start a new one to keep practicing.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" size="md" onClick={() => navigate('/dashboard', { replace: true })} className="flex-1">
            Dashboard
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate('/katas', { replace: true })} className="flex-1">
            Keep Practicing
          </Button>
        </div>

        <p className="text-center text-secondary text-xs font-mono tracking-[0.08em] uppercase mt-8">
          Consistency compounds.
        </p>
      </div>
    )
  }

  const code = session.kata.starterCode
  const pointed = code ? parsePointResponse(attempt?.userResponse) : null

  return (
    <div className="px-4 py-6 md:py-10 max-w-xl mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex flex-col gap-3">
          <h1 className="text-primary text-2xl font-semibold leading-tight tracking-tight">{session.kata.title}</h1>
          <div className="flex items-center gap-1.5">
            <TypeBadge type={session.kata.type} />
            <DifficultyBadge difficulty={session.kata.difficulty} />
          </div>
        </div>
        {completionTime && (
          <div className="shrink-0 text-right">
            <span className="block font-mono text-xs tracking-[0.08em] uppercase text-secondary">Completed in</span>
            <span className="block font-mono text-base text-primary tabular-nums">{completionTime}</span>
          </div>
        )}
      </div>

      {verdict && (
        <VerdictBlock verdict={verdict} topics={attempt?.topicsToReview ?? undefined}>
          {attempt?.analysis && <AnalysisProse analysis={attempt.analysis} />}
        </VerdictBlock>
      )}

      {attempt && !verdict && !attempt.analysis && <NoEvaluationCard sessionId={sessionId!} />}

      {code && pointed && <YourPointAnswer code={code} line={pointed.line} why={pointed.why} />}
      {code && session.answer && <TheAnswer code={code} answer={session.answer} />}
      {attempt?.analysis && <KataNotes analysis={attempt.analysis} />}

      {!pointed && session.body && (
        <CollapsibleRow title="Original kata">
          <KataBody body={session.body} />
        </CollapsibleRow>
      )}
      {!pointed && attempt?.userResponse && (
        <CollapsibleRow title="Your response">
          <pre className="text-secondary text-sm leading-relaxed whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
            {attempt.userResponse}
          </pre>
        </CollapsibleRow>
      )}

      {verdict && sessionId && (session.status === 'completed' || session.status === 'failed') && (
        <FeedbackSection sessionId={sessionId} />
      )}
      {verdict && sessionId && <PostKataActions sessionId={sessionId} />}

      <p className="text-center text-secondary text-xs font-mono tracking-[0.08em] uppercase">
        Consistency compounds.
      </p>
    </div>
  )
}

function AnalysisProse({ analysis }: Readonly<{ analysis: string }>) {
  const paragraphs = stripInsightTags(analysis).split(/\n\n+/).filter((p) => p.trim().length > 0)
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  )
}

function CollapsibleRow({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <details className="group bg-surface border border-border rounded-md">
      <summary className="px-4 py-3 cursor-pointer select-none flex items-center justify-between">
        <span className="text-primary text-sm">{title}</span>
        <span className="text-secondary text-sm transition-transform group-open:rotate-90" aria-hidden>
          ›
        </span>
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-border">
        {children}
      </div>
    </details>
  )
}

function NoEvaluationCard({ sessionId }: Readonly<{ sessionId: string }>) {
  const navigate = useNavigate()
  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    setRetrying(true)
    try {
      const { attemptId } = await api.retryEvaluation(sessionId)
      sessionStorage.setItem(`dojo-attempt-${sessionId}`, attemptId)
      navigate(`/katas/${sessionId}/eval`)
    } catch {
      setRetrying(false)
    }
  }

  return (
    <div className="p-5 bg-surface border border-border rounded-md mb-6 text-center">
      <p className="text-secondary text-sm mb-1">The sensei couldn't finish evaluating this kata.</p>
      <p className="text-secondary text-xs mb-4">This usually means the LLM timed out or hit a rate limit.</p>
      <Button variant="primary" size="md" onClick={handleRetry} disabled={retrying} loading={retrying}>
        Request re-evaluation
      </Button>
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
