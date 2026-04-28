import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Pagination } from '../components/ui/Pagination'
import { SkeletonList } from '../components/ui/SkeletonLoader'
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

      {loading && sessions.length === 0 ? (
        <SkeletonList rows={8} />
      ) : sessions.length === 0 ? (
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
        <div className="flex justify-center mt-8">
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            ariaLabel="History pagination"
          />
        </div>
      )}

      <p className="text-center text-muted text-[10px] font-mono tracking-[0.08em] uppercase mt-12 opacity-70">
        Every session is a receipt.
      </p>
    </div>
  )
}
