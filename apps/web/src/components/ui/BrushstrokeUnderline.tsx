import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { pickUnderline } from '../../lib/brushstrokes'

interface BrushstrokeUnderlineProps {
  /** Seed string for deterministic stroke pick (e.g. page title). */
  seed: string
  className?: string
}

// Vermillion ink underline drawn below a heading. Per DESIGN.md §Brand
// motifs: "Section underline — under H1 / H2 page titles. Draws in
// with DrawSVG on first reveal. ~150ms."
//
// Triggers on first viewport entry via IntersectionObserver, animates
// stroke-dashoffset (no DrawSVG plugin dependency). Respects
// prefers-reduced-motion by rendering fully drawn from frame 1.
//
// GSAP scope contract — only mount this in routes already on the
// GSAP allowlist (kata flow, scrolls, results, share, landing). Do not
// import into dashboard or admin chunks.
export function BrushstrokeUnderline({ seed, className = '' }: BrushstrokeUnderlineProps) {
  const stroke = pickUnderline(seed)
  const pathRef = useRef<SVGPathElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useGSAP(
    () => {
      const path = pathRef.current
      const svg = svgRef.current
      if (!path || !svg) return

      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(path, { strokeDasharray: 'none', strokeDashoffset: 0 })
      })

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const length = path.getTotalLength()
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })
      })
    },
    { scope: svgRef },
  )

  useEffect(() => {
    const path = pathRef.current
    const svg = svgRef.current
    if (!path || !svg) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          gsap.to(path, { strokeDashoffset: 0, duration: 0.15, ease: 'power2.out' })
          observer.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(svg)
    return () => observer.disconnect()
  }, [])

  return (
    <svg
      ref={svgRef}
      viewBox={stroke.viewBox}
      className={`text-accent ${className}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        ref={pathRef}
        d={stroke.d}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke.strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  )
}
