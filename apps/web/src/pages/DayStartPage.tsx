import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type DashboardData } from '../lib/api'

type Mood = 'focused' | 'regular' | 'low_energy'
type Duration = 10 | 20 | 30 | 45

const MOODS: Array<{ value: Mood; label: string; emoji: string }> = [
  { value: 'focused', label: 'On a roll', emoji: '🔥' },
  { value: 'regular', label: 'Just okay', emoji: '😐' },
  { value: 'low_energy', label: 'Half here', emoji: '🧠' },
]

const DURATIONS: Array<{ value: Duration; label: string }> = [
  { value: 10, label: '10 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min+' },
]

export function DayStartPage() {
  const [mood, setMood] = useState<Mood | null>(null)
  const [duration, setDuration] = useState<Duration | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.getDashboard().then(setDashboard)
  }, [])

  const today = new Date()
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).toLowerCase()

  function handleSubmit() {
    if (!mood || !duration) return
    sessionStorage.setItem('dojo-start', JSON.stringify({ mood, maxDuration: duration }))
    navigate('/kata')
  }

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Date */}
        <p className="font-mono text-sm text-muted">{dateString}</p>

        {/* Streak + heatmap strip */}
        {dashboard && dashboard.streak > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-surface border border-border/40 rounded-sm">
            <span className="text-accent text-sm">⚡</span>
            <span className="font-mono text-sm text-primary">{dashboard.streak} day streak</span>
            <span className="text-border mx-1">·</span>
            <div className="flex gap-0.5">
              {dashboard.heatmapData.slice(-30).map((d, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-[1px] ${
                    d.count > 0 ? 'bg-accent' : 'bg-border/40'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Mood question */}
        <section>
          <h1 className="font-mono text-sm text-secondary mb-4">
            how are you walking in today?
          </h1>
          <div className="grid grid-cols-3 gap-3">
            {MOODS.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => setMood(value)}
                className={`py-6 px-3 rounded-sm border-2 font-mono transition-all duration-150 flex flex-col items-center gap-2 ${
                  mood === value
                    ? 'border-accent text-primary bg-accent/10'
                    : 'border-border/60 text-secondary hover:border-secondary'
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Duration question */}
        <section>
          <h2 className="font-mono text-sm text-secondary mb-4">
            how much time do you have?
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {DURATIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setDuration(value)}
                className={`py-4 rounded-sm border-2 font-mono text-sm transition-all duration-150 ${
                  duration === value
                    ? 'border-accent text-primary bg-accent/10'
                    : 'border-border/60 text-secondary hover:border-secondary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!mood || !duration}
          className="w-full py-3.5 bg-accent text-primary font-mono text-sm uppercase tracking-wider rounded-sm hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Show my kata →
        </button>

        {/* Footer */}
        <p className="text-muted/50 text-xs text-center font-mono">
          your kata are generated from your selections. no skip. no reroll.
        </p>
      </div>
    </div>
  )
}
