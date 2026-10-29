import logo from '../brand/logo.json'

interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 24, className = '' }: Readonly<LogoMarkProps>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={logo.viewBox}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      className={className}
    >
      {logo.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

interface LogoWordmarkProps {
  className?: string
  showMark?: boolean
  markSize?: number
}

export function LogoWordmark({ className = '', showMark = true, markSize = 20 }: Readonly<LogoWordmarkProps>) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {showMark && <LogoMark size={markSize} className="text-accent" />}
      <span className="font-mono text-lg text-primary tracking-wider">
        dojo<span className="animate-cursor">_</span>
      </span>
    </span>
  )
}
