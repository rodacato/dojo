import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type SessionWithExercise } from '../lib/api'
import { useEvaluationStream, type EvaluationResult } from '../hooks/useEvaluationStream'
import { useTypingReveal } from '../hooks/useTypingReveal'
import { VerdictBadge } from '../components/ui/Badge'
import { StreamingText } from '../components/ui/StreamingText'

const EVAL_MESSAGES = [
  'The sensei is reviewing your work...',
  'Examining your approach...',
  'Considering edge cases...',
  'Weighing the trade-offs...',
  'Reflecting on your choices...',
  'Almost ready with feedback...',
]

function useRotatingMessage(messages: string[], intervalMs = 3500) {
  const [msg, setMsg] = useState(messages[0]!)
  const idx = useRef(0)
  useEffect(() => {
    const interval = setInterval(() => {
      idx.current = (idx.current + 1) % messages.length
      setMsg(messages[idx.current]!)
    }, intervalMs)
    return () => clearInterval(interval)
  }, [messages, intervalMs])
  return msg
}

interface Exchange {
  tokens: string
  result: EvaluationResult
  userAnswer: string
}

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

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [state])

  async function handleFollowUp() {
    if (!sessionId || !followUpText.trim() || followUpSubmitting) return
    const answer = followUpText.trim()
    setFollowUpSubmitting(true)
    // Preserve current exchange in history before resetting stream state
    if (result) {
      setHistory((prev) => [...prev, { tokens, result, userAnswer: answer }])
    }
    const { attemptId } = await api.submitAttempt(sessionId, answer)
    setFollowUpText('')
    setFollowUpSubmitting(false)
    submit(attemptId)
  }

  const isStreaming = state.status === 'streaming'
  const hasResult = state.status === 'evaluation' || state.status === 'complete'
  const tokens = 'tokens' in state ? (state.tokens as string) : ''
  const result = hasResult ? (state as { result: EvaluationResult }).result : null
  const senseiInitials = session?.ownerRole?.split(' ').map(w => w[0]).slice(0, 2).join('') ?? 'S'
  const revealedTokens = useTypingReveal(tokens, !isStreaming)
  const isLoadingStream = state.status === 'idle' || state.status === 'connecting' || state.status === 'ready' || (isStreaming && !tokens)
  const isWaiting = isLoadingStream && history.length === 0

  return (
    <div className="h-screen bg-base flex flex-col">
      {/* Top bar — hidden during initial loading */}
      {session && !isWaiting && (
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border/40 bg-surface/50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-accent">terminal_kata</span>
            <span className="text-muted text-xs font-mono hidden sm:inline">{session.exercise.title}</span>
          </div>
          <div className="flex items-center gap-3">
            {isStreaming && (
              <span className="text-accent text-xs font-mono">
                Evaluating<span className="animate-pulse">...</span>
              </span>
            )}
            {result && (
              <span className="text-success text-xs font-mono">evaluation_complete</span>
            )}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full">

        {/* Evaluating loader — full center */}
        {isWaiting && (
          <div className="flex flex-col items-center justify-center h-full gap-5">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-secondary text-sm animate-pulse">{evalMessage}</p>
          </div>
        )}

        {/* Sensei identity */}
        {session && !isWaiting && (
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-accent/20 rounded-sm flex items-center justify-center text-accent font-mono text-xs font-bold shrink-0">
              {senseiInitials}
            </div>
            <div>
              <span className="text-muted text-xs font-mono">[{session.ownerRole}]</span>
            </div>
          </div>
        )}

        {/* Previous exchanges */}
        {history.map((exchange, i) => (
          <div key={i}>
            {/* Sensei message */}
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 bg-accent/20 rounded-sm flex items-center justify-center text-accent font-mono text-xs font-bold shrink-0 mt-1">
                {senseiInitials}
              </div>
              <div className="flex-1 min-w-0 p-4 bg-surface border-l-2 border-accent rounded-md">
                <StreamingText text={exchange.tokens} done className="text-secondary text-sm font-sans leading-relaxed" />
              </div>
            </div>
            {/* Verdict */}
            <div className="flex gap-3 mb-6">
              <div className="w-8 shrink-0" />
              <div className="flex-1 min-w-0 p-4 bg-surface border border-border rounded-md">
                <VerdictBadge verdict={exchange.result.verdict} />
                {exchange.result.topicsToReview.length > 0 && (
                  <div className="mt-3">
                    <p className="text-muted text-xs font-mono uppercase tracking-wider mb-2">Review</p>
                    <div className="flex flex-wrap gap-1.5">
                      {exchange.result.topicsToReview.map((t) => (
                        <span key={t} className="text-warning text-xs font-mono px-2 py-0.5 border border-warning/30 rounded-sm">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Follow-up question */}
            {exchange.result.followUpQuestion && (
              <div className="flex gap-3 mb-6">
                <div className="w-8 h-8 bg-accent/20 rounded-sm flex items-center justify-center text-accent font-mono text-xs font-bold shrink-0 mt-1">
                  {senseiInitials}
                </div>
                <div className="flex-1 min-w-0 p-4 bg-surface border-l-2 border-accent/40 rounded-md">
                  <p className="text-secondary text-sm font-sans">{exchange.result.followUpQuestion}</p>
                </div>
              </div>
            )}
            {/* User answer */}
            <div className="flex gap-3 mb-6 justify-end">
              <div className="max-w-[80%] p-4 bg-accent/10 border border-accent/20 rounded-md">
                <p className="text-secondary text-sm font-sans">{exchange.userAnswer}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Inline loading for follow-up */}
        {isLoadingStream && history.length > 0 && (
          <div className="flex gap-3 mb-6">
            <div className="w-8 h-8 bg-accent/20 rounded-sm flex items-center justify-center text-accent font-mono text-xs font-bold shrink-0 mt-1">
              {senseiInitials}
            </div>
            <div className="flex-1 min-w-0 p-4 bg-surface border-l-2 border-accent rounded-md">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="font-mono text-secondary text-xs animate-pulse">{evalMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sensei streaming message */}
        {!isWaiting && !isLoadingStream && (revealedTokens || isStreaming) && (
          <div className="flex gap-3 mb-6">
            <div className="w-8 h-8 bg-accent/20 rounded-sm flex items-center justify-center text-accent font-mono text-xs font-bold shrink-0 mt-1">
              {senseiInitials}
            </div>
            <div className="flex-1 min-w-0 p-4 bg-surface border-l-2 border-accent rounded-md">
              <StreamingText
                text={revealedTokens}
                done={!isStreaming && revealedTokens === tokens}
                className="text-secondary text-sm font-sans leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Verdict card */}
        {result && (
          <div className="flex gap-3 mb-6">
            <div className="w-8 shrink-0" /> {/* spacer to align with avatar */}
            <div className="flex-1 min-w-0 p-4 bg-surface border border-border rounded-md">
              <div className="flex items-center justify-between mb-3">
                <VerdictBadge verdict={result.verdict} />
              </div>
              {result.topicsToReview.length > 0 && (
                <div className="mt-3">
                  <p className="text-muted text-xs font-mono uppercase tracking-wider mb-2">Review</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.topicsToReview.map((t) => (
                      <span
                        key={t}
                        className="text-warning text-xs font-mono px-2 py-0.5 border border-warning/30 rounded-sm"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.isFinalEvaluation && (
                <button
                  onClick={() => navigate(`/kata/${sessionId}/result`)}
                  className="mt-4 text-accent text-xs font-mono hover:text-accent/80 transition-colors"
                >
                  View full analysis →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Follow-up question from sensei */}
        {result && !result.isFinalEvaluation && result.followUpQuestion && (
          <div className="flex gap-3 mb-6">
            <div className="w-8 h-8 bg-accent/20 rounded-sm flex items-center justify-center text-accent font-mono text-xs font-bold shrink-0 mt-1">
              {senseiInitials}
            </div>
            <div className="flex-1 min-w-0 p-4 bg-surface border-l-2 border-accent/40 rounded-md">
              <p className="text-secondary text-sm font-sans">{result.followUpQuestion}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {state.status === 'error' && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-secondary font-mono text-sm mb-2">The sensei couldn't evaluate your response.</p>
            <p className="text-muted text-xs mb-6">{state.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => connect()}
                className="px-4 py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => navigate(`/kata/${sessionId}`)}
                className="px-4 py-2 bg-surface border border-border text-secondary font-mono text-sm rounded-sm hover:text-primary transition-colors"
              >
                Back to kata
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom input — hidden during initial loading */}
      {!isWaiting && <div className="shrink-0 border-t border-border/40 bg-surface/50 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          {result && !result.isFinalEvaluation && result.followUpQuestion ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="Your answer..."
                rows={2}
                className="flex-1 bg-surface border border-border rounded-sm p-3 text-primary text-sm font-sans resize-none focus:outline-none focus:border-accent transition-colors"
              />
              <button
                onClick={handleFollowUp}
                disabled={!followUpText.trim() || followUpSubmitting || isStreaming}
                className="px-4 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 disabled:opacity-40 transition-colors shrink-0"
              >
                {followUpSubmitting ? '...' : 'Send →'}
              </button>
            </div>
          ) : (
            <p className="text-muted/50 text-xs font-mono text-center py-2">
              {result?.isFinalEvaluation ? 'The sensei has spoken.' : isStreaming ? 'The sensei is evaluating...' : 'Waiting for evaluation...'}
            </p>
          )}
        </div>
      </div>}
    </div>
  )
}
