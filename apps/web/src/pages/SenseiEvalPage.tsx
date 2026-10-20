import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { useEvaluationStream, type EvaluationResult } from '../hooks/useEvaluationStream'
import { useTypingReveal } from '../hooks/useTypingReveal'
import { useRotatingMessage } from '../hooks/useRotatingMessage'
import { Button } from '../components/ui/Button'
import { TypeBadge, DifficultyBadge } from '../components/ui/Badge'
import { StreamingText } from '../components/ui/StreamingText'
import { SenseiBubble, UserBubble } from '../components/ui/ChatBubble'
import { VerdictBlock } from '../components/ui/VerdictBlock'
import { ExecutionResultCard } from '../components/eval/ExecutionResultCard'
import { EnsoLoader } from '../components/ui/EnsoLoader'
import { FeedbackSection } from '../components/ui/FeedbackSection'
import { PieceReceipt } from '../components/recognition/PieceReceipt'
import { KataNotes, PostKataActions, TheAnswer, YourPointAnswer, parsePointResponse } from '../components/eval/PostKata'
import { hideInsightTags } from '../lib/parse-insight'

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

type StatusChipKind = 'connecting' | 'executing' | 'streaming' | 'follow-up' | 'complete' | 'error'

export function SenseiEvalPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: session, reload: reloadSession } = useAsync(() => api.getSession(sessionId!), [sessionId])
  const [followUpText, setFollowUpText] = useState('')
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false)
  const [history, setHistory] = useState<Exchange[]>([])
  const { state, connect, submit, reconnect } = useEvaluationStream(sessionId!)
  const submittedAttemptRef = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const evalMessage = useRotatingMessage(EVAL_MESSAGES)

  useEffect(() => {
    if (!sessionId) return
    connect()
  }, [connect, sessionId])

  useEffect(() => {
    if (state.status !== 'ready') return
    if (submittedAttemptRef.current) {
      reconnect(submittedAttemptRef.current)
      return
    }
    const attemptId = sessionStorage.getItem(`dojo-attempt-${sessionId}`)
    if (attemptId) {
      submittedAttemptRef.current = attemptId
      submit(attemptId)
      sessionStorage.removeItem(`dojo-attempt-${sessionId}`)
    }
  }, [state.status, sessionId, submit, reconnect])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [state])

  const isStreaming = state.status === 'streaming'
  const hasResult = state.status === 'evaluation' || state.status === 'complete'
  const tokens = 'tokens' in state ? state.tokens : ''
  const executionResult = 'executionResult' in state ? state.executionResult : undefined
  const result = hasResult ? (state as { result: EvaluationResult }).result : null
  const isFinal = !!result?.isFinalEvaluation
  useEffect(() => {
    if (isFinal) reloadSession()
  }, [isFinal, reloadSession])
  const senseiInitials = useMemo(
    () => deriveInitials(session?.ownerRole),
    [session?.ownerRole],
  )
  const revealedTokens = useTypingReveal(tokens, !isStreaming)

  const status = deriveStatus({
    state: state.status,
    isStreaming,
    hasResult,
    isFinal: result?.isFinalEvaluation,
    hasFollowUp: !!result?.followUpQuestion,
  })

  async function handleFollowUp() {
    if (!sessionId || !followUpText.trim() || followUpSubmitting) return
    const answer = followUpText.trim()
    setFollowUpSubmitting(true)
    if (result) {
      setHistory((prev) => [...prev, { tokens, result, userAnswer: answer }])
    }
    try {
      const { attemptId } = await api.submitAttempt(sessionId, answer)
      setFollowUpText('')
      submittedAttemptRef.current = attemptId
      submit(attemptId)
    } finally {
      setFollowUpSubmitting(false)
    }
  }

  const final = result?.isFinalEvaluation ? result : null
  const prose = hideInsightTags(revealedTokens)
  const code = session?.kata.starterCode ?? null
  const pointed = code ? parsePointResponse(session?.finalAttempt?.userResponse) : null
  const awaitingFollowUp = !!result && !result.isFinalEvaluation && !!result.followUpQuestion

  return (
    <div className="h-dvh bg-page flex flex-col overflow-hidden">
      <header className="h-14 shrink-0 border-b border-border bg-surface/90 backdrop-blur-md flex items-center px-4 md:px-6 gap-3">
        <span className="font-mono font-bold text-accent text-base inline-flex items-center select-none">
          dojo<span className="animate-cursor ml-0.5" aria-hidden>_</span>
        </span>
        <div className="ml-auto">
          <StatusChip kind={status} />
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:py-8">
        <div className="max-w-xl mx-auto flex flex-col gap-6">
          {session && (
            <div className="flex flex-col gap-3">
              <h1 className="text-primary text-2xl font-semibold leading-tight tracking-tight">{session.kata.title}</h1>
              <div className="flex items-center gap-1.5">
                <TypeBadge type={session.kata.type} />
                <DifficultyBadge difficulty={session.kata.difficulty} />
              </div>
            </div>
          )}

          {executionResult && <ExecutionResultCard result={executionResult} />}

          {history.map((exchange, i) => (
            <div key={i} className="flex flex-col gap-6">
              <SenseiBubble initials={senseiInitials} role={session?.ownerRole}>
                <StreamingText text={hideInsightTags(exchange.tokens)} done className="text-primary" />
              </SenseiBubble>
              <UserBubble>{exchange.userAnswer}</UserBubble>
            </div>
          ))}

          {state.status === 'error' ? (
            <div role="alert" className="flex flex-col gap-3">
              <p className="text-primary">The sensei couldn't evaluate your response.</p>
              <p className="text-secondary text-sm">{state.message}</p>
              <Button variant="primary" size="lg" className="w-full" onClick={() => connect()}>
                Try again
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="ghost" size="lg" onClick={() => navigate(`/katas/${sessionId}`)}>
                  Back to kata
                </Button>
                <Button variant="ghost" size="lg" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <VerdictBlock verdict={final?.verdict} topics={final?.topicsToReview}>
              {prose ? (
                <StreamingText text={prose} done={!isStreaming && revealedTokens === tokens} className="text-primary" />
              ) : (
                <span className="inline-flex items-center gap-3 text-secondary text-sm">
                  <EnsoLoader size={28} label="The sensei is evaluating" />
                  {evalMessage}
                </span>
              )}
            </VerdictBlock>
          )}

          {awaitingFollowUp && (
            <SenseiBubble initials={senseiInitials} role={session?.ownerRole}>
              <p className="text-primary">{result.followUpQuestion}</p>
            </SenseiBubble>
          )}

          {code && pointed && <YourPointAnswer code={code} line={pointed.line} why={pointed.why} />}
          {final && code && session?.answer && <TheAnswer code={code} answer={session.answer} />}
          {final && <KataNotes analysis={tokens} />}
          {final && session && session.earnedPieces.length > 0 && (
            <PieceReceipt pieceIds={session.earnedPieces} needsWork={final.verdict === 'needs_work'} />
          )}
          {final && sessionId && <FeedbackSection sessionId={sessionId} />}
          {final && sessionId && <PostKataActions sessionId={sessionId} />}
        </div>
      </div>

      {awaitingFollowUp && (
        <div className="shrink-0 border-t border-border bg-surface/40 px-4 md:px-6 py-3">
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
      )}
    </div>
  )
}

function deriveInitials(role?: string): string {
  if (!role) return 'S'
  const words = role.trim().split(/\s+/)
  return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'S'
}

function deriveStatus({
  state,
  isStreaming,
  hasResult,
  isFinal,
  hasFollowUp,
}: {
  state: string
  isStreaming: boolean
  hasResult: boolean
  isFinal?: boolean
  hasFollowUp?: boolean
}): StatusChipKind {
  if (state === 'error') return 'error'
  if (state === 'connecting' || state === 'idle' || state === 'ready') return 'connecting'
  if (state === 'executing') return 'executing'
  if (isStreaming) return 'streaming'
  if (hasResult && isFinal) return 'complete'
  if (hasResult && hasFollowUp) return 'follow-up'
  return 'streaming'
}

function StatusChip({ kind }: Readonly<{ kind: StatusChipKind }>) {
  const styles: Record<StatusChipKind, { label: string; color: string; cursor: boolean }> = {
    connecting: { label: 'CONNECTING', color: 'text-secondary border-border bg-elevated', cursor: true },
    executing: { label: 'EXECUTING', color: 'text-warning-text border-warning/40 bg-warning/10', cursor: true },
    streaming: { label: 'STREAMING', color: 'text-secondary border-border bg-elevated', cursor: true },
    'follow-up': { label: 'FOLLOW-UP', color: 'text-secondary border-border bg-elevated', cursor: false },
    complete: { label: 'COMPLETE', color: 'text-success-text border-success/40 bg-success/10', cursor: false },
    error: { label: 'ERROR', color: 'text-danger-text border-danger/40 bg-danger/10', cursor: false },
  }
  const s = styles[kind]
  return (
    <span
      className={`inline-flex items-center font-mono text-xs tracking-[0.08em] uppercase border px-2 py-1 rounded-sm ${s.color}`}
    >
      {s.label}
      {s.cursor && <span className="animate-cursor ml-0.5" aria-hidden>_</span>}
    </span>
  )
}
