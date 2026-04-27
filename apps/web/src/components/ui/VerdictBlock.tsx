import type { ReactNode } from 'react'
import type { Verdict } from '@dojo/shared'
import { PersonaEyebrow } from './PersonaEyebrow'

const VERDICT_LABELS: Record<Verdict, string> = {
  passed: 'PASSED',
  passed_with_notes: 'PASSED WITH NOTES',
  needs_work: 'NEEDS WORK',
}

const VERDICT_COLORS: Record<Verdict, string> = {
  passed: 'text-success',
  passed_with_notes: 'text-warning',
  needs_work: 'text-danger',
}

interface VerdictBlockProps {
  verdict: Verdict
  role?: string
  size?: 'md' | 'lg'
  children?: ReactNode
  topics?: string[]
  cta?: ReactNode
}

// Hero verdict block — full-width card with an indigo left accent border.
// `md` (32px verdict) lands at the bottom of the eval conversation; `lg`
// (56px verdict) is the page-hero variant used on Results. Color is on the
// verdict label, not the border (per spec: border is always indigo).
export function VerdictBlock({
  verdict,
  role,
  size = 'md',
  children,
  topics,
  cta,
}: VerdictBlockProps) {
  const verdictSize = size === 'lg' ? 'text-4xl md:text-[56px]' : 'text-[32px]'
  const padding = size === 'lg' ? 'p-6 md:p-8' : 'p-6'
  return (
    <div
      className={`bg-surface border border-border border-l-4 border-l-accent rounded-md ${padding}`}
    >
      {role && <PersonaEyebrow role={role} className="mb-3 block" />}
      <h2
        className={`font-mono ${verdictSize} font-bold uppercase tracking-tight ${VERDICT_COLORS[verdict]} leading-none mb-4`}
      >
        {VERDICT_LABELS[verdict]}
      </h2>
      {children && (
        <div className="text-primary text-[15px] leading-relaxed font-sans space-y-3 whitespace-pre-wrap">
          {children}
        </div>
      )}
      {topics && topics.length > 0 && (
        <div className="mt-5">
          <p className="text-muted text-[10px] font-mono uppercase tracking-[0.08em] mb-2">
            Topics to review
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <span
                key={t}
                className="text-warning text-[11px] font-mono px-2 py-1 border border-warning/30 bg-warning/10 rounded-sm"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  )
}
