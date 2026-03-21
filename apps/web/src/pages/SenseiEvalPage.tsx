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
    <div className="min-h-screen bg-base px-4 py-8 max-w-2xl mx-auto">
      {/* Sensei header */}
      {session && (
        <div className="flex items-center gap-3 mb-6 p-3 bg-surface border border-border rounded-sm">
          <div className="w-8 h-8 bg-accent/20 rounded-sm flex items-center justify-center text-accent font-mono text-xs">
            S
          </div>
          <div>
            <div className="text-primary text-sm font-medium">{session.ownerRole}</div>
            <div className="text-muted text-xs">Evaluating your submission</div>
          </div>
        </div>
      )}

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

      {/* Error state */}
      {state.status === 'error' && (
        <div className="p-4 bg-danger/10 border border-danger/30 rounded-sm text-danger text-sm font-mono">
          {state.message}
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
  )
}
