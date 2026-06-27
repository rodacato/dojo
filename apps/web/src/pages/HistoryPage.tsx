import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { Button } from '../components/ui/Button'
import { Pagination } from '../components/ui/Pagination'
import { SkeletonList } from '../components/ui/SkeletonLoader'
import { EmptyState } from '../components/ui/EmptyState'
import { DenseSessionRow } from '../components/ui/DenseSessionRow'
import type { KataType, Difficulty, Verdict } from '@dojo/shared'

interface HistorySession {
  id: string
  status: string
  kataTitle: string
  kataType: string
  difficulty: string
  verdict: string | null
  startedAt: string
  completedAt: string | null
}

export function HistoryPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { data, loading } = useAsync(() => api.getHistory(page), [page])

  const sessions: HistorySession[] = data?.sessions ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  let sessionList: ReactNode
  if (loading && sessions.length === 0) {
    sessionList = <SkeletonList rows={8} />
  } else if (sessions.length === 0) {
    sessionList = (
      <EmptyState
        eyebrow="Empty · Kata history"
        headline="No sessions yet. The dojo is patient."
        microcopy="Your first kata is also the hardest one."
        action={
          <Button variant="primary" size="md" onClick={() => navigate('/katas')}>
            Enter the dojo →
          </Button>
        }
      />
    )
  } else {
    sessionList = (
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        {sessions.map((s) => (
          <DenseSessionRow
            key={s.id}
            type={s.kataType as KataType}
            difficulty={s.difficulty as Difficulty}
            title={s.kataTitle}
            verdict={s.verdict as Verdict | null}
            status={s.status}
            startedAt={s.startedAt}
            completedAt={s.completedAt}
            onClick={() => navigate(`/katas/${s.id}/result`)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="px-4 md:px-6 py-8 max-w-7xl mx-auto">
      <p className="text-muted text-xs font-mono tracking-[0.08em] uppercase mb-6">
        Dashboard / Kata history
      </p>

      <div className="flex items-end justify-between gap-4 mb-8">
        <h1 className="text-primary text-2xl md:text-2xl font-semibold leading-tight tracking-tight">
          Kata history
        </h1>
        {total > 0 && (
          <div className="text-right shrink-0">
            <span className="block font-mono text-2xl text-primary tabular-nums leading-none">
              {total}
            </span>
            <span className="block text-muted text-sm mt-1">completed kata</span>
          </div>
        )}
      </div>

      {sessionList}

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

      <p className="text-center text-muted text-xs font-mono tracking-[0.08em] uppercase mt-12 opacity-70">
        Every session is a receipt.
      </p>
    </div>
  )
}
