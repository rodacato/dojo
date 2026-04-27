import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { PageLoader } from '../components/PageLoader'
import { LogoWordmark } from '../components/Logo'
import { TypeBadge, DifficultyBadge, VerdictBadge } from '../components/ui/Badge'
import type { ExerciseType, Difficulty, Verdict } from '@dojo/shared'

interface HistorySession {
  id: string
  status: string
  exerciseTitle: string
  exerciseType: string
  difficulty: string
  verdict: string | null
  startedAt: string
  completedAt: string | null
}

export function HistoryPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<HistorySession[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getHistory(page).then((data) => {
      setSessions(data.sessions)
      setTotalPages(data.totalPages)
      setTotal(data.total)
      setLoading(false)
    })
  }, [page])

  if (loading && sessions.length === 0) return <PageLoader />

  return (
    <div className="min-h-screen bg-page px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <LogoWordmark />
        <button
          onClick={() => navigate('/dashboard')}
          className="text-secondary text-sm font-mono hover:text-primary transition-colors"
        >
          ← Dashboard
        </button>
      </header>

      {/* Title */}
      <div className="mb-6">
        <h1 className="font-mono text-xl text-primary">Kata history</h1>
        <p className="text-muted text-sm mt-1">{total} sessions completed</p>
      </div>

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <div className="bg-surface border border-border rounded-md p-8 text-center">
          <p className="text-secondary text-sm">No kata completed yet.</p>
          <button
            onClick={() => navigate('/start')}
            className="mt-4 px-5 py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
          >
            Enter the dojo →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate(`/kata/${s.id}/result`)}
              className="w-full flex items-center justify-between p-3 bg-surface border border-border rounded-sm hover:border-accent/40 transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <TypeBadge type={s.exerciseType as ExerciseType} />
                <DifficultyBadge difficulty={s.difficulty as Difficulty} />
                <span className="text-secondary text-sm truncate">{s.exerciseTitle}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {s.verdict && <VerdictBadge verdict={s.verdict as Verdict} />}
                <span className="text-muted text-xs font-mono">
                  {new Date(s.startedAt).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-secondary text-sm font-mono hover:text-primary transition-colors disabled:text-muted disabled:cursor-not-allowed"
          >
            ← prev
          </button>
          <span className="text-muted text-xs font-mono">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-secondary text-sm font-mono hover:text-primary transition-colors disabled:text-muted disabled:cursor-not-allowed"
          >
            next →
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center">
        <p className="text-muted text-xs font-mono">Every session is a receipt.</p>
      </footer>
    </div>
  )
}
