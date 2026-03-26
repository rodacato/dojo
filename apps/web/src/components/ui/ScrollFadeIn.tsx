import { useEffect, useRef, useState, type ReactNode } from 'react'

interface ScrollFadeInProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function ScrollFadeIn({ children, className = '', delay = 0 }: ScrollFadeInProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const prefersReduced = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (prefersReduced.current) {
      setVisible(true)
      return
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setVisible(true), delay)
          } else {
            setVisible(true)
          }
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  )
}
