const MAX_PIPS = 10

interface Props {
  current: number
  target: number
  tone: 'easy' | 'hard'
}

export function ProgressPips({ current, target, tone }: Readonly<Props>) {
  const pips = Math.min(target, MAX_PIPS)
  const filled = Math.round((current / target) * pips)
  const on = tone === 'easy' ? 'bg-accent border-accent' : 'bg-warning border-warning'
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {Array.from({ length: pips }, (_, i) => (
          <span key={i} className={`block w-2.5 h-2 border ${i < filled ? on : 'border-muted'}`} />
        ))}
      </span>
      <span className="font-mono text-xs text-secondary">
        {current} of {target}
      </span>
    </span>
  )
}
