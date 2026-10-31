import type { ReactNode } from 'react'
import type { Verdict } from '@dojo/shared'
import { PersonaEyebrow } from './PersonaEyebrow'
import { VERDICT_LABELS, VERDICT_STROKE, VERDICT_TEXT } from '../../lib/verdict'

interface VerdictBlockProps {
  verdict?: Verdict
  role?: string
  size?: 'md' | 'lg'
  children?: ReactNode
  topics?: string[]
  cta?: ReactNode
}

// Hero verdict block — full-width card with a drawn ink stroke on the
// left edge. `md` (24px verdict) lands at the bottom of the eval
// conversation; `lg` (36px, 48px from the md breakpoint) is the page-hero
// variant used on Results. Without a verdict it holds the sensei's text while it streams.
//
// The left stroke is an SVG path inked in the verdict colour,
// animated stroke-dashoffset → 0 in 600ms on mount. Pure CSS so this
// component stays GSAP-free and safe to mount on any surface. Per
// DESIGN.md §Component vocabulary §Verdict block.
export function VerdictBlock({
  verdict,
  role,
  size = 'md',
  children,
  topics,
  cta,
}: Readonly<VerdictBlockProps>) {
  const verdictSize = size === 'lg' ? 'text-4xl md:text-5xl' : 'text-2xl'
  const padding = size === 'lg' ? 'p-6 md:p-8 pl-8 md:pl-10' : 'p-6 pl-8'
  return (
    <div
      className={`relative bg-surface border border-border rounded-md ${padding}`}
    >
      <svg
        aria-hidden
        className={`absolute left-1.5 top-3 bottom-3 w-3 ${verdict ? VERDICT_STROKE[verdict] : 'text-border'}`}
        viewBox="0 0 12 200"
        preserveAspectRatio="none"
      >
        <path
          className="brushstroke-path-vertical"
          d="M 6 3 C 3 60, 10 130, 6 197"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </svg>
      {role && <PersonaEyebrow role={role} className="mb-3 block" />}
      {verdict && (
        <h2
          className={`font-mono ${verdictSize} font-bold uppercase tracking-tight ${VERDICT_TEXT[verdict]} leading-none mb-4`}
        >
          {VERDICT_LABELS[verdict]}
        </h2>
      )}
      {children && (
        <div className="text-primary text-base leading-relaxed font-sans space-y-3 whitespace-pre-wrap">
          {children}
        </div>
      )}
      {topics && topics.length > 0 && (
        <div className="mt-5">
          <p className="text-secondary text-xs font-mono uppercase tracking-[0.08em] mb-2">
            Topics to review
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <span
                key={t}
                className="text-warning-text text-xs font-mono px-2 py-1 border border-warning/30 bg-warning/10 rounded-sm"
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
