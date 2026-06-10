import { useState } from 'react'
import type { ExternalReference, ExternalReferenceKind } from '@dojo/shared'

const KIND_ICON: Record<ExternalReferenceKind, string> = {
  book: '📘',
  docs: '📄',
  talk: '🎤',
  article: '📝',
}

export function FurtherReading({ refs }: { refs: ExternalReference[] }) {
  const [open, setOpen] = useState(false)
  if (refs.length === 0) return null

  return (
    <section className="mt-4 mx-4 border-t border-border/20 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left text-xs font-mono text-muted uppercase tracking-wider hover:text-secondary transition-colors flex items-center gap-1"
      >
        <span className="text-xs">{open ? '▼' : '▶'}</span>
        Further reading
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5 text-xs">
          {refs.map((r) => (
            <li key={r.url} className="flex items-start gap-1.5">
              <span className="shrink-0">{KIND_ICON[r.kind]}</span>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline wrap-break-word"
              >
                {r.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
