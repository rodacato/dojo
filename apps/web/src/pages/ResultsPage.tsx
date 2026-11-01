import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { api, type SessionWithKata } from '../lib/api'
import type { Verdict } from '@dojo/shared'
import { Button } from '../components/ui/Button'
import { LoadState } from '../components/ui/LoadState'
import { SkeletonText } from '../components/ui/SkeletonLoader'
import { FeedbackSection } from '../components/ui/FeedbackSection'
import { PieceReceipt } from '../components/recognition/PieceReceipt'
import { stripInsightTags } from '../lib/parse-insight'
import { KataContext, KataNotes, PostKataActions, ReviewVerdict, TheAnswer, YourPointAnswer, parsePointResponse } from '../components/eval/PostKata'
import { ReturnLink, ReviewGrid, ReviewShell, ReviewTitle, kataMeta, reviewEyebrow, useReturnState } from '../components/eval/ReviewShell'

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
      <ReviewShell status="unavailable" leading={<ReturnLink />} centered>
        <ReviewTitle eyebrow="Result unavailable" title="Kata result" />
        <ReviewGrid>
          <section role="alert" className="border-t border-border pt-6">
            <h2 className="text-primary text-xl font-semibold tracking-tight mb-6">We couldn't load this kata result.</h2>
            <Button variant="primary" size="xl" className="max-md:w-full" onClick={() => setRetryTick((n) => n + 1)}>
              Try again
            </Button>
          </section>
        </ReviewGrid>
      </ReviewShell>
    )
  }

  if (!session) {
    return (
      <ReviewShell status="loading" leading={<ReturnLink />} centered>
        <ReviewTitle eyebrow="Result unavailable" title="Kata result" />
        <LoadState status="loading" eyebrow="Loading kata result">
          <div aria-hidden className="grid gap-4 max-w-120 mt-5">
            <SkeletonText />
            <SkeletonText width="2/3" />
            <SkeletonText />
          </div>
        </LoadState>
      </ReviewShell>
    )
  }

  const attempt = session.finalAttempt
  const verdict = attempt?.verdict as Verdict | undefined
  const completionTime = formatCompletionTime(session.startedAt, session.completedAt)

  const stillOpen = session.status === 'active' || session.status === 'preparing'
  const timeIsUp = Date.now() >= new Date(session.startedAt).getTime() + session.kata.duration * 60_000
  if (!attempt && stillOpen && !timeIsUp) return <Navigate to={`/katas/${sessionId}`} replace />

  // The server may still call an expired session active until the next dashboard load.
  if (!attempt) {
    return (
      <ReviewShell status={session.status === 'completed' ? 'pending' : 'incomplete'} leading={<ReturnLink />} centered>
        <ReviewTitle
          eyebrow={reviewEyebrow(session.status === 'completed' ? 'pending' : 'incomplete')}
          title={session.kata.title}
          meta={`${kataMeta(session.kata)} · started ${new Date(session.startedAt).toLocaleDateString()}`}
        />
        <ReviewGrid>
          <section className="border-t border-border pt-6">
            <h2 className="text-primary text-xl font-semibold tracking-tight">This kata expired without a submission.</h2>
            <p className="mt-5 text-secondary text-base leading-relaxed">Start a new one to keep practicing.</p>
            <p className="paper-note mt-3">No answer was evaluated.</p>
            <Button variant="link" size="lg" className="mt-2" onClick={() => navigate('/katas', { replace: true })}>
              Keep Practicing
            </Button>
          </section>
          <div className="mt-6 pt-6 border-t border-border">
            <Button variant="primary" size="xl" className="max-md:w-full" onClick={() => navigate('/dashboard', { replace: true })}>
              Done
            </Button>
          </div>
        </ReviewGrid>
      </ReviewShell>
    )
  }

  const code = session.kata.starterCode
  const pointed = code ? parsePointResponse(attempt.userResponse) : null
  const meta = [kataMeta(session.kata), completionTime && `completed in ${completionTime}`].filter(Boolean).join(' · ')

  return (
    <ReviewShell status={verdict ? 'complete' : 'unavailable'} leading={<ReturnLink />} centered={!pointed}>
      <ReviewTitle eyebrow={verdict ? reviewEyebrow('complete') : 'Evaluation unavailable'} title={session.kata.title} meta={meta} />
      <ReviewGrid
        aside={code && pointed && <YourPointAnswer code={code} line={pointed.line} why={pointed.why} final={!!verdict} />}
        followthrough={
          verdict &&
          sessionId && (
            <>
              {session.earnedPieces.length > 0 && (
                <div className="mt-7 md:mt-8">
                  <PieceReceipt pieceIds={session.earnedPieces} needsWork={verdict === 'needs_work'} />
                </div>
              )}
              <FeedbackSection sessionId={sessionId} />
              <PostKataActions sessionId={sessionId} />
            </>
          )
        }
      >
        {verdict && (
          <ReviewVerdict verdict={verdict}>
            {attempt.analysis && <AnalysisProse analysis={attempt.analysis} />}
          </ReviewVerdict>
        )}
        {!verdict && !attempt.analysis && <NoEvaluation sessionId={sessionId!} />}

        {code && session.answer && <TheAnswer code={code} answer={session.answer} />}
        {attempt.analysis && <KataNotes analysis={attempt.analysis} topics={attempt.topicsToReview ?? []} />}
        <KataContext session={session} pointed={!!pointed} />
      </ReviewGrid>
    </ReviewShell>
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

function NoEvaluation({ sessionId }: Readonly<{ sessionId: string }>) {
  const navigate = useNavigate()
  const returnState = useReturnState()
  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    setRetrying(true)
    try {
      const { attemptId } = await api.retryEvaluation(sessionId)
      sessionStorage.setItem(`dojo-attempt-${sessionId}`, attemptId)
      navigate(`/katas/${sessionId}/eval`, { state: returnState })
    } catch {
      setRetrying(false)
    }
  }

  return (
    <section className="border-t border-border pt-6">
      <h2 className="text-primary text-xl font-semibold tracking-tight">The sensei couldn't finish evaluating this kata.</h2>
      <p className="mt-5 mb-6 text-secondary text-base leading-relaxed">This usually means the LLM timed out or hit a rate limit.</p>
      <Button variant="primary" size="xl" className="max-md:w-full" onClick={handleRetry} disabled={retrying} loading={retrying}>
        Request re-evaluation
      </Button>
    </section>
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
