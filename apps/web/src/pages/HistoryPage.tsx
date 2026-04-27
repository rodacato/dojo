import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { PageLoader } from '../components/PageLoader'
import { Button } from '../components/ui/Button'
import { DenseSessionRow } from '../components/ui/DenseSessionRow'
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
    <div className="px-4 md:px-6 py-8 max-w-7xl mx-auto">
      <p className="text-muted text-[10px] font-mono tracking-[0.08em] uppercase mb-6">
        Dashboard / Kata history
      </p>

      <div className="flex items-end justify-between gap-4 mb-8">
        <h1 className="text-primary text-2xl md:text-[32px] font-semibold leading-tight tracking-tight">
          Kata history
        </h1>
        {total > 0 && (
          <div className="text-right shrink-0">
            <span className="block font-mono text-2xl text-primary tabular-nums leading-none">
              {total}
            </span>
            <span className="block text-muted text-[13px] mt-1">completed kata</span>
          </div>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="bg-surface border border-border rounded-md py-16 px-4 flex flex-col items-center text-center gap-4">
          <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted">Empty</p>
          <p className="text-secondary text-lg">No sessions yet. The dojo is patient.</p>
          <Button variant="primary" size="md" onClick={() => navigate('/start')}>
            Enter the dojo →
          </Button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden">
          {sessions.map((s) => (
            <DenseSessionRow
              key={s.id}
              type={s.exerciseType as ExerciseType}
              difficulty={s.difficulty as Difficulty}
              title={s.exerciseTitle}
              verdict={s.verdict as Verdict | null}
              status={s.status}
              startedAt={s.startedAt}
              completedAt={s.completedAt}
              onClick={() => navigate(`/kata/${s.id}/result`)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}

      <p className="text-center text-muted text-[10px] font-mono tracking-[0.08em] uppercase mt-12 opacity-70">
        Every session is a receipt.
      </p>
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (next: number) => void
}) {
  const pages = pageWindow(page, totalPages)
  return (
    <nav className="flex items-center justify-center gap-3 mt-8" aria-label="History pagination">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="font-mono text-[13px] text-secondary hover:text-primary transition-colors disabled:text-muted disabled:cursor-not-allowed"
      >
        ← Previous
      </button>
      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="font-mono text-[13px] text-muted px-2">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`font-mono text-[13px] tabular-nums w-8 h-8 inline-flex items-center justify-center rounded-sm transition-colors ${
                p === page
                  ? 'border border-accent text-primary'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {p}
            </button>
          ),
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="font-mono text-[13px] text-secondary hover:text-primary transition-colors disabled:text-muted disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </nav>
  )
}

function pageWindow(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const window: (number | '…')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  if (start > 2) window.push('…')
  for (let i = start; i <= end; i++) window.push(i)
  if (end < totalPages - 1) window.push('…')
  window.push(totalPages)
  return window
}
