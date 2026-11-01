import { useCallback, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import type { Difficulty, HistoryOutcomeFilter, HistoryPageDTO, HistorySessionDTO, KataType, Verdict } from '@dojo/shared'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { useOnline } from '../hooks/useOnline'
import { Button } from '../components/ui/Button'
import { LoadState } from '../components/ui/LoadState'
import { SkeletonList } from '../components/ui/SkeletonLoader'
import { DenseSessionRow } from '../components/ui/DenseSessionRow'
import { HISTORY_OUTCOME_OPTIONS, HISTORY_SEARCH_ID, HistoryFilters } from '../components/history/HistoryFilters'

const PAGE_SIZE = 20

function readFilters(params: URLSearchParams) {
  const rawOutcome = params.get('outcome')
  const outcome = HISTORY_OUTCOME_OPTIONS.find((option) => option.value === rawOutcome)?.value ?? 'all'
  const q = (params.get('q') ?? '').trim().slice(0, 120)
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '', 10) || 1)
  return { outcome, q, page }
}

function writeFilters(filters: { outcome: HistoryOutcomeFilter; q: string; page: number }) {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.outcome !== 'all') params.set('outcome', filters.outcome)
  if (filters.page > 1) params.set('page', String(filters.page))
  return params
}

const CENTERED_STATE = 'max-w-2xl mx-auto text-center'

export function HistoryPage() {
  const navigate = useNavigate()
  const { online } = useOnline()
  const [searchParams, setSearchParams] = useSearchParams()
  const { outcome, q, page } = readFilters(searchParams)

  const filterKey = `${outcome}:${q}`
  const { data, loading, error, reload } = useAsync(
    () => api.getHistory(page, { outcome, q }).then((result) => ({ ...result, filterKey })),
    [page, outcome, q],
  )

  const showsCurrentFilters = data?.filterKey === filterKey
  const record = error && !showsCurrentFilters ? null : data
  const hasRecord = data !== null && data.recordTotal > 0

  const applyQuery = useCallback(
    (next: string) => setSearchParams(writeFilters({ outcome, q: next, page: 1 }), { replace: true }),
    [outcome, setSearchParams],
  )
  const applyOutcome = (next: HistoryOutcomeFilter) =>
    setSearchParams(writeFilters({ outcome: next, q, page: 1 }), { replace: true })

  const focusFirstDay = useRef(false)
  const firstDayRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (loading || error || !focusFirstDay.current) return
    focusFirstDay.current = false
    firstDayRef.current?.focus()
  }, [loading, error, data])

  function goToPage(next: number) {
    focusFirstDay.current = true
    if (next === page) reload()
    else setSearchParams(writeFilters({ outcome, q, page: next }))
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { replace: true })
    document.getElementById(HISTORY_SEARCH_ID)?.focus()
  }

  return (
    <div className="paper-container py-8 md:py-12">
      <p className="paper-eyebrow mb-4">
        <Link to="/dashboard" className="inline-flex items-center min-h-11 text-accent-text hover:underline transition-colors">
          Dashboard
        </Link>{' '}
        / Kata history
      </p>

      <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
        <h1 className="paper-heading max-md:text-[32px] min-[360px]:max-md:text-[36px] max-md:leading-[1.06]">Kata history</h1>
        <RecordCount record={data} />
      </div>

      {hasRecord && (
        <HistoryFilters
          query={q}
          outcome={outcome}
          disabled={!online}
          onQueryChange={applyQuery}
          onOutcomeChange={applyOutcome}
        />
      )}

      {record === null && !error && (
        <LoadState status="loading" eyebrow="Loading kata history">
          <SkeletonList rows={8} />
        </LoadState>
      )}
      {record === null && !!error && (
        <div className={CENTERED_STATE}>
          <LoadState status="error" flush eyebrow="Error · Kata history" title="We couldn't load your history." onRetry={reload} />
        </div>
      )}
      {record?.recordTotal === 0 && <EmptyRecord onStart={() => navigate('/katas')} />}
      {record && record.recordTotal > 0 && (
        <Results
          record={record}
          filtered={q !== '' || outcome !== 'all'}
          loading={loading}
          online={online}
          pageFailed={!!error}
          requestedPage={page}
          firstDayRef={firstDayRef}
          onClearFilters={clearFilters}
          onGoToPage={goToPage}
        />
      )}

      <p className="paper-note uppercase mt-10 pt-6 border-t border-border">Every session is a receipt.</p>
    </div>
  )
}

function RecordCount({ record }: Readonly<{ record: HistoryPageDTO | null }>) {
  if (!record || record.recordTotal === 0) return null
  const number = 'font-mono text-[28px] md:text-[32px] text-primary tabular-nums leading-none'
  return (
    <div className="flex items-baseline gap-2 shrink-0">
      <span className={number}>{record.recordTotal}</span>
      <span className="paper-note">{record.recordTotal === 1 ? 'session' : 'sessions'}</span>
    </div>
  )
}

function EmptyRecord({ onStart }: Readonly<{ onStart: () => void }>) {
  return (
    <section className="border-t border-border pt-7 pb-10 md:pt-10 md:pb-16">
      <div className={CENTERED_STATE}>
        <p className="paper-eyebrow">Empty · Kata history</p>
        <h2 className="text-[28px] leading-[1.25] tracking-[-0.7px] font-bold text-primary mt-3 mb-4 max-w-[22ch] mx-auto">
          No sessions yet. The dojo is patient.
        </h2>
        <p className="text-secondary text-base">Your first kata is also the hardest one.</p>
        <Button size="xl" className="mt-6 max-md:w-full" onClick={onStart}>
          Enter the dojo →
        </Button>
      </div>
    </section>
  )
}

interface ResultsProps {
  record: HistoryPageDTO
  filtered: boolean
  loading: boolean
  online: boolean
  pageFailed: boolean
  requestedPage: number
  firstDayRef: React.RefObject<HTMLHeadingElement | null>
  onClearFilters: () => void
  onGoToPage: (page: number) => void
}

function Results({ record, filtered, loading, online, pageFailed, requestedPage, firstDayRef, onClearFilters, onGoToPage }: Readonly<ResultsProps>) {
  const location = useLocation()
  const from = location.pathname + location.search
  const days = groupByDay(record.sessions)

  return (
    <div aria-busy={loading}>
      <div className="min-h-18 flex items-center gap-x-4 flex-wrap">
        <p className="paper-note" role="status">
          {loading ? 'Loading…' : countLabel(record, filtered)}
        </p>
        {filtered && (
          <Button variant="subtle" size="lg" className="px-0 text-[11px]! text-accent-text!" disabled={!online} onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
        {!online && <p className="paper-note md:ml-auto">Offline. Showing previously loaded sessions.</p>}
      </div>

      {record.total === 0 ? (
        <section className="border-t border-border pt-5 pb-16">
          <div className={CENTERED_STATE}>
            <h2 className="text-2xl font-bold text-primary mb-4">No matching sessions.</h2>
            <p className="text-secondary text-base">Try another title or clear the filters. Your history is still here.</p>
          </div>
        </section>
      ) : (
        days.map((day, index) => (
          <section key={day.key} aria-labelledby={`history-day-${day.key}`} className="mb-5 md:mb-6">
            <h2
              id={`history-day-${day.key}`}
              ref={index === 0 ? firstDayRef : undefined}
              tabIndex={index === 0 ? -1 : undefined}
              className="paper-eyebrow flex items-center min-h-10"
            >
              <time dateTime={day.key}>{day.label}</time>
            </h2>
            <ul className="border-t border-border">
              {day.sessions.map((session) => (
                <li key={session.id}>
                  <DenseSessionRow
                    type={session.kataType as KataType}
                    difficulty={session.difficulty as Difficulty}
                    title={session.kataTitle}
                    verdict={session.verdict as Verdict | null}
                    status={session.status}
                    outcome={session.outcome}
                    startedAt={session.startedAt}
                    completedAt={session.completedAt}
                    showClock
                    to={`/katas/${session.id}/result`}
                    linkState={{ from }}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {pageFailed && (
        <div role="alert" className="border-t border-border py-5 flex max-md:flex-col md:items-center justify-between gap-x-6 gap-y-3">
          <p className="text-sm text-danger-text">We couldn't load that page. Your current page is still here.</p>
          <Button variant="ghost" size="lg" className="shrink-0" onClick={() => onGoToPage(requestedPage)}>
            Retry page {requestedPage}
          </Button>
        </div>
      )}

      {record.totalPages > 1 && (
        <nav aria-label="History pagination" className="border-t border-border pt-6 flex items-center justify-between md:justify-center gap-3 md:gap-6">
          <Button
            variant="ghost"
            size="lg"
            className="px-3 md:px-6"
            disabled={record.page <= 1 || loading || !online}
            onClick={() => onGoToPage(record.page - 1)}
          >
            ← Prev
          </Button>
          <p className="paper-note tabular-nums whitespace-nowrap">
            Page {record.page} of {record.totalPages}
          </p>
          <Button
            variant="ghost"
            size="lg"
            className="px-3 md:px-6"
            disabled={record.page >= record.totalPages || loading || !online}
            onClick={() => onGoToPage(record.page + 1)}
          >
            Next →
          </Button>
        </nav>
      )}
    </div>
  )
}

function countLabel(record: HistoryPageDTO, filtered: boolean) {
  if (filtered) return `${record.total} of ${record.recordTotal} sessions`
  const first = (record.page - 1) * PAGE_SIZE + 1
  return `${first}–${first + record.sessions.length - 1} of ${record.total} sessions`
}

function groupByDay(sessions: HistorySessionDTO[]) {
  const days: Array<{ key: string; label: string; sessions: HistorySessionDTO[] }> = []
  for (const session of sessions) {
    const startedAt = new Date(session.startedAt)
    const key = localDayKey(startedAt)
    const day = days.find((candidate) => candidate.key === key)
    if (day) day.sessions.push(session)
    else days.push({ key, label: dayLabel(startedAt), sessions: [session] })
  }
  return days
}

function localDayKey(date: Date) {
  return date.toLocaleDateString('en-CA')
}

function dayLabel(date: Date) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const key = localDayKey(date)
  let prefix = ''
  if (key === localDayKey(new Date())) prefix = 'Today · '
  else if (key === localDayKey(yesterday)) prefix = 'Yesterday · '
  return prefix + date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
