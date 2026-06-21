import type { ReactNode } from 'react'
import { PersonaEyebrow } from './PersonaEyebrow'

interface SenseiBubbleProps {
  initials: string
  role?: string
  streaming?: boolean
  children: ReactNode
}

// Sensei (assistant) message: avatar + persona eyebrow + left-aligned bubble.
// `streaming` appends a 1Hz indigo cursor so the user knows tokens are still
// arriving — same brand cursor used in the wordmark and timer.
export function SenseiBubble({ initials, role, streaming = false, children }: Readonly<SenseiBubbleProps>) {
  return (
    <div className="flex gap-3">
      <div
        className="relative w-8 h-8 shrink-0 mt-1 bg-surface border border-border flex items-center justify-center font-mono text-xs font-bold text-primary"
        aria-hidden
      >
        {/* Enso wash — faint open brush circle behind the initials.
            Per DESIGN.md §Component vocabulary §Sensei avatar.
            Static (not animated) — the avatar isn't a loading state. */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full text-accent opacity-40 pointer-events-none"
          aria-hidden
        >
          <path
            d="M 87.6 36.3 A 40 40 0 1 1 87.6 63.7"
            fill="none"
            stroke="currentColor"
            strokeWidth={5}
            strokeLinecap="round"
          />
        </svg>
        <span className="relative">{initials}</span>
      </div>
      <div className="flex-1 min-w-0 max-w-[80%]">
        {role && <PersonaEyebrow role={role} className="mb-1.5 block" />}
        <div className="bg-surface border border-border rounded-md px-4 py-3 text-primary text-base leading-relaxed">
          {children}
          {streaming && (
            <span className="animate-cursor text-accent ml-0.5" aria-hidden>
              _
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface UserBubbleProps {
  children: ReactNode
}

// User (you) message: right-aligned indigo bubble. Caps the width at 70%
// so long replies stay readable instead of stretching across the column.
export function UserBubble({ children }: Readonly<UserBubbleProps>) {
  return (
    <div className="flex justify-end">
      <div className="flex flex-col items-end max-w-[70%] gap-1">
        <span className="font-mono text-xs tracking-[0.08em] uppercase text-muted pr-1">You</span>
        <div className="bg-accent text-primary px-4 py-3 rounded-md text-base leading-relaxed whitespace-pre-wrap">
          {children}
        </div>
      </div>
    </div>
  )
}
