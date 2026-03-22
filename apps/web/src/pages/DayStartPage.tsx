import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoWordmark } from '../components/Logo'

type Mood = 'focused' | 'regular' | 'low_energy'
type Duration = 10 | 20 | 30 | 45

const MOODS: Array<{ value: Mood; label: string; emoji: string }> = [
  { value: 'focused', label: 'On a roll', emoji: '🔥' },
  { value: 'regular', label: 'Just okay', emoji: '😐' },
  { value: 'low_energy', label: 'Half here', emoji: '🧠' },
]

const DURATIONS: Duration[] = [10, 20, 30, 45]

export function DayStartPage() {
  const [mood, setMood] = useState<Mood | null>(null)
  const [duration, setDuration] = useState<Duration | null>(null)
  const navigate = useNavigate()

  const today = new Date()
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  function handleSubmit() {
    if (!mood || !duration) return
    sessionStorage.setItem('dojo-start', JSON.stringify({ mood, maxDuration: duration }))
    navigate('/kata')
  }

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="absolute top-5 left-8">
        <LogoWordmark />
      </div>

      <div className="w-full max-w-md space-y-10">
        {/* Date */}
        <div className="text-center">
          <p className="font-mono text-sm text-muted mb-2">{dateString}</p>
          <h1 className="font-mono text-xl md:text-2xl text-primary">
            How are you walking in today?
          </h1>
        </div>

        {/* Mood selector */}
        <section>
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-4">Mood</p>
          <div className="grid grid-cols-3 gap-3">
            {MOODS.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => setMood(value)}
                className={`py-5 px-3 rounded-sm border-2 font-mono text-sm transition-all duration-150 ${
                  mood === value
                    ? 'border-accent text-primary bg-accent/10'
                    : 'border-border/60 text-secondary hover:border-secondary'
                }`}
              >
                <div className="text-lg">{emoji}</div>
                <div className="text-xs mt-2">{label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Duration selector */}
        <section>
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-4">Time</p>
          <div className="grid grid-cols-4 gap-3">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`py-4 rounded-sm border-2 font-mono text-sm transition-all duration-150 ${
                  duration === d
                    ? 'border-accent text-primary bg-accent/10'
                    : 'border-border/60 text-secondary hover:border-secondary'
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
        </section>

        <button
          onClick={handleSubmit}
          disabled={!mood || !duration}
          className="w-full py-3.5 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Show my kata →
        </button>

        <p className="text-muted/50 text-xs text-center font-mono">
          Your kata are generated from your selections. No skip. No reroll.
        </p>
      </div>
    </div>
  )
}
