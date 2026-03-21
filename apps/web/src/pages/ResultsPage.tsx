import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type SessionWithExercise } from '../lib/api'
import type { AttemptDTO, Verdict } from '@dojo/shared'
import { PageLoader } from '../components/PageLoader'
import { TypeBadge, DifficultyBadge, VerdictBadge } from '../components/ui/Badge'

const VERDICT_DISPLAY: Record<Verdict, string> = {
  passed: 'Passed.',
  passed_with_notes: 'Passed.',
  needs_work: 'Needs work.',
}

export function ResultsPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionWithExercise | null>(null)
  const [kataCount, setKataCount] = useState<number | null>(null)

  useEffect(() => {
    if (!sessionId) return
    Promise.all([api.getSession(sessionId), api.getDashboard()]).then(([s, dash]) => {
      setSession(s)
      setKataCount(dash.recentSessions.length)
    })
  }, [sessionId])

  if (!session) return <PageLoader />

  // The API currently doesn't return attempts on GET /sessions/:id
  // The attempt data comes from the WS stream and is stored in the eval page
  // For Phase 0 we just show the session-level info
  const attempt = (session as unknown as { finalAttempt?: AttemptDTO }).finalAttempt ?? null

  return (
    <div className="min-h-screen bg-base px-4 py-8 max-w-2xl mx-auto">
      {/* Verdict */}
      {attempt?.verdict && (
        <div className="text-center mb-8">
          <div className="font-mono text-4xl uppercase tracking-wider mb-3">
            {VERDICT_DISPLAY[attempt.verdict]}
          </div>
          <VerdictBadge verdict={attempt.verdict} />
        </div>
      )}

      {/* Exercise info */}
      <div className="mb-4">
        <div className="flex gap-2 mb-1">
          <TypeBadge type={session.exercise.type} />
          <DifficultyBadge difficulty={session.exercise.difficulty} />
        </div>
        <h2 className="text-primary font-medium">{session.exercise.title}</h2>
        {kataCount && (
          <p className="text-muted text-sm mt-1 font-mono">Your {ordinal(kataCount)} kata this month.</p>
        )}
      </div>

      {/* Analysis */}
      {attempt?.analysis && (
        <div className="p-4 bg-surface border border-border rounded-md mb-4">
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-2">Analysis</p>
          <p className="text-secondary text-sm leading-relaxed">{attempt.analysis}</p>
        </div>
      )}

      {/* Topics to review */}
      {attempt?.topicsToReview && attempt.topicsToReview.length > 0 && (
        <div className="p-4 bg-surface border border-border rounded-md mb-4">
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-2">Topics to review</p>
          <div className="flex flex-wrap gap-1">
            {attempt.topicsToReview.map((t) => (
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

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex-1 py-2 border border-border text-secondary font-mono text-sm rounded-sm hover:border-primary transition-colors"
        >
          ← Dashboard
        </button>
      </div>
    </div>
  )
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!)
}
