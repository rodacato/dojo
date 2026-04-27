import { useEffect, useState } from 'react'
import { admin } from '../../lib/api/admin'

type ErrorRow = Awaited<ReturnType<typeof admin.getErrors>>['rows'][number]

const PAGE_SIZE = 50

export function AdminErrorsPage() {
  const [rows, setRows] = useState<ErrorRow[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [source, setSource] = useState<'api' | 'web' | ''>('')
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    admin
      .getErrors({
        source: source || undefined,
        status: status ? Number(status) : undefined,
        limit: PAGE_SIZE,
        offset,
      })
      .then((r) => {
        if (cancelled) return
        setRows(r.rows)
        setTotal(r.total)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load errors')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [source, status, offset])

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-lg text-primary">Errors</h1>
        <span className="text-muted text-xs font-mono">
          {total} total · page {Math.floor(offset / PAGE_SIZE) + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          value={source}
          onChange={(e) => { setSource(e.target.value as 'api' | 'web' | ''); setOffset(0) }}
          className="bg-surface border border-border rounded-sm px-2 py-1.5 text-secondary text-xs font-mono focus:outline-none focus:border-accent"
        >
          <option value="">all sources</option>
          <option value="api">api</option>
          <option value="web">web</option>
        </select>
        <input
          value={status}
          onChange={(e) => { setStatus(e.target.value); setOffset(0) }}
          placeholder="status"
          inputMode="numeric"
          className="bg-surface border border-border rounded-sm px-2 py-1.5 text-secondary text-xs font-mono w-24 focus:outline-none focus:border-accent"
        />
      </div>

      {loading && <p className="text-muted font-mono text-sm">loading...</p>}
      {error && <p className="text-danger font-mono text-sm">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="text-muted font-mono text-sm">No errors in the window. Nice.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="border border-border/40 rounded-sm overflow-hidden">
          {rows.map((r, i) => (
            <div key={r.id} className={i > 0 ? 'border-t border-border/20' : ''}>
              <button
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-surface transition-colors"
              >
                <span className="text-muted text-[10px] font-mono w-32 shrink-0">
                  {new Date(r.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm w-10 text-center shrink-0 ${
                  r.source === 'api' ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'
                }`}>
                  {r.source}
                </span>
                <span className="text-[10px] font-mono text-danger w-10 shrink-0">
                  {r.status ?? '—'}
                </span>
                <span className="text-muted text-[11px] font-mono w-48 truncate shrink-0">
                  {r.method ? `${r.method} ` : ''}{r.route ?? ''}
                </span>
                <span className="text-secondary text-xs font-mono truncate flex-1">
                  {r.message}
                </span>
              </button>
              {expanded === r.id && (
                <div className="px-4 pb-3 bg-surface/50 space-y-2 text-xs font-mono">
                  {r.requestId && (
                    <div><span className="text-muted">request_id:</span> <span className="text-secondary">{r.requestId}</span></div>
                  )}
                  {r.userId && (
                    <div><span className="text-muted">user_id:</span> <span className="text-secondary">{r.userId}</span></div>
                  )}
                  {r.stack && (
                    <div>
                      <p className="text-muted mb-1">stack:</p>
                      <pre className="bg-page border border-border/40 rounded-sm p-2 overflow-x-auto text-[11px] text-secondary whitespace-pre-wrap">{r.stack}</pre>
                    </div>
                  )}
                  {r.context && (
                    <div>
                      <p className="text-muted mb-1">context:</p>
                      <pre className="bg-page border border-border/40 rounded-sm p-2 overflow-x-auto text-[11px] text-secondary whitespace-pre-wrap">{JSON.stringify(r.context, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={offset === 0 || loading}
            className="px-3 py-1.5 border border-border text-secondary font-mono text-xs rounded-sm hover:border-accent disabled:opacity-30 transition-colors"
          >
            ← prev
          </button>
          <button
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={offset + PAGE_SIZE >= total || loading}
            className="px-3 py-1.5 border border-border text-secondary font-mono text-xs rounded-sm hover:border-accent disabled:opacity-30 transition-colors"
          >
            next →
          </button>
        </div>
      )}
    </div>
  )
}
