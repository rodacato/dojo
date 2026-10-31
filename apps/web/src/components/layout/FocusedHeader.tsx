import type { ReactNode } from 'react'
import { LogoMark } from '../Logo'
import { ThemeToggle } from '../ui/ThemeToggle'

interface FocusedHeaderProps {
  leading?: ReactNode
  center?: ReactNode
  trailing?: ReactNode
}

/** Task header for focused screens. The mark is not a link: leaving is the page's own, explicit action. */
export function FocusedHeader({ leading, center, trailing }: Readonly<FocusedHeaderProps>) {
  return (
    <header className="relative h-16 md:h-19 shrink-0 flex items-center justify-between gap-2 md:gap-4 px-4 md:px-8 border-b border-border bg-surface">
      <div className="flex items-center gap-2 md:gap-6 min-w-0">
        <span className="inline-flex items-center gap-2 select-none">
          <LogoMark size={26} className="text-accent md:hidden" />
          <LogoMark size={32} className="text-accent max-md:hidden" />
          <span className="font-mono text-lg text-primary tracking-wider max-md:hidden">
            dojo<span className="animate-cursor" aria-hidden>_</span>
          </span>
        </span>
        {leading}
      </div>
      {center && <div className="md:absolute md:left-1/2 md:-translate-x-1/2">{center}</div>}
      <div className="flex items-center gap-2 md:gap-4">
        {trailing}
        <ThemeToggle />
      </div>
    </header>
  )
}
