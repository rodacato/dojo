import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type DashboardData } from '../lib/api'
import { Button } from '../components/ui/Button'

type Mood = 'focused' | 'regular' | 'low_energy'
type Duration = 10 | 20 | 30 | 45
type UserLevel = 'junior' | 'mid' | 'senior'

const MOODS: Array<{ value: Mood; label: string; sub: string }> = [
  { value: 'focused', label: 'In flow', sub: 'all systems go' },
  { value: 'regular', label: 'Ok', sub: 'default' },
  { value: 'low_energy', label: 'Foggy', sub: 'scattered' },
]

const DURATIONS: Array<{ value: Duration; label: string }> = [
  { value: 10, label: '10m' },
  { value: 20, label: '20m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m+' },
]

const LEVELS: Array<{ value: UserLevel; label: string }> = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
]

const INTEREST_OPTIONS = [
  'backend', 'frontend', 'architecture', 'security',
  'devops', 'testing', 'process', 'reliability',
] as const

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

export function DayStartPage() {
  const [mood, setMood] = useState<Mood | null>(null)
  const [duration, setDuration] = useState<Duration | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [showCustomize, setShowCustomize] = useState(true)
  const [level, setLevel] = useState<UserLevel>('mid')
  const [interests, setInterests] = useState<string[]>([])
  const [randomness, setRandomness] = useState(0.3)
  const [goalWeeklyTarget, setGoalWeeklyTarget] = useState(3)
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [surpriseLoading, setSurpriseLoading] = useState(false)
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

  const dateString = DATE_FORMATTER.format(new Date())

  function savePreferences(updates: { level?: UserLevel; interests?: string[]; randomness?: number; goalWeeklyTarget?: number }) {
    const newLevel = updates.level ?? level
    const newInterests = updates.interests ?? interests
    const newRandomness = updates.randomness ?? randomness
    const newGoalWeeklyTarget = updates.goalWeeklyTarget ?? goalWeeklyTarget

    if (updates.level !== undefined) setLevel(newLevel)
    if (updates.interests !== undefined) setInterests(newInterests)
    if (updates.randomness !== undefined) setRandomness(newRandomness)
    if (updates.goalWeeklyTarget !== undefined) setGoalWeeklyTarget(newGoalWeeklyTarget)

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

  async function handleSurpriseMe() {
    setSurpriseLoading(true)
    try {
      const params = {
        ...(mood ? { mood } : {}),
        ...(duration ? { maxDuration: duration } : {}),
      }
      sessionStorage.setItem('dojo-start', JSON.stringify({ mood: mood ?? 'regular', maxDuration: duration ?? 20 }))
      const exercises = await api.getExercises(params)
      if (exercises.length === 0) return
      const picked = exercises[Math.floor(Math.random() * exercises.length)]!
      const { sessionId } = await api.startSession(picked.id)
      navigate(`/kata/${sessionId}`)
    } catch {
      setSurpriseLoading(false)
    }
  }

  const ready = !!mood && !!duration

  return (
    <div className="min-h-screen bg-page px-4 py-12 md:py-16">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
        <header className="text-center">
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-3">{dateString}</p>
          <h1 className="font-mono text-3xl md:text-4xl text-primary inline-flex items-baseline">
            Ready for your kata
            <span className="text-accent animate-cursor ml-1">|</span>
          </h1>
        </header>

        <ActivityStrip dashboard={dashboard} />

        <div className="grid md:grid-cols-2 gap-4">
          <PickCard title="Pick your mood">
            <div className="grid grid-cols-3 gap-2">
              {MOODS.map(({ value, label, sub }) => (
                <SelectablePill
                  key={value}
                  selected={mood === value}
                  onClick={() => setMood(value)}
                  label={label}
                  sub={sub}
                />
              ))}
            </div>
          </PickCard>

          <PickCard title="How long?">
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map(({ value, label }) => (
                <SelectablePill
                  key={value}
                  selected={duration === value}
                  onClick={() => setDuration(value)}
                  label={label}
                  size="md"
                />
              ))}
            </div>
          </PickCard>
        </div>

        <CustomizePanel
          open={showCustomize}
          onToggle={() => setShowCustomize((v) => !v)}
          loaded={prefsLoaded}
          level={level}
          onLevel={(v) => savePreferences({ level: v })}
          interests={interests}
          onToggleInterest={toggleInterest}
          randomness={randomness}
          onRandomness={(v) => savePreferences({ randomness: v })}
          goalWeeklyTarget={goalWeeklyTarget}
          onGoal={(v) => savePreferences({ goalWeeklyTarget: v })}
        />

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={handleSurpriseMe}
            loading={surpriseLoading}
            disabled={surpriseLoading}
          >
            {surpriseLoading ? 'Picking' : 'Surprise me'}
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit} disabled={!ready}>
            Show kata →
          </Button>
        </div>

        <p className="text-muted/70 text-xs font-mono text-center max-w-md mx-auto">
          Your kata are generated from your selections. No skip. No reroll.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Building blocks                                                    */
/* ------------------------------------------------------------------ */

function PickCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-border/40 rounded-md p-5">
      <h2 className="font-mono text-sm text-primary mb-4">{title}</h2>
      {children}
    </section>
  )
}

function SelectablePill({
  selected,
  onClick,
  label,
  sub,
  size = 'sm',
}: {
  selected: boolean
  onClick: () => void
  label: string
  sub?: string
  size?: 'sm' | 'md'
}) {
  const heightClass = size === 'md' ? 'py-3' : 'py-3 sm:py-4'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group rounded-sm border font-mono transition-colors text-center ${heightClass} ${
        selected
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-border bg-page text-secondary hover:border-secondary'
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-page focus-visible:ring-accent`}
    >
      <span className={`block uppercase tracking-wider ${size === 'md' ? 'text-xs' : 'text-xs'}`}>
        {label}
      </span>
      {sub && <span className="block text-[10px] text-muted normal-case mt-0.5">{sub}</span>}
    </button>
  )
}

function ActivityStrip({ dashboard }: { dashboard: DashboardData | null }) {
  if (!dashboard) {
    return (
      <section className="bg-surface border border-border/40 rounded-md p-5 min-h-22">
        <p className="text-muted text-xs font-mono uppercase tracking-wider animate-pulse">Loading streak...</p>
      </section>
    )
  }

  const last30 = dashboard.heatmapData.slice(-30)
  return (
    <section className="bg-surface border border-border/40 rounded-md p-5">
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-muted text-xs font-mono uppercase tracking-wider">30-day activity</p>
        <p className="text-primary text-sm font-mono">
          <span className="text-accent">{dashboard.streak}</span> day streak
        </p>
      </div>
      <div className="flex items-end gap-1 h-8">
        {last30.map((d, i) => (
          <div
            key={i}
            className={`flex-1 rounded-xs ${barClass(d.count)}`}
            title={`${d.date}: ${d.count} kata${d.count === 1 ? '' : 's'}`}
            aria-hidden
          />
        ))}
      </div>
    </section>
  )
}

function barClass(count: number): string {
  if (count === 0) return 'h-1.5 bg-border/40'
  if (count === 1) return 'h-4 bg-accent/40'
  if (count === 2) return 'h-6 bg-accent/70'
  return 'h-8 bg-accent'
}

/* ------------------------------------------------------------------ */
/*  Customize panel                                                    */
/* ------------------------------------------------------------------ */

function CustomizePanel({
  open,
  onToggle,
  loaded,
  level,
  onLevel,
  interests,
  onToggleInterest,
  randomness,
  onRandomness,
  goalWeeklyTarget,
  onGoal,
}: {
  open: boolean
  onToggle: () => void
  loaded: boolean
  level: UserLevel
  onLevel: (v: UserLevel) => void
  interests: string[]
  onToggleInterest: (i: string) => void
  randomness: number
  onRandomness: (v: number) => void
  goalWeeklyTarget: number
  onGoal: (v: number) => void
}) {
  const randomLabel = randomness < 0.34 ? 'Predictable' : randomness < 0.67 ? 'Balanced' : 'Wild'

  return (
    <section className="bg-surface border border-border/40 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-elevated transition-colors focus-visible:outline-none focus-visible:bg-elevated"
      >
        <h2 className="font-mono text-sm text-primary">Customize</h2>
        <span className={`text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden>
          ⌃
        </span>
      </button>

      {open && (
        <div className="border-t border-border/30 p-5 space-y-6">
          {!loaded ? (
            <p className="text-muted text-xs font-mono uppercase tracking-wider animate-pulse">Loading preferences...</p>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Eyebrow>Skill level</Eyebrow>
                  <div className="grid grid-cols-3 gap-2">
                    {LEVELS.map(({ value, label }) => (
                      <SelectablePill
                        key={value}
                        selected={level === value}
                        onClick={() => onLevel(value)}
                        label={label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <Eyebrow inline>Randomness</Eyebrow>
                    <span className="text-secondary text-xs font-mono">{randomLabel}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={randomness}
                    onChange={(e) => onRandomness(parseFloat(e.target.value))}
                    className="w-full accent-accent mt-3"
                  />
                </div>
              </div>

              <div>
                <Eyebrow>Interests</Eyebrow>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => {
                    const selected = interests.includes(interest)
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => onToggleInterest(interest)}
                        aria-pressed={selected}
                        className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors ${
                          selected
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border bg-page text-secondary hover:border-secondary'
                        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-page focus-visible:ring-accent`}
                      >
                        <span className="capitalize">{interest}</span>
                        {selected && <span className="text-accent/70" aria-hidden>×</span>}
                      </button>
                    )
                  })}
                </div>
                {interests.length === 0 && (
                  <p className="text-muted text-[11px] font-mono mt-2">None selected = all categories.</p>
                )}
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <Eyebrow inline>Weekly goal</Eyebrow>
                  <span className="text-secondary text-xs font-mono">
                    {goalWeeklyTarget} {goalWeeklyTarget === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onGoal(n)}
                      aria-pressed={goalWeeklyTarget === n}
                      className={`aspect-square rounded-sm border font-mono text-xs transition-colors ${
                        goalWeeklyTarget === n
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-page text-secondary hover:border-secondary'
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-page focus-visible:ring-accent`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

function Eyebrow({ children, inline }: { children: React.ReactNode; inline?: boolean }) {
  return (
    <p className={`text-muted text-xs font-mono uppercase tracking-wider ${inline ? '' : 'mb-3'}`}>
      {children}
    </p>
  )
}
