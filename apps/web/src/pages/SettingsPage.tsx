import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from '../components/PageLoader'

type Level = 'junior' | 'mid' | 'senior'

const LEVELS: Array<{ value: Level; label: string }> = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
]

const INTEREST_OPTIONS = [
  'backend', 'frontend', 'architecture', 'security',
  'devops', 'testing', 'process', 'reliability',
]

interface Preferences {
  reminderEnabled: boolean
  reminderHour: number
  email: string | null
  level: string
  interests: string[]
  randomness: number
  goalWeeklyTarget: number
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function SettingsPage() {
  const { user, logout } = useAuth()
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [save, setSave] = useState<SaveState>('idle')

  useEffect(() => {
    api.getPreferences().then(setPrefs).catch(() => setSave('error'))
  }, [])

  function update(patch: Partial<Preferences>) {
    if (!prefs) return
    const next = { ...prefs, ...patch }
    setPrefs(next)
    setSave('saving')
    api
      .updatePreferences({
        reminderEnabled: next.reminderEnabled,
        reminderHour: next.reminderHour,
        email: next.email,
        level: next.level,
        interests: next.interests,
        randomness: next.randomness,
        goalWeeklyTarget: next.goalWeeklyTarget,
      })
      .then(() => setSave('saved'))
      .catch(() => setSave('error'))
  }

  function toggleInterest(topic: string) {
    if (!prefs) return
    const next = prefs.interests.includes(topic)
      ? prefs.interests.filter((t) => t !== topic)
      : [...prefs.interests, topic]
    update({ interests: next })
  }

  if (!user || !prefs) return <PageLoader />

  return (
    <div className="px-4 md:px-6 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-mono text-2xl text-primary">
          settings<span className="text-accent">_</span>
        </h1>
        <p className="text-muted text-sm font-mono mt-1">Your account and practice preferences.</p>
      </div>

      {/* Account */}
      <Section title="account">
        <div className="flex items-center gap-4">
          <img src={user.avatarUrl} alt={user.username} className="w-14 h-14 rounded-md" />
          <div className="min-w-0">
            <p className="font-mono text-primary truncate">{user.username}</p>
            <p className="text-muted text-xs font-mono truncate">
              Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-5">
          <Link
            to={`/u/${user.username}`}
            className="px-3 py-1.5 border border-border text-secondary font-mono text-xs rounded-sm hover:border-accent hover:text-primary transition-colors"
          >
            view public profile →
          </Link>
          <button
            onClick={() => { void logout() }}
            className="px-3 py-1.5 border border-border/60 text-muted font-mono text-xs rounded-sm hover:border-danger/60 hover:text-danger transition-colors"
          >
            log out
          </button>
        </div>
      </Section>

      {/* Level */}
      <Section title="skill level" hint="Shapes exercise difficulty and sensei tone.">
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => update({ level: l.value })}
              className={`px-4 py-2 font-mono text-sm rounded-sm border transition-colors ${
                prefs.level === l.value
                  ? 'border-accent bg-accent/5 text-accent'
                  : 'border-border text-secondary hover:border-accent/50'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Interests */}
      <Section title="interests" hint="Topics you'd like to see more of in your kata rotation.">
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((topic) => {
            const active = prefs.interests.includes(topic)
            return (
              <button
                key={topic}
                onClick={() => toggleInterest(topic)}
                className={`px-3 py-1.5 font-mono text-xs rounded-sm border transition-colors ${
                  active
                    ? 'border-accent bg-accent/5 text-accent'
                    : 'border-border text-muted hover:border-accent/50 hover:text-secondary'
                }`}
              >
                {topic}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Randomness */}
      <Section
        title="randomness"
        hint="How far the dojo strays from your interests. 0 = strict, 1 = anything goes."
      >
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={prefs.randomness}
            onChange={(e) => update({ randomness: Number(e.target.value) })}
            className="flex-1 accent-accent"
          />
          <span className="font-mono text-sm text-primary w-12 text-right">
            {prefs.randomness.toFixed(1)}
          </span>
        </div>
      </Section>

      {/* Weekly goal */}
      <Section title="weekly goal" hint="How many kata you'd like to complete per week.">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => update({ goalWeeklyTarget: n })}
              className={`w-10 h-10 font-mono text-sm rounded-sm border transition-colors ${
                prefs.goalWeeklyTarget === n
                  ? 'border-accent bg-accent/5 text-accent'
                  : 'border-border text-secondary hover:border-accent/50'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </Section>

      {/* Reminders */}
      <Section title="daily reminder" hint="Email reminder to practice, if you want one.">
        <div className="flex items-center gap-3 mb-3">
          <input
            id="reminderEnabled"
            type="checkbox"
            checked={prefs.reminderEnabled}
            onChange={(e) => update({ reminderEnabled: e.target.checked })}
            className="w-4 h-4 accent-accent"
          />
          <label htmlFor="reminderEnabled" className="font-mono text-sm text-secondary">
            Send me a daily reminder
          </label>
        </div>
        {prefs.reminderEnabled && (
          <div className="pl-7 space-y-3">
            <div>
              <label className="font-mono text-xs text-muted block mb-1">Email</label>
              <input
                type="email"
                value={prefs.email ?? ''}
                onChange={(e) => update({ email: e.target.value || null })}
                placeholder="you@example.com"
                className="w-full px-3 py-1.5 bg-surface border border-border font-mono text-sm text-primary rounded-sm focus:border-accent outline-none"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-muted block mb-1">Hour (0-23, local time)</label>
              <input
                type="number"
                min={0}
                max={23}
                value={prefs.reminderHour}
                onChange={(e) => update({ reminderHour: Number(e.target.value) })}
                className="w-24 px-3 py-1.5 bg-surface border border-border font-mono text-sm text-primary rounded-sm focus:border-accent outline-none"
              />
            </div>
          </div>
        )}
      </Section>

      {/* Save indicator */}
      <div className="mt-8 font-mono text-xs text-muted h-5">
        {save === 'saving' && 'saving...'}
        {save === 'saved' && <span className="text-success">✓ saved</span>}
        {save === 'error' && <span className="text-danger">✗ failed to save</span>}
      </div>
    </div>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-8 pb-8 border-b border-border/30 last:border-0">
      <h2 className="font-mono text-xs text-muted uppercase tracking-widest mb-1">{title}</h2>
      {hint && <p className="font-mono text-xs text-muted/70 mb-4">{hint}</p>}
      <div className={hint ? '' : 'mt-3'}>{children}</div>
    </section>
  )
}
