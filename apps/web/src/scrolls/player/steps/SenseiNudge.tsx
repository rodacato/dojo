import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'

// "Ask the sensei" nudge state (PRD 026). `disabled` latches true when the
// API 404s — that signals FF_COURSE_NUDGE_ENABLED=false on the server.
export function useNudge({ scrollSlug, stepId }: { scrollSlug: string; stepId: string }) {
  const [nudge, setNudge] = useState<{ id: string; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    setNudge(null)
    setError(null)
    setLoading(false)
    setFeedback(null)
  }, [stepId])

  async function askSensei(context: { userCode: string; stdout?: string; stderr?: string }) {
    if (loading || disabled) return
    setLoading(true)
    setError(null)
    setFeedback(null)
    try {
      const response = await api.requestNudge({
        scrollSlug,
        stepId,
        userCode: context.userCode,
        stdout: context.stdout,
        stderr: context.stderr,
      })
      if ('disabled' in response) {
        setDisabled(true)
        return
      }
      setNudge({ id: response.id, text: response.nudge })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The sensei is unavailable right now.')
    } finally {
      setLoading(false)
    }
  }

  async function rateNudge(rating: 'up' | 'down') {
    if (!nudge || feedback) return
    // Optimistic — we only use the signal for prompt iteration, a silent
    // failure to persist is not worth alerting the learner about.
    setFeedback(rating)
    try {
      await api.submitNudgeFeedback(nudge.id, rating)
    } catch {
      // swallow
    }
  }

  function dismiss() {
    setNudge(null)
    setError(null)
    setFeedback(null)
  }

  return { nudge, loading, error, disabled, feedback, askSensei, rateNudge, dismiss }
}

export function SenseiNudgePanel({
  nudge,
  error,
  feedback,
  onRate,
  onDismiss,
}: Readonly<{
  nudge: { id: string; text: string } | null
  error: string | null
  feedback: 'up' | 'down' | null
  onRate: (rating: 'up' | 'down') => void
  onDismiss: () => void
}>) {
  if (!nudge && !error) return null

  return (
    <div className="px-4 py-3 border-t border-accent/40 bg-accent/5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-mono text-accent uppercase tracking-wider">sensei</p>
        <button
          onClick={onDismiss}
          className="text-xs font-mono text-muted hover:text-secondary transition-colors"
          aria-label="Dismiss nudge"
        >
          ×
        </button>
      </div>
      {nudge && (
        <>
          <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{nudge.text}</p>
          <div className="flex items-center gap-2 mt-2 text-xs font-mono">
            {feedback ? (
              <span className="text-muted">Thanks — noted.</span>
            ) : (
              <>
                <span className="text-muted">Did this help?</span>
                <button
                  onClick={() => onRate('up')}
                  className="px-2 py-1 -my-1 text-base leading-none text-muted hover:text-success transition-colors"
                  aria-label="This nudge helped"
                >
                  👍
                </button>
                <button
                  onClick={() => onRate('down')}
                  className="px-2 py-1 -my-1 text-base leading-none text-muted hover:text-danger transition-colors"
                  aria-label="This nudge did not help"
                >
                  👎
                </button>
              </>
            )}
          </div>
        </>
      )}
      {error && (
        <p className="text-sm text-danger leading-relaxed">{error}</p>
      )}
    </div>
  )
}
