import type { ReactNode } from 'react'
import { LogoMark } from '../Logo'

interface ErrorPanelProps {
  code: string
  title: ReactNode
  sub?: ReactNode
  children?: ReactNode
  actions: ReactNode
  footnote?: ReactNode
}

// The one public error pattern (D70): the Paper Gate as a watermark behind the copy.
export function ErrorPanel({ code, title, sub, children, actions, footnote }: Readonly<ErrorPanelProps>) {
  return (
    <section className="relative flex-1 flex items-center justify-center px-4 py-16 overflow-hidden">
      <LogoMark
        size={420}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-70 h-70 md:w-105 md:h-105 text-border opacity-35 pointer-events-none"
      />
      <div className="relative z-10 w-full max-w-160 flex flex-col items-center gap-4 text-center">
        <p className="inline-flex items-center gap-2 px-2.5 py-1 border border-border rounded-sm font-mono text-[11px] uppercase tracking-[0.12em] text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-danger" aria-hidden />
          {code}
        </p>
        <h1 className="paper-heading">{title}</h1>
        {sub && <p className="font-mono text-lg md:text-xl text-secondary">{sub}</p>}
        {children}
        <div className="mt-4 w-full flex flex-col sm:flex-row sm:w-auto sm:justify-center gap-3">{actions}</div>
        {footnote && (
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.1em] text-secondary">{footnote}</p>
        )}
      </div>
    </section>
  )
}
