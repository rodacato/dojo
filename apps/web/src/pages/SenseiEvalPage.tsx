import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { useEvaluationStream, type EvaluationResult } from '../hooks/useEvaluationStream'
import { useTypingReveal } from '../hooks/useTypingReveal'
import { useRotatingMessage } from '../hooks/useRotatingMessage'
import { Button } from '../components/ui/Button'
import { StreamingText } from '../components/ui/StreamingText'
import { SenseiBubble, UserBubble } from '../components/ui/ChatBubble'
import { VerdictBlock } from '../components/ui/VerdictBlock'
import { ExecutionResultCard } from '../components/eval/ExecutionResultCard'
import { SkeletonText } from '../components/ui/SkeletonLoader'
import { FeedbackSection } from '../components/ui/FeedbackSection'
import { PieceReceipt } from '../components/recognition/PieceReceipt'
import { KataContext, KataNotes, PostKataActions, ReviewVerdict, TheAnswer, YourPointAnswer, parsePointResponse } from '../components/eval/PostKata'
import { ReturnLink, ReviewGrid, ReviewShell, ReviewTitle, kataMeta, reviewEyebrow, useReturnState, type ReviewStatus } from '../components/eval/ReviewShell'
import { hideInsightTags } from '../lib/parse-insight'
import { storedPointAnswer } from '../hooks/useKataSession'
import { useOnline } from '../hooks/useOnline'
import { VERDICT_LABELS } from '../lib/verdict'

const EVAL_MESSAGES = [
  'The sensei is reviewing your work...',
  'Examining your approach...',
  'Considering edge cases...',
  'Weighing the trade-offs...',
  'Reflecting on your choices...',
  'Almost ready with feedback...',
]

interface Exchange {
  tokens: string
  result: EvaluationResult
  userAnswer: string
}

const inFlightKey = (sessionId: string) => `dojo-attempt-in-flight-${sessionId}`

export function SenseiEvalPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const returnState = useReturnState()
  const { online } = useOnline()
  const { data: session, reload: reloadSession } = useAsync(() => api.getSession(sessionId!), [sessionId])
  const [followUpText, setFollowUpText] = useState('')
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false)
  const [followUpFailed, setFollowUpFailed] = useState(false)
  const [history, setHistory] = useState<Exchange[]>([])
  const { state, connect, submit, reconnect } = useEvaluationStream(sessionId!)
  const submittedAttemptRef = useRef<string | null>(null)
  const scrollRef = useRef<HTMLElement>(null)
  const evalMessage = useRotatingMessage(EVAL_MESSAGES)

  useEffect(() => {
    if (!sessionId) return
    connect()
  }, [connect, sessionId])

  useEffect(() => {
    if (state.status !== 'ready' || !sessionId) return
    const newAttempt = sessionStorage.getItem(`dojo-attempt-${sessionId}`)
    if (newAttempt) {
      submittedAttemptRef.current = newAttempt
      sessionStorage.setItem(inFlightKey(sessionId), newAttempt)
      submit(newAttempt)
      sessionStorage.removeItem(`dojo-attempt-${sessionId}`)
      return
    }
    const inFlight = submittedAttemptRef.current ?? sessionStorage.getItem(inFlightKey(sessionId))
    if (inFlight) {
      submittedAttemptRef.current = inFlight
      reconnect(inFlight)
      return
    }
    navigate(`/katas/${sessionId}/result`, { replace: true, state: returnState })
  }, [state.status, sessionId, submit, reconnect, navigate, returnState])

  const attemptGone = state.status === 'error' && state.code === 'ATTEMPT_NOT_FOUND'
  useEffect(() => {
    if (!attemptGone || !sessionId) return
    sessionStorage.removeItem(inFlightKey(sessionId))
    navigate(`/katas/${sessionId}/result`, { replace: true, state: returnState })
  }, [attemptGone, sessionId, navigate, returnState])

  const isStreaming = state.status === 'streaming'
  const hasResult = state.status === 'evaluation' || state.status === 'complete'
  const tokens = 'tokens' in state ? state.tokens : ''
  const executionResult = 'executionResult' in state ? state.executionResult : undefined
  const result = hasResult ? (state as { result: EvaluationResult }).result : null
  const isFinal = !!result?.isFinalEvaluation
  useEffect(() => {
    if (!isFinal) return
    sessionStorage.removeItem(inFlightKey(sessionId!))
    reloadSession()
  }, [isFinal, reloadSession, sessionId])
  const senseiInitials = useMemo(
    () => deriveInitials(session?.ownerRole),
    [session?.ownerRole],
  )
  const revealedTokens = useTypingReveal(tokens, !isStreaming)

  const awaitingFollowUp = !!result && !result.isFinalEvaluation && !!result.followUpQuestion
  // Only a conversation follows its newest line. The result reads from the verdict down.
  const inConversation = !isFinal && (awaitingFollowUp || history.length > 0)
  useEffect(() => {
    if (!inConversation) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [state, inConversation])

  const status = deriveStatus({
    state: state.status,
    online,
    isStreaming,
    hasResult,
    isFinal: result?.isFinalEvaluation,
    hasFollowUp: !!result?.followUpQuestion,
  })

  async function handleFollowUp() {
    if (!sessionId || !followUpText.trim() || followUpSubmitting) return
    const answer = followUpText.trim()
    setFollowUpSubmitting(true)
    setFollowUpFailed(false)
    try {
      const { attemptId } = await api.submitAttempt(sessionId, answer)
      if (result) {
        setHistory((prev) => [...prev, { tokens, result, userAnswer: answer }])
      }
      setFollowUpText('')
      submittedAttemptRef.current = attemptId
      sessionStorage.setItem(inFlightKey(sessionId), attemptId)
      submit(attemptId)
    } catch {
      setFollowUpFailed(true)
    } finally {
      setFollowUpSubmitting(false)
    }
  }

  const final = result?.isFinalEvaluation ? result : null
  const prose = hideInsightTags(revealedTokens)
  const code = session?.kata.starterCode ?? null
  const pointed = code ? parsePointResponse(session?.finalAttempt?.userResponse) ?? storedPointAnswer(sessionId) : null

  const followUpBox = awaitingFollowUp && (
    <div className="shrink-0 border-t border-border bg-surface/40 px-4 md:px-6 py-3">
      {followUpFailed && (
        <p role="alert" className="max-w-xl mx-auto w-full mb-2 text-danger-text text-sm">
          Your answer didn't go through. It's still here. Try again.
        </p>
      )}
      <div className="max-w-xl mx-auto w-full flex gap-2">
        <textarea
          value={followUpText}
          onChange={(e) => setFollowUpText(e.target.value)}
          placeholder="Your answer..."
          rows={2}
          className="flex-1 bg-page border border-border rounded-sm px-3 py-2 text-primary text-sm font-sans resize-none focus:outline-none focus:border-accent transition-colors"
        />
        <Button
          variant="primary"
          size="md"
          onClick={handleFollowUp}
          disabled={!followUpText.trim() || followUpSubmitting || isStreaming}
          loading={followUpSubmitting}
        >
          Send →
        </Button>
      </div>
    </div>
  )

  return (
    <ReviewShell status={status} leading={final && <ReturnLink />} scrollRef={scrollRef} footer={followUpBox} centered={!pointed}>
      {session && <ReviewTitle eyebrow={reviewEyebrow(status)} title={session.kata.title} meta={kataMeta(session.kata)} />}
      <p role="status" className="sr-only">{final ? `Review complete. ${VERDICT_LABELS[final.verdict]}` : ''}</p>

      <ReviewGrid
        aside={code && pointed && <YourPointAnswer code={code} line={pointed.line} why={pointed.why} final={!!final} />}
        followthrough={
          final && (
            <>
              {session && session.earnedPieces.length > 0 && (
                <div className="mt-7 md:mt-8">
                  <PieceReceipt pieceIds={session.earnedPieces} needsWork={final.verdict === 'needs_work'} />
                </div>
              )}
              {sessionId && <FeedbackSection sessionId={sessionId} />}
              {sessionId && <PostKataActions sessionId={sessionId} />}
            </>
          )
        }
      >
        <div className="flex flex-col gap-6 empty:hidden">
          {executionResult && <ExecutionResultCard result={executionResult} />}

          {history.map((exchange, i) => (
            <div key={i} className="flex flex-col gap-6">
              <SenseiBubble initials={senseiInitials} role={session?.ownerRole}>
                <StreamingText text={hideInsightTags(exchange.tokens)} done className="text-primary" />
              </SenseiBubble>
              <UserBubble>{exchange.userAnswer}</UserBubble>
            </div>
          ))}
        </div>

        <div className={executionResult || history.length > 0 ? 'mt-6' : undefined}>
          {state.status === 'error' && (
            <ReviewInterrupted
              partial={hideInsightTags(tokens)}
              message={online ? state.message : 'Offline. Reconnect to receive the rest of the review.'}
              retryLabel={!online || state.code.startsWith('WS_') ? 'Reconnect' : 'Try again'}
              onRetry={connect}
              onBackToKata={() => navigate(`/katas/${sessionId}`)}
              onDashboard={() => navigate('/dashboard')}
            />
          )}
          {final && (
            <ReviewVerdict verdict={final.verdict}>
              <StreamingText text={prose} done={revealedTokens === tokens} className="text-primary" />
            </ReviewVerdict>
          )}
          {result && !final && prose && (
            <VerdictBlock>
              <StreamingText text={prose} done={revealedTokens === tokens} className="text-primary" />
            </VerdictBlock>
          )}
          {!result && state.status !== 'error' && (
            <ReviewProgress message={prose ? EVAL_MESSAGES[0]! : evalMessage} prose={prose} done={!isStreaming && revealedTokens === tokens} />
          )}
        </div>

        {awaitingFollowUp && (
          <div className="mt-6">
            <SenseiBubble initials={senseiInitials} role={session?.ownerRole}>
              <p className="text-primary">{result.followUpQuestion}</p>
            </SenseiBubble>
          </div>
        )}

        {final && code && session?.answer && <TheAnswer code={code} answer={session.answer} />}
        {final && <KataNotes analysis={tokens} topics={final.topicsToReview} />}
        {final && session && <KataContext session={session} pointed={!!pointed} />}
      </ReviewGrid>
    </ReviewShell>
  )
}

function ReviewProgress({ message, prose, done }: Readonly<{ message: string; prose: string; done: boolean }>) {
  return (
    <section className="border-t border-border pt-6">
      <h2 className="text-primary text-xl font-semibold tracking-tight">{message}</h2>
      {prose ? (
        <StreamingText text={prose} done={done} className="mt-5 text-secondary text-base leading-relaxed" />
      ) : (
        <div aria-hidden className="mt-7 mb-7 grid gap-4 max-w-120">
          <SkeletonText />
          <SkeletonText width="2/3" />
        </div>
      )}
    </section>
  )
}

function ReviewInterrupted({
  partial,
  message,
  retryLabel,
  onRetry,
  onBackToKata,
  onDashboard,
}: Readonly<{
  partial: string
  message: string
  retryLabel: string
  onRetry: () => void
  onBackToKata: () => void
  onDashboard: () => void
}>) {
  return (
    <section role="alert" className="border-t border-border pt-6">
      <h2 className="text-primary text-xl font-semibold tracking-tight">The sensei couldn't evaluate your response.</h2>
      {partial && <StreamingText text={partial} done className="mt-5 text-secondary text-base leading-relaxed" />}
      <div className="mt-6 pt-5 border-t border-border flex flex-col gap-3">
        <p className="text-danger-text text-sm">{message}</p>
        <Button variant="primary" size="xl" className="mt-3 w-full" onClick={onRetry}>
          {retryLabel}
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="ghost" size="xl" className="!px-2" onClick={onBackToKata}>
            Back to kata
          </Button>
          <Button variant="ghost" size="xl" className="!px-2" onClick={onDashboard}>
            Dashboard
          </Button>
        </div>
      </div>
    </section>
  )
}

function deriveInitials(role?: string): string {
  if (!role) return 'S'
  const words = role.trim().split(/\s+/)
  return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'S'
}

function deriveStatus({
  state,
  online,
  isStreaming,
  hasResult,
  isFinal,
  hasFollowUp,
}: {
  state: string
  online: boolean
  isStreaming: boolean
  hasResult: boolean
  isFinal?: boolean
  hasFollowUp?: boolean
}): ReviewStatus {
  if (state === 'error') return online ? 'error' : 'offline'
  if (state === 'connecting' || state === 'idle' || state === 'ready') return 'connecting'
  if (state === 'executing') return 'executing'
  if (isStreaming) return 'streaming'
  if (hasResult && isFinal) return 'complete'
  if (hasResult && hasFollowUp) return 'follow-up'
  return 'streaming'
}
