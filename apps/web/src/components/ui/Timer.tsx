import { useEffect, useState } from 'react'

interface TimerProps {
  durationMinutes: number
  startedAt: string
  onExpired?: () => void
  size?: TimerSize
}

export type TimerSize = 'sm' | 'md' | 'lg'

const SIZE_CLASSES: Record<TimerSize, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-5xl',
}

function timerColorClass(expired: boolean, isDanger: boolean, isWarning: boolean): string {
  if (expired) return 'text-muted'
  if (isDanger) return 'text-danger'
  if (isWarning) return 'text-warning'
  return 'text-primary'
}

export function Timer({ durationMinutes, startedAt, onExpired, size = 'md' }: Readonly<TimerProps>) {
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

  const total = durationMinutes * 60
  const pct = remaining / total
  const expired = remaining <= 0
  const isDanger = pct <= 0.1 && !expired
  const isWarning = pct <= 0.2 && pct > 0.1

  const colorClass = timerColorClass(expired, isDanger, isWarning)

  return (
    <span
      className={`font-mono font-bold tabular-nums leading-none inline-flex items-center ${SIZE_CLASSES[size]} ${colorClass}`}
      aria-live={isDanger ? 'polite' : 'off'}
    >
      {formatTime(Math.max(0, remaining))}
      {isDanger && (
        <span className="animate-cursor ml-1" aria-hidden>
          _
        </span>
      )}
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
