import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, type SessionWithExercise } from '../lib/api'
import { useEvaluationStream, type EvaluationResult } from '../hooks/useEvaluationStream'
import { StreamingText } from '../components/ui/StreamingText'
import { VerdictBadge } from '../components/ui/Badge'

export function SenseiEvalPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const [session, setSession] = useState<SessionWithExercise | null>(null)
  const [followUpText, setFollowUpText] = useState('')
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false)
  const { state, connect, submit } = useEvaluationStream(sessionId!)

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

  async function handleFollowUp() {
    if (!sessionId || !followUpText.trim() || followUpSubmitting) return
    setFollowUpSubmitting(true)
    const { attemptId } = await api.submitAttempt(sessionId, followUpText)
    setFollowUpText('')
    setFollowUpSubmitting(false)
    submit(attemptId)
  }

  const isStreaming = state.status === 'streaming'
  const hasResult = state.status === 'evaluation' || state.status === 'complete'
  const tokens = 'tokens' in state ? (state.tokens as string) : ''
  const result = hasResult ? (state as { result: EvaluationResult }).result : null

  return (
    <div className="min-h-screen bg-base">
      {/* Top bar */}
      {session && (
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-surface/50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent/20 rounded-sm flex items-center justify-center text-accent font-mono text-xs font-bold">
              {session.ownerRole.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div className="text-primary text-sm font-medium">{session.exercise.title}</div>
              <div className="text-muted text-xs font-mono">[{session.ownerRole}]</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming && (
              <span className="text-accent text-xs font-mono animate-pulse">Evaluating...</span>
            )}
          </div>
        </div>
      )}

      <div className="px-4 py-8 max-w-2xl mx-auto">

      {/* Streaming prose */}
      {(tokens || isStreaming) && (
        <div className="mb-6">
          <StreamingText
            text={tokens}
            done={!isStreaming}
            className="text-secondary text-sm leading-relaxed"
          />
        </div>
      )}

      {/* Error state with reconnect */}
      {state.status === 'error' && (
        <div className="flex flex-col items-center justify-center py-20">
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
              onClick={() => window.location.href = `/kata/${sessionId}`}
              className="px-4 py-2 bg-surface border border-border text-secondary font-mono text-sm rounded-sm hover:text-primary transition-colors"
            >
              Back to kata
            </button>
          </div>
        </div>
      )}

      {/* Connecting/waiting */}
      {(state.status === 'idle' || state.status === 'connecting') && (
        <div className="text-muted font-mono text-sm animate-pulse">
          Connecting to sensei<span className="animate-pulse">...</span>
        </div>
      )}

      {/* Verdict card */}
      {result && (
        <div className="mt-6 p-4 bg-surface border border-border rounded-md">
          <div className="flex items-center justify-between mb-3">
            <VerdictBadge verdict={result.verdict} />
          </div>
          {result.topicsToReview.length > 0 && (
            <div className="mt-3">
              <p className="text-muted text-xs font-mono uppercase tracking-wider mb-2">Review</p>
              <div className="flex flex-wrap gap-1">
                {result.topicsToReview.map((t) => (
                  <span
                    key={t}
                    className="text-secondary text-xs font-mono px-2 py-0.5 bg-elevated rounded-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Follow-up question */}
      {result && !result.isFinalEvaluation && result.followUpQuestion && (
        <div className="mt-6">
          <div className="p-3 bg-surface border border-accent/30 rounded-sm mb-3">
            <p className="text-secondary text-sm">{result.followUpQuestion}</p>
          </div>
          <textarea
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            placeholder="Your answer..."
            className="w-full bg-surface border border-border rounded-sm p-3 text-primary text-sm font-sans resize-none h-28 focus:outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={handleFollowUp}
            disabled={!followUpText.trim() || followUpSubmitting || isStreaming}
            className="mt-2 w-full py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 disabled:opacity-40"
          >
            {followUpSubmitting ? 'Sending...' : 'Send follow-up →'}
          </button>
        </div>
      )}
      </div>
    </div>
  )
}
