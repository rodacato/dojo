import type { ReactNode } from 'react'

interface DisclosureProps {
  summary: ReactNode
  defaultOpen?: boolean
  className?: string
  children: ReactNode
}

export function Disclosure({ summary, defaultOpen = false, className = '', children }: Readonly<DisclosureProps>) {
  return (
    <details open={defaultOpen} className={`group border-t border-border ${className}`}>
      <summary className="flex items-center justify-between gap-3 min-h-11 py-3 font-mono text-xs text-primary cursor-pointer list-none [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        <span>{summary}</span>
        <span aria-hidden className="text-base text-secondary">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  )
}
