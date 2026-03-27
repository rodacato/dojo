import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type DashboardData } from '../lib/api'

type Mood = 'focused' | 'regular' | 'low_energy'
type Duration = 10 | 20 | 30 | 45
type UserLevel = 'junior' | 'mid' | 'senior'

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

const LEVELS: Array<{ value: UserLevel; label: string }> = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
]

const INTEREST_OPTIONS = [
  'backend', 'frontend', 'architecture', 'security',
  'devops', 'testing', 'process', 'reliability',
]

export function DayStartPage() {
  const [mood, setMood] = useState<Mood | null>(null)
  const [duration, setDuration] = useState<Duration | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [showCustomize, setShowCustomize] = useState(false)
  const [level, setLevel] = useState<UserLevel>('mid')
  const [interests, setInterests] = useState<string[]>([])
  const [randomness, setRandomness] = useState(0.3)
  const [goalWeeklyTarget, setGoalWeeklyTarget] = useState(3)
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.getDashboard().then(setDashboard)
    api.getPreferences().then((prefs) => {
      setLevel((prefs.level as UserLevel) || 'mid')
      setInterests(prefs.interests || [])
      setRandomness(prefs.randomness ?? 0.3)
      setGoalWeeklyTarget(prefs.goalWeeklyTarget ?? 3)
      setPrefsLoaded(true)
    })
  }, [])

  const today = new Date()
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).toLowerCase()

  function savePreferences(updates: { level?: UserLevel; interests?: string[]; randomness?: number; goalWeeklyTarget?: number }) {
    const newLevel = updates.level ?? level
    const newInterests = updates.interests ?? interests
    const newRandomness = updates.randomness ?? randomness
    const newGoalWeeklyTarget = updates.goalWeeklyTarget ?? goalWeeklyTarget

    if (updates.level !== undefined) setLevel(newLevel)
    if (updates.interests !== undefined) setInterests(newInterests)
    if (updates.randomness !== undefined) setRandomness(newRandomness)
    if (updates.goalWeeklyTarget !== undefined) setGoalWeeklyTarget(newGoalWeeklyTarget)

    // Fire-and-forget save
    api.getPreferences().then((current) => {
      api.updatePreferences({
        reminderEnabled: current.reminderEnabled,
        reminderHour: current.reminderHour,
        email: current.email,
        level: newLevel,
        interests: newInterests,
        randomness: newRandomness,
        goalWeeklyTarget: newGoalWeeklyTarget,
      })
    })
  }

  function toggleInterest(interest: string) {
    const next = interests.includes(interest)
      ? interests.filter((i) => i !== interest)
      : [...interests, interest]
    savePreferences({ interests: next })
  }

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

        {/* Customize practice */}
        <section>
          <button
            type="button"
            onClick={() => setShowCustomize(!showCustomize)}
            className="font-mono text-xs text-muted hover:text-secondary transition-colors"
          >
            {showCustomize ? '− hide customization' : '+ customize your practice'}
          </button>

          {showCustomize && prefsLoaded && (
            <div className="mt-4 space-y-5 p-4 bg-surface border border-border/40 rounded-sm">
              {/* Level */}
              <div>
                <h3 className="font-mono text-xs text-secondary mb-3">your level</h3>
                <div className="grid grid-cols-3 gap-3">
                  {LEVELS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => savePreferences({ level: value })}
                      className={`py-3 rounded-sm border-2 font-mono text-xs transition-all duration-150 ${
                        level === value
                          ? 'border-accent text-primary bg-accent/10'
                          : 'border-border/60 text-secondary hover:border-secondary'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <h3 className="font-mono text-xs text-secondary mb-3">interests</h3>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-sm border font-mono text-xs transition-all duration-150 ${
                        interests.includes(interest)
                          ? 'border-accent text-primary bg-accent/10'
                          : 'border-border/60 text-secondary hover:border-secondary'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                {interests.length === 0 && (
                  <p className="font-mono text-xs text-muted/60 mt-2">none selected = all categories</p>
                )}
              </div>

              {/* Randomness */}
              <div>
                <h3 className="font-mono text-xs text-secondary mb-3">
                  randomness: {randomness < 0.3 ? 'focused' : randomness > 0.7 ? 'random' : 'balanced'}
                </h3>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={randomness}
                  onChange={(e) => savePreferences({ randomness: parseFloat(e.target.value) })}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between font-mono text-xs text-muted/60 mt-1">
                  <span>focused</span>
                  <span>random</span>
                </div>
              </div>

              {/* Weekly goal */}
              <div>
                <h3 className="font-mono text-xs text-secondary mb-3">
                  weekly goal: {goalWeeklyTarget} {goalWeeklyTarget === 1 ? 'day' : 'days'}
                </h3>
                <div className="grid grid-cols-7 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => savePreferences({ goalWeeklyTarget: n })}
                      className={`py-2 rounded-sm border-2 font-mono text-xs transition-all duration-150 ${
                        goalWeeklyTarget === n
                          ? 'border-accent text-primary bg-accent/10'
                          : 'border-border/60 text-secondary hover:border-secondary'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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
