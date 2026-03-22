import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type SessionWithExercise } from '../lib/api'
import type { Verdict } from '@dojo/shared'
import { PageLoader } from '../components/PageLoader'
import { LogoWordmark } from '../components/Logo'
import { TypeBadge, DifficultyBadge, VerdictBadge } from '../components/ui/Badge'

export function ResultsPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionWithExercise | null>(null)

  useEffect(() => {
    if (!sessionId) return
    api.getSession(sessionId).then(setSession)
  }, [sessionId])

  if (!session) return <PageLoader />

  const attempt = session.finalAttempt
  const verdict = attempt?.verdict as Verdict | undefined

  return (
    <div className="min-h-screen bg-base px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-10">
        <LogoWordmark />
        <button
          onClick={() => navigate('/dashboard')}
          className="text-secondary text-sm font-mono hover:text-primary transition-colors"
        >
          ← Dashboard
        </button>
      </header>

      {/* Verdict */}
      {verdict && (
        <div className="mb-8">
          <VerdictBadge verdict={verdict} />
          <h1 className="font-mono text-3xl md:text-4xl uppercase tracking-wider mt-3 text-primary">
            {verdict === 'needs_work' ? 'Needs work.' : 'Passed.'}
          </h1>
        </div>
      )}

      {/* Exercise info */}
      <div className="flex items-center gap-2 mb-1">
        <TypeBadge type={session.exercise.type} />
        <DifficultyBadge difficulty={session.exercise.difficulty} />
      </div>
      <h2 className="text-primary font-medium mb-1">{session.exercise.title}</h2>
      <p className="text-muted text-sm font-mono mb-8">
        {session.completedAt
          ? `Completed ${new Date(session.completedAt).toLocaleDateString()}`
          : `Started ${new Date(session.startedAt).toLocaleDateString()}`}
      </p>

      {/* Analysis */}
      {attempt?.analysis && (
        <div className="p-5 bg-surface border-l-2 border-accent rounded-md mb-5">
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-3">
            {session.ownerRole ? `Sensei — ${session.ownerRole}` : 'Analysis'}
          </p>
          <p className="text-secondary text-sm leading-relaxed whitespace-pre-wrap">{attempt.analysis}</p>
        </div>
      )}

      {/* Topics to review */}
      {attempt?.topicsToReview && attempt.topicsToReview.length > 0 && (
        <div className="mb-8">
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-3">Topics to review</p>
          <div className="flex flex-wrap gap-2">
            {attempt.topicsToReview.map((t) => (
              <span
                key={t}
                className="text-warning text-xs font-mono px-2.5 py-1 border border-warning/30 rounded-sm"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No attempt data */}
      {!attempt && session.status !== 'active' && (
        <div className="p-5 bg-surface border border-border rounded-md mb-5">
          <p className="text-muted text-sm">No evaluation data available for this session.</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-border/40">
        <button
          onClick={() => navigate('/dashboard', { replace: true })}
          className="flex-1 py-2.5 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
        >
          Return to dashboard
        </button>
      </div>

      {/* Footer */}
      <p className="text-center text-muted text-xs font-mono mt-8">Consistency compounds.</p>
    </div>
  )
}
