import { useEffect, useRef, useCallback } from 'react'

interface DotGridBackgroundProps {
  className?: string
}

export function DotGridBackground({ className = '' }: DotGridBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<HTMLDivElement[]>([])
  const prefersReduced = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (prefersReduced.current) return
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const radius = 120

    for (const dot of dotsRef.current) {
      const dx = parseFloat(dot.dataset.x ?? '0') - mx
      const dy = parseFloat(dot.dataset.y ?? '0') - my
      const dist = Math.sqrt(dx * dx + dy * dy)
      const opacity = dist < radius ? 0.15 + 0.55 * (1 - dist / radius) : 0.15
      dot.style.opacity = String(opacity)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    for (const dot of dotsRef.current) {
      dot.style.opacity = '0.15'
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const gap = 32
    const w = container.offsetWidth
    const h = container.offsetHeight
    const cols = Math.floor(w / gap)
    const rows = Math.floor(h / gap)

    // Clear previous dots
    container.innerHTML = ''
    dotsRef.current = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dot = document.createElement('div')
        const x = c * gap + gap / 2
        const y = r * gap + gap / 2
        dot.className = 'absolute rounded-full bg-border'
        dot.style.width = '2px'
        dot.style.height = '2px'
        dot.style.left = `${x}px`
        dot.style.top = `${y}px`
        dot.style.opacity = '0.15'
        dot.style.transition = prefersReduced.current ? 'none' : 'opacity 0.3s ease'
        dot.dataset.x = String(x)
        dot.dataset.y = String(y)
        container.appendChild(dot)
        dotsRef.current.push(dot)
      }
    }

    if (!prefersReduced.current) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseLeave])

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-auto ${className}`}
      aria-hidden="true"
    />
  )
}
