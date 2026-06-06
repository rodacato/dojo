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

// Hero verdict block — full-width card with an accent-colored left bar.
// `md` (32px verdict) lands at the bottom of the eval conversation; `lg`
// (56px verdict) is the page-hero variant used on Results.
//
// Left bar is bound to --color-accent so it re-themes automatically:
// indigo in Slate, vermillion in Sumi/Washi. DESIGN.md §Component
// vocabulary plans a vermillion brushstroke variant in the Sumi-e
// pass (drawn with GSAP DrawSVG); deferred until the designer pass
// validates the stroke shape against printed paper samples.
export function VerdictBlock({
  verdict,
  role,
  size = 'md',
  children,
  topics,
  cta,
}: VerdictBlockProps) {
  const verdictSize = size === 'lg' ? 'text-4xl md:text-5xl' : 'text-2xl'
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
        <div className="text-primary text-base leading-relaxed font-sans space-y-3 whitespace-pre-wrap">
          {children}
        </div>
      )}
      {topics && topics.length > 0 && (
        <div className="mt-5">
          <p className="text-muted text-xs font-mono uppercase tracking-[0.08em] mb-2">
            Topics to review
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <span
                key={t}
                className="text-warning text-xs font-mono px-2 py-1 border border-warning/30 bg-warning/10 rounded-sm"
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
