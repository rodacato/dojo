interface HankoBadgeProps {
  /**
   * Display text. Multi-word strings render one word per line.
   * Single-word strings render one character per line (true seal stack).
   */
  text: string
  earned?: boolean
  size?: 'sm' | 'md'
  className?: string
}

// Hanko (判子, the name seal) — vermillion square stamp with ink-white
// monospace caps. Per DESIGN.md §Brand motifs:
// - Replaces chip-style badges on /belts for earned milestones
// - Verdict stamp variant on share cards
// - Black-belt avatar ring uses hanko-square geometry
// Forbidden: never animate a stamping motion as a celebration. The
// stamp lands once, no bounce, no sparkle.
export function HankoBadge({ text, earned = true, size = 'md', className = '' }: Readonly<HankoBadgeProps>) {
  const lines = hankoLines(text)
  const dim = size === 'md' ? 32 : 24
  const fontPx = size === 'md' ? 9 : 7

  return (
    <div
      className={`inline-flex flex-col items-center justify-center bg-accent text-on-accent rounded-sm font-mono uppercase font-bold leading-none tracking-tight ${
        earned ? '' : 'opacity-30 grayscale'
      } ${className}`}
      style={{ minWidth: dim, paddingInline: 4, paddingBlock: 5, gap: 2 }}
      aria-label={text.toLowerCase()}
    >
      {lines.map((line, i) => (
        <span key={i} style={{ fontSize: fontPx }}>
          {line}
        </span>
      ))}
    </div>
  )
}

// Single-word → stack each char on its own line (true seal aesthetic).
// Multi-word → each word per line. Caller controls the visual by
// passing the right whitespace pattern.
function hankoLines(text: string): string[] {
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return ['']
  if (tokens.length === 1) {
    return tokens[0]!.toUpperCase().split('')
  }
  return tokens.map((t) => t.toUpperCase())
}
