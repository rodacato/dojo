interface PersonaEyebrowProps {
  role: string
  className?: string
}

// Small monospaced caps eyebrow used on every sensei surface — eval bubble,
// results header, share page, course nudge inset. Keeps the "this is a real
// persona, not a chatbot" anchor consistent (Yemi's note in batch 03).
export function PersonaEyebrow({ role, className = '' }: PersonaEyebrowProps) {
  return (
    <span
      className={`font-mono text-[11px] tracking-[0.08em] uppercase text-secondary ${className}`}
    >
      [{role}]
    </span>
  )
}
