interface PaginationProps {
  page: number
  totalPages: number
  onChange: (next: number) => void
  ariaLabel?: string
  size?: 'sm' | 'md'
}

export function Pagination({ page, totalPages, onChange, ariaLabel = 'Pagination', size = 'md' }: PaginationProps) {
  if (totalPages <= 1) return null
  const pages = pageWindow(page, totalPages)
  const text = size === 'sm' ? 'text-[11px]' : 'text-[13px]'
  const cell = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'
  const upperLabel = size === 'sm' ? 'uppercase tracking-wider' : ''
  return (
    <nav className={`flex items-center gap-2 font-mono ${text}`} aria-label={ariaLabel}>
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className={`${upperLabel} text-secondary hover:text-primary transition-colors disabled:text-muted disabled:cursor-not-allowed`}
      >
        ← Prev
      </button>
      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="text-muted px-1">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`${cell} tabular-nums inline-flex items-center justify-center rounded-sm transition-colors ${
                p === page ? 'border border-accent text-primary' : 'text-secondary hover:text-primary'
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
        className={`${upperLabel} text-secondary hover:text-primary transition-colors disabled:text-muted disabled:cursor-not-allowed`}
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
