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
export function SenseiBubble({ initials, role, streaming = false, children }: SenseiBubbleProps) {
  return (
    <div className="flex gap-3">
      <div
        className="w-8 h-8 shrink-0 mt-1 bg-surface border border-border flex items-center justify-center font-mono text-[12px] font-bold text-primary"
        aria-hidden
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0 max-w-[80%]">
        {role && <PersonaEyebrow role={role} className="mb-1.5 block" />}
        <div className="bg-surface border border-border rounded-md px-4 py-3 text-primary text-[15px] leading-relaxed">
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
export function UserBubble({ children }: UserBubbleProps) {
  return (
    <div className="flex justify-end">
      <div className="flex flex-col items-end max-w-[70%] gap-1">
        <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted pr-1">You</span>
        <div className="bg-accent text-primary px-4 py-3 rounded-md text-[15px] leading-relaxed whitespace-pre-wrap">
          {children}
        </div>
      </div>
    </div>
  )
}
