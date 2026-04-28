import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ExerciseType, Difficulty } from '@dojo/shared'
import { api, type AdminExerciseDTO } from '../../lib/api'
import { TypeBadge, DifficultyBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'

type StatusFilter = 'all' | 'published' | 'draft' | 'archived'
type TypeFilter = 'all' | 'code' | 'chat' | 'whiteboard' | 'review'
type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard'
type SortKey = 'newest' | 'oldest' | 'most_sessions' | 'highest_score'

const PAGE_SIZE = 12

export function AdminExercisesPage() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState<AdminExerciseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [page, setPage] = useState(1)

  useEffect(() => {
    api
      .getAdminExercises()
      .then(setExercises)
      .finally(() => setLoading(false))
  }, [])

  const counts = useMemo(() => {
    const c = { published: 0, draft: 0, archived: 0 }
    for (const ex of exercises) {
      if (ex.status === 'published') c.published++
      else if (ex.status === 'draft') c.draft++
      else if (ex.status === 'archived') c.archived++
    }
    return c
  }, [exercises])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return exercises.filter((ex) => {
      if (q && !ex.title.toLowerCase().includes(q)) return false
      if (typeFilter !== 'all' && ex.type !== typeFilter) return false
      if (difficultyFilter !== 'all' && ex.difficulty !== difficultyFilter) return false
      if (statusFilter !== 'all' && ex.status !== statusFilter) return false
      return true
    })
  }, [exercises, search, typeFilter, difficultyFilter, statusFilter])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    switch (sort) {
      case 'newest':
        return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      case 'oldest':
        return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      case 'most_sessions':
        return copy.sort((a, b) => b.sessionCount - a.sessionCount)
      case 'highest_score':
        return copy.sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1))
    }
  }, [filtered, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const startIdx = sorted.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const endIdx = Math.min(safePage * PAGE_SIZE, sorted.length)

  function resetPageOn<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setPage(1)
    }
  }

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-4">
        ADMIN / EXERCISES
      </div>

      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-[24px] font-semibold text-primary leading-tight">Exercises</h1>
          <div className="mt-1 text-[13px] text-muted">
            <span className="text-success">{counts.published} published</span>
            <span className="mx-2">·</span>
            <span>{counts.draft} draft</span>
            <span className="mx-2">·</span>
            <span>{counts.archived} archived</span>
          </div>
        </div>
        <Button onClick={() => navigate('/admin/exercises/new')}>+ New exercise</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 rounded-md border border-border bg-surface">
        <div className="relative flex-1 min-w-60">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search title..."
            className="w-full h-8 pl-9 pr-3 rounded-sm border border-border bg-page text-[13px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
          />
        </div>
        <FilterSelect
          label="Type"
          value={typeFilter}
          onChange={resetPageOn(setTypeFilter)}
          options={[
            { value: 'all', label: 'ALL' },
            { value: 'code', label: 'CODE' },
            { value: 'chat', label: 'CHAT' },
            { value: 'whiteboard', label: 'WHITEBOARD' },
            { value: 'review', label: 'REVIEW' },
          ]}
        />
        <FilterSelect
          label="Difficulty"
          value={difficultyFilter}
          onChange={resetPageOn(setDifficultyFilter)}
          options={[
            { value: 'all', label: 'ALL' },
            { value: 'easy', label: 'EASY' },
            { value: 'medium', label: 'MEDIUM' },
            { value: 'hard', label: 'HARD' },
          ]}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={resetPageOn(setStatusFilter)}
          options={[
            { value: 'all', label: 'ALL' },
            { value: 'published', label: 'PUBLISHED' },
            { value: 'draft', label: 'DRAFT' },
            { value: 'archived', label: 'ARCHIVED' },
          ]}
        />
        <FilterSelect
          label="Sort"
          value={sort}
          onChange={resetPageOn(setSort)}
          options={[
            { value: 'newest', label: 'NEWEST' },
            { value: 'oldest', label: 'OLDEST' },
            { value: 'most_sessions', label: 'MOST RUN' },
            { value: 'highest_score', label: 'HIGH SCORE' },
          ]}
        />
      </div>

      <div className="rounded-md border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <colgroup>
              <col className="w-16" />
              <col className="w-22" />
              <col />
              <col className="w-24" />
              <col className="w-24" />
              <col className="w-28" />
            </colgroup>
            <thead>
              <tr className="border-b border-border">
                <Th>Type</Th>
                <Th>Difficulty</Th>
                <Th>Title</Th>
                <Th align="right">Sessions</Th>
                <Th align="right">Avg score</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted font-mono text-[13px]">
                    Loading_
                  </td>
                </tr>
              )}
              {!loading && pageRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted text-[13px]">
                    No exercises match the current filters.
                  </td>
                </tr>
              )}
              {!loading &&
                pageRows.map((ex) => {
                  const archived = ex.status === 'archived'
                  return (
                    <tr
                      key={ex.id}
                      onClick={() => navigate(`/admin/exercises/${ex.id}/edit`)}
                      className="border-b border-border last:border-b-0 hover:bg-elevated transition-colors cursor-pointer"
                    >
                      <td className="px-4 h-14 align-middle">
                        <TypeBadge type={ex.type as ExerciseType} />
                      </td>
                      <td className="px-4 h-14 align-middle">
                        <DifficultyBadge difficulty={ex.difficulty as Difficulty} />
                      </td>
                      <td className="px-4 h-14 align-middle">
                        <span
                          className={`text-[15px] font-medium text-primary ${
                            archived ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {ex.title}
                        </span>
                      </td>
                      <td className="px-4 h-14 align-middle text-right font-mono tabular-nums text-[15px] text-primary">
                        {ex.sessionCount.toLocaleString()}
                      </td>
                      <td
                        className={`px-4 h-14 align-middle text-right font-mono tabular-nums text-[15px] ${avgScoreClass(
                          ex.avgScore,
                        )}`}
                      >
                        {ex.avgScore !== null ? `${Math.round(ex.avgScore * 100)}%` : '—'}
                      </td>
                      <td className="px-4 h-14 align-middle">
                        <StatusBadge status={ex.status} />
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && sorted.length > 0 && (
        <div className="flex items-center justify-between mt-6 font-mono text-[11px] uppercase tracking-wider text-muted">
          <span>
            Showing {startIdx}–{endIdx} of {sorted.length}
          </span>
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onChange={setPage}
            ariaLabel="Exercises pagination"
            size="sm"
          />
        </div>
      )}
    </div>
  )
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`h-10 px-4 font-mono text-[11px] uppercase tracking-wider text-muted ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: 'bg-success/10 text-success border border-success/30',
    draft: 'bg-muted/15 text-secondary border border-border',
    archived: 'bg-danger/10 text-danger border border-danger/30',
  }
  return (
    <span
      className={`font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-sm ${
        styles[status] ?? styles['draft']
      }`}
    >
      {status}
    </span>
  )
}

function avgScoreClass(score: number | null) {
  if (score === null) return 'text-muted'
  if (score >= 0.7) return 'text-success/80'
  if (score >= 0.4) return 'text-warning/80'
  return 'text-danger/80'
}

interface FilterOption<T extends string> {
  value: T
  label: string
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: FilterOption<T>[]
}) {
  const current = options.find((o) => o.value === value)?.label ?? ''
  return (
    <label className="relative inline-flex items-center h-8 px-3 rounded-sm border border-border bg-page font-mono text-[11px] uppercase tracking-wider text-secondary hover:border-accent transition-colors cursor-pointer">
      <span className="text-muted mr-1">{label}:</span>
      <span className="text-primary mr-1">{current}</span>
      <ChevronDownIcon className="w-3 h-3 text-muted" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
