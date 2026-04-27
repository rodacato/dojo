interface LogoMarkProps {
  size?: number
  className?: string
}

/** Abstract torii gate mark — 4 strokes, no fill */
export function LogoMark({ size = 24, className = '' }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
    >
      <path
        d="M5 10 H35 M8 18 H32 M12 10 V35 M28 10 V35"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  )
}

interface LogoWordmarkProps {
  className?: string
  showMark?: boolean
  markSize?: number
}

/** Full lockup: optional torii mark + dojo_ wordmark with blinking cursor */
export function LogoWordmark({ className = '', showMark = true, markSize = 20 }: LogoWordmarkProps) {
  return (
    <a href="/dashboard" className={`inline-flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}>
      {showMark && <LogoMark size={markSize} className="text-primary" />}
      <span className="font-mono text-lg text-primary tracking-wider">
        dojo<span className="text-accent animate-cursor">_</span>
      </span>
    </a>
  )
}
