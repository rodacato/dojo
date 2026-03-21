import { useEffect, useState } from 'react'

interface TimerProps {
  durationMinutes: number
  startedAt: string
  onExpired?: () => void
}

export function Timer({ durationMinutes, startedAt, onExpired }: TimerProps) {
  const [remaining, setRemaining] = useState<number>(computeRemaining(durationMinutes, startedAt))

  useEffect(() => {
    const interval = setInterval(() => {
      const r = computeRemaining(durationMinutes, startedAt)
      setRemaining(r)
      if (r <= 0) {
        clearInterval(interval)
        onExpired?.()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [durationMinutes, startedAt, onExpired])

  const pct = remaining / (durationMinutes * 60)
  const colorClass = pct > 0.2 ? 'text-primary' : pct > 0.1 ? 'text-warning' : 'text-danger'

  return (
    <span className={`font-mono text-2xl tabular-nums ${colorClass}`}>
      {formatTime(Math.max(0, remaining))}
    </span>
  )
}

function computeRemaining(durationMinutes: number, startedAt: string): number {
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
  return durationMinutes * 60 - elapsed
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
