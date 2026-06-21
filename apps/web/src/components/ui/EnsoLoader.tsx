import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

interface EnsoLoaderProps {
  size?: number
  label?: string
  className?: string
}

// Enso (円相, zen circle) — open brush circle drawn clockwise.
// Per DESIGN.md §Brand motifs:
// - Draws once in ~600ms, holds static, only loops if loading >2s
// - Forbidden as a celebration burst — contemplative, not jubilant
//
// The gap in the circle is the point — the enso is imperfect by design.
export function EnsoLoader({ size = 40, label = 'Loading', className = '' }: Readonly<EnsoLoaderProps>) {
  const pathRef = useRef<SVGPathElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const path = pathRef.current
      if (!path) return

      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const length = path.getTotalLength()
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })

        // Phase 1: draw once + hold static (total 2.0s)
        const firstTl = gsap.timeline()
        firstTl
          .to(path, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.out' })
          .to({}, { duration: 1.4 })

        // Phase 2: if still mounted after 2s, the load is taking longer —
        // begin a sustained re-draw loop. Indicates "still working".
        firstTl.eventCallback('onComplete', () => {
          gsap.timeline({ repeat: -1 })
            .set(path, { strokeDashoffset: length })
            .to(path, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.out' })
            .to({}, { duration: 0.4 })
        })
      })

      mm.add('(prefers-reduced-motion: reduce)', () => {
        // Skip animation entirely — just show the fully drawn enso.
        gsap.set(path, { strokeDasharray: 'none', strokeDashoffset: 0 })
      })
    },
    { scope: containerRef },
  )

  return (
    <div ref={containerRef} className={`inline-block text-accent ${className}`} role="status" aria-label={label}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
        {/* Arc from 20° to 340° clockwise — leaves a ~40° gap at the right side */}
        <path
          ref={pathRef}
          d="M 87.6 36.3 A 40 40 0 1 1 87.6 63.7"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  )
}
