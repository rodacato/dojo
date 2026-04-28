import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { admin } from '../../lib/api/admin'
import { Pagination } from '../../components/ui/Pagination'
import { AdminBreadcrumb } from './_form-parts'

type ErrorRow = Awaited<ReturnType<typeof admin.getErrors>>['rows'][number]

const PAGE_SIZE = 25

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: '400', label: '400' },
  { value: '401', label: '401' },
  { value: '403', label: '403' },
  { value: '404', label: '404' },
  { value: '409', label: '409' },
  { value: '422', label: '422' },
  { value: '429', label: '429' },
  { value: '500', label: '500' },
  { value: '502', label: '502' },
  { value: '503', label: '503' },
  { value: '504', label: '504' },
]

export function AdminErrorsPage() {
  const [rows, setRows] = useState<ErrorRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [source, setSource] = useState<'all' | 'api' | 'web'>('all')
  const [status, setStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [secondsToRefresh, setSecondsToRefresh] = useState(30)
  const lastFetchedAt = useRef<number>(0)

  const fetchRows = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (opts.silent) setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const result = await admin.getErrors({
          source: source === 'all' ? undefined : source,
          status: status === 'all' ? undefined : Number(status),
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        })
        setRows(result.rows)
        setTotal(result.total)
        lastFetchedAt.current = Date.now()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load errors')
      } finally {
        setLoading(false)
        setRefreshing(false)
        setSecondsToRefresh(30)
      }
    },
    [source, status, page],
  )

  useEffect(() => {
    void fetchRows()
  }, [fetchRows])

  useEffect(() => {
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastFetchedAt.current) / 1000)
      const remaining = Math.max(0, 30 - elapsed)
      setSecondsToRefresh(remaining)
      if (remaining === 0) {
        void fetchRows({ silent: true })
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [fetchRows])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const startIdx = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endIdx = Math.min(page * PAGE_SIZE, total)

  function resetPageOn<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setPage(1)
    }
  }

  async function copyTrace(row: ErrorRow) {
    const lines = [
      `${row.method ?? '—'} ${row.route ?? '—'} → ${row.status ?? '—'}`,
      `time: ${row.createdAt}`,
      `source: ${row.source}`,
      `request_id: ${row.requestId ?? '—'}`,
      `user_id: ${row.userId ?? '—'}`,
      '',
      `message: ${row.message}`,
    ]
    if (row.stack) lines.push('', 'stack:', row.stack)
    if (row.context) lines.push('', 'context:', JSON.stringify(row.context, null, 2))
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(row.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const refreshLabel = useMemo(() => {
    if (refreshing) return 'Refreshing'
    if (secondsToRefresh === 0) return 'Refreshing'
    return `Auto in ${secondsToRefresh}s`
  }, [refreshing, secondsToRefresh])

  return (
    <div className="max-w-7xl">
      <AdminBreadcrumb trail={['ADMIN', 'ERRORS']} />

      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-[24px] font-semibold text-primary leading-tight">Error log</h1>
          <div className="mt-1 text-[13px] text-muted">
            Errors logged across api and web. Retention: 30 days.
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted flex items-center gap-2">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                refreshing ? 'bg-accent animate-pulse' : 'bg-success/70'
              }`}
              aria-hidden
            />
            {refreshLabel}
          </span>
          <button
            type="button"
            onClick={() => void fetchRows({ silent: true })}
            disabled={refreshing}
            className="font-mono text-[11px] uppercase tracking-wider text-secondary hover:text-primary transition-colors disabled:text-muted disabled:cursor-wait"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 rounded-md border border-border bg-surface">
        <FilterSelect
          label="Source"
          value={source}
          onChange={resetPageOn((v) => setSource(v))}
          options={[
            { value: 'all', label: 'ALL' },
            { value: 'api', label: 'API' },
            { value: 'web', label: 'WEB' },
          ]}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={resetPageOn((v) => setStatus(v))}
          options={STATUS_OPTIONS}
        />
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted ml-auto">
          {total} total
        </span>
      </div>

      <div className="rounded-md border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <colgroup>
              <col className="w-32" />
              <col className="w-20" />
              <col className="w-16" />
              <col className="w-20" />
              <col className="w-56" />
              <col />
              <col className="w-12" />
            </colgroup>
            <thead>
              <tr className="border-b border-border">
                <Th>Time</Th>
                <Th>Source</Th>
                <Th>Status</Th>
                <Th>Method</Th>
                <Th>Route</Th>
                <Th>Message</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted font-mono">
                    Loading_
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-danger font-mono">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted text-[13px]">
                    No errors in this window. Nice.
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const isOpen = expanded === row.id
                const ts = new Date(row.createdAt)
                return (
                  <FragmentRow key={row.id}>
                    <tr
                      onClick={() => setExpanded(isOpen ? null : row.id)}
                      className="border-b border-border last:border-b-0 hover:bg-elevated transition-colors cursor-pointer"
                    >
                      <td className="px-4 h-12 align-middle">
                        <div className="font-mono tabular-nums text-primary">
                          {ts.toISOString().slice(11, 19)}
                        </div>
                        <div className="font-mono text-[11px] text-muted mt-0.5">
                          {ts.toISOString().slice(5, 10)}
                        </div>
                      </td>
                      <td className="px-4 h-12 align-middle">
                        <SourcePill source={row.source} />
                      </td>
                      <td className={`px-4 h-12 align-middle font-mono ${statusColor(row.status)}`}>
                        {row.status ?? '—'}
                      </td>
                      <td className={`px-4 h-12 align-middle font-mono ${methodColor(row.method)}`}>
                        {row.method ?? '—'}
                      </td>
                      <td className="px-4 h-12 align-middle font-mono text-primary truncate max-w-56">
                        {row.route ?? '—'}
                      </td>
                      <td className="px-4 h-12 align-middle text-secondary truncate">
                        {row.message}
                      </td>
                      <td className="px-4 h-12 align-middle text-center text-muted">
                        <span className={`inline-block transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                          ↓
                        </span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-elevated border-b border-border last:border-b-0">
                        <td colSpan={7} className="px-4 py-4">
                          <ExpandedDetail row={row} onCopy={() => copyTrace(row)} copied={copied === row.id} />
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && total > 0 && (
        <div className="flex items-center justify-between mt-6 font-mono text-[11px] uppercase tracking-wider text-muted">
          <span>
            Showing {startIdx}–{endIdx} of {total}
          </span>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            ariaLabel="Errors pagination"
            size="sm"
          />
        </div>
      )}
    </div>
  )
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function ExpandedDetail({
  row,
  onCopy,
  copied,
}: {
  row: ErrorRow
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
          {row.requestId ? <>request_id: <span className="text-secondary normal-case tracking-normal">{row.requestId}</span></> : 'no request_id'}
          {row.userId && (
            <>
              <span className="mx-2">·</span>
              user_id: <span className="text-secondary normal-case tracking-normal">{row.userId}</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-primary transition-colors"
        >
          {copied ? 'Copied' : 'Copy trace'}
        </button>
      </div>
      {row.stack && (
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">stack</div>
          <pre className="bg-page border border-border rounded-sm p-3 overflow-x-auto font-mono text-[11px] text-secondary whitespace-pre-wrap">
            {row.stack}
          </pre>
        </div>
      )}
      {row.context && (
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">context</div>
          <pre className="bg-page border border-border rounded-sm p-3 overflow-x-auto font-mono text-[11px] text-secondary whitespace-pre-wrap">
            {JSON.stringify(row.context, null, 2)}
          </pre>
        </div>
      )}
      {!row.stack && !row.context && (
        <div className="font-mono text-[11px] text-muted">No additional context.</div>
      )}
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="h-10 px-4 text-left font-mono text-[11px] uppercase tracking-wider text-muted">
      {children}
    </th>
  )
}

function SourcePill({ source }: { source: string }) {
  return (
    <span className="font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-muted/15 text-secondary border border-border">
      {source}
    </span>
  )
}

function statusColor(status: number | null): string {
  if (status == null) return 'text-muted'
  if (status >= 500) return 'text-danger'
  if (status >= 400) return 'text-warning'
  return 'text-secondary'
}

function methodColor(method: string | null): string {
  if (method === 'WS') return 'text-accent'
  if (method == null) return 'text-muted'
  return 'text-secondary'
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

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
