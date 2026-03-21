import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Mood = 'focused' | 'regular' | 'low_energy'
type Duration = 15 | 20 | 30 | 45

const MOODS: Array<{ value: Mood; label: string; emoji: string }> = [
  { value: 'focused', label: 'En racha', emoji: '🔥' },
  { value: 'regular', label: 'Regular', emoji: '😐' },
  { value: 'low_energy', label: 'A medias', emoji: '🧠' },
]

const DURATIONS: Duration[] = [15, 20, 30, 45]

export function DayStartPage() {
  const [mood, setMood] = useState<Mood>('regular')
  const [duration, setDuration] = useState<Duration>(15)
  const navigate = useNavigate()

  function handleSubmit() {
    sessionStorage.setItem('dojo-start', JSON.stringify({ mood, maxDuration: duration }))
    navigate('/kata')
  }

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <h1 className="font-mono text-xl text-primary text-center">How are you showing up today?</h1>

        {/* Mood selector */}
        <section>
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-3">Mood</p>
          <div className="grid grid-cols-3 gap-2">
            {MOODS.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => setMood(value)}
                className={`py-3 rounded-sm border font-mono text-sm transition-colors duration-150 ${
                  mood === value
                    ? 'border-accent text-primary bg-accent/10'
                    : 'border-border text-secondary hover:border-secondary'
                }`}
              >
                <div>{emoji}</div>
                <div className="text-xs mt-1">{label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Duration selector */}
        <section>
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-3">Time</p>
          <div className="grid grid-cols-4 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`py-3 rounded-sm border font-mono text-sm transition-colors duration-150 ${
                  duration === d
                    ? 'border-accent text-primary bg-accent/10'
                    : 'border-border text-secondary hover:border-secondary'
                }`}
              >
                {d}m
              </button>
            ))}
          </div>
        </section>

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-accent text-primary font-mono rounded-sm hover:bg-accent/90 transition-colors"
        >
          Show me the kata →
        </button>
      </div>
    </div>
  )
}
