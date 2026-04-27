import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type SessionWithExercise } from '../lib/api'
import { useEvaluationStream, type EvaluationResult } from '../hooks/useEvaluationStream'
import { useTypingReveal } from '../hooks/useTypingReveal'
import { useRotatingMessage } from '../hooks/useRotatingMessage'
import { Button } from '../components/ui/Button'
import { TypeBadge, DifficultyBadge } from '../components/ui/Badge'
import { StreamingText } from '../components/ui/StreamingText'
import { SenseiBubble, UserBubble } from '../components/ui/ChatBubble'
import { VerdictBlock } from '../components/ui/VerdictBlock'
import { ExecutionResultCard } from '../components/eval/ExecutionResultCard'
import type { ExerciseType } from '@dojo/shared'

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
  const [session, setSession] = useState<SessionWithExercise | null>(null)
  const [followUpText, setFollowUpText] = useState('')
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false)
  const [history, setHistory] = useState<Exchange[]>([])
  const { state, connect, submit } = useEvaluationStream(sessionId!)
  const scrollRef = useRef<HTMLDivElement>(null)
  const evalMessage = useRotatingMessage(EVAL_MESSAGES)

  useEffect(() => {
    if (!sessionId) return
    api.getSession(sessionId).then(setSession)
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return
    connect()
  }, [connect, sessionId])

  useEffect(() => {
    if (state.status !== 'ready') return
    const attemptId = sessionStorage.getItem(`dojo-attempt-${sessionId}`)
    if (attemptId) {
      submit(attemptId)
      sessionStorage.removeItem(`dojo-attempt-${sessionId}`)
    }
  }, [state.status, sessionId, submit])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [state])

  const isExecuting = state.status === 'executing'
  const isStreaming = state.status === 'streaming'
  const hasResult = state.status === 'evaluation' || state.status === 'complete'
  const tokens = 'tokens' in state ? (state.tokens as string) : ''
  const executionResult = 'executionResult' in state ? state.executionResult : undefined
  const result = hasResult ? (state as { result: EvaluationResult }).result : null
  const senseiInitials = useMemo(
    () => deriveInitials(session?.ownerRole),
    [session?.ownerRole],
  )
  const revealedTokens = useTypingReveal(tokens, !isStreaming)
  const isLoadingStream =
    state.status === 'idle' ||
    state.status === 'connecting' ||
    state.status === 'ready' ||
    (isStreaming && !tokens)
  const isWaiting = (isLoadingStream || isExecuting || state.status === 'execution_done') && !tokens

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
    const { attemptId } = await api.submitAttempt(sessionId, answer)
    setFollowUpText('')
    setFollowUpSubmitting(false)
    submit(attemptId)
  }

  return (
    <div className="h-screen bg-page flex flex-col overflow-hidden">
      {/* Top bar — focus mode, no sidebar */}
      <header className="h-14 shrink-0 border-b border-border bg-surface/90 backdrop-blur-md flex items-center px-4 md:px-6 gap-3">
        <span className="font-mono font-bold text-accent text-base inline-flex items-center select-none">
          dojo<span className="animate-cursor ml-0.5" aria-hidden>_</span>
        </span>
        {session && (
          <>
            <span className="h-4 w-px bg-border hidden sm:block" />
            <span className="font-mono text-[12px] text-primary truncate hidden sm:inline max-w-[40ch]">
              {session.exercise.title}
            </span>
            <div className="hidden md:flex items-center gap-1.5">
              <TypeBadge type={session.exercise.type as ExerciseType} />
              <DifficultyBadge difficulty={session.exercise.difficulty} />
            </div>
          </>
        )}
        <div className="ml-auto">
          <StatusChip kind={status} />
        </div>
      </header>

      {/* Conversation column — max 880px centered */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-220 mx-auto flex flex-col gap-6">
          {/* Execution result card — code katas only */}
          {executionResult && <ExecutionResultCard result={executionResult} />}

          {/* Past exchanges (multi-turn follow-ups) */}
          {history.map((exchange, i) => (
            <div key={i} className="flex flex-col gap-6">
              <SenseiBubble initials={senseiInitials} role={session?.ownerRole}>
                <StreamingText text={exchange.tokens} done className="text-primary" />
              </SenseiBubble>
              <UserBubble>{exchange.userAnswer}</UserBubble>
            </div>
          ))}

          {/* Live sensei message */}
          {(isWaiting || revealedTokens || isStreaming) && (
            <SenseiBubble
              initials={senseiInitials}
              role={session?.ownerRole}
              streaming={isStreaming || isWaiting}
            >
              {isWaiting && !revealedTokens ? (
                <span className="text-secondary text-[14px] font-sans">{evalMessage}</span>
              ) : (
                <StreamingText
                  text={revealedTokens}
                  done={!isStreaming && revealedTokens === tokens}
                  className="text-primary"
                />
              )}
            </SenseiBubble>
          )}

          {/* Follow-up question (mid-conversation, before user answers) */}
          {result && !result.isFinalEvaluation && result.followUpQuestion && (
            <SenseiBubble initials={senseiInitials} role={session?.ownerRole}>
              <p className="text-primary">{result.followUpQuestion}</p>
            </SenseiBubble>
          )}

          {/* Verdict block — final evaluation */}
          {result && result.isFinalEvaluation && (
            <VerdictBlock
              verdict={result.verdict}
              role={session?.ownerRole}
              topics={result.topicsToReview}
              cta={
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate(`/kata/${sessionId}/result`)}
                >
                  View full analysis →
                </Button>
              }
            >
              {state.status === 'complete' && (
                <p className="text-muted text-[11px] font-mono animate-pulse">
                  Evaluation complete — opening full analysis...
                </p>
              )}
            </VerdictBlock>
          )}

          {/* Stream error */}
          {state.status === 'error' && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-secondary font-mono text-sm">
                The sensei couldn't evaluate your response.
              </p>
              <p className="text-muted text-xs">{state.message}</p>
              <div className="flex gap-3 mt-2">
                <Button variant="primary" size="md" onClick={() => connect()}>
                  Try again
                </Button>
                <Button variant="ghost" size="md" onClick={() => navigate(`/kata/${sessionId}`)}>
                  Back to kata
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom band — 96px tall, status / textarea / final CTA */}
      <div className="h-24 shrink-0 border-t border-border bg-surface/40 px-4 md:px-6 py-3 flex items-center">
        <div className="max-w-220 mx-auto w-full">
          {result && !result.isFinalEvaluation && result.followUpQuestion ? (
            <div className="flex gap-2">
              <textarea
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="Your answer..."
                rows={2}
                className="flex-1 bg-page border border-border rounded-sm px-3 py-2 text-primary text-[14px] font-sans resize-none focus:outline-none focus:border-accent transition-colors"
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
          ) : result?.isFinalEvaluation ? (
            <p className="text-muted text-[11px] font-mono uppercase tracking-[0.08em] text-center">
              The sensei has spoken.
            </p>
          ) : (
            <p className="text-secondary text-[13px] font-mono text-center inline-flex items-center justify-center w-full">
              The sensei is evaluating.
              <span className="animate-cursor text-accent ml-0.5" aria-hidden>_</span>
            </p>
          )}
        </div>
      </div>
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

function StatusChip({ kind }: { kind: StatusChipKind }) {
  const styles: Record<StatusChipKind, { label: string; color: string; cursor: boolean }> = {
    connecting: { label: 'CONNECTING', color: 'text-muted border-border bg-elevated', cursor: true },
    executing: { label: 'EXECUTING', color: 'text-warning border-warning/40 bg-warning/10', cursor: true },
    streaming: { label: 'STREAMING', color: 'text-accent border-accent/40 bg-accent/10', cursor: true },
    'follow-up': { label: 'FOLLOW-UP', color: 'text-accent border-accent/40 bg-accent/10', cursor: false },
    complete: { label: 'COMPLETE', color: 'text-success border-success/40 bg-success/10', cursor: false },
    error: { label: 'ERROR', color: 'text-danger border-danger/40 bg-danger/10', cursor: false },
  }
  const s = styles[kind]
  return (
    <span
      className={`inline-flex items-center font-mono text-[10px] tracking-[0.08em] uppercase border px-2 py-1 rounded-sm ${s.color}`}
    >
      {s.label}
      {s.cursor && <span className="animate-cursor ml-0.5" aria-hidden>_</span>}
    </span>
  )
}
