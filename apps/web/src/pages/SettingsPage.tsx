import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from '../components/PageLoader'
import { Button, buttonClasses } from '../components/ui/Button'
import { Toggle } from '../components/ui/Toggle'
import { Modal } from '../components/ui/Modal'

type Level = 'junior' | 'mid' | 'senior'

const LEVELS: Array<{ value: Level; label: string }> = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
]

const INTEREST_OPTIONS = [
  'backend', 'frontend', 'architecture', 'security',
  'devops', 'testing', 'process', 'reliability',
] as const

const RANDOMNESS_STOPS = [
  { value: 0, label: 'Predictable' },
  { value: 0.5, label: 'Balanced' },
  { value: 1, label: 'Wild' },
] as const

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
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    api.getPreferences().then(setPrefs).catch(() => setSave('error'))
  }, [])

  // Auto-fade the SAVED chip back to idle after 1.5s so the header doesn't
  // permanently advertise the last write.
  useEffect(() => {
    if (save !== 'saved') return
    const handle = setTimeout(() => setSave('idle'), 1500)
    return () => clearTimeout(handle)
  }, [save])

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

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="px-4 md:px-6 py-8 max-w-220 mx-auto">
      <header className="flex items-end justify-between gap-4 mb-8">
        <h1 className="text-primary text-2xl md:text-[32px] font-semibold leading-tight tracking-tight">
          Settings
        </h1>
        <SaveIndicator state={save} />
      </header>

      <Section title="Account">
        <div className="bg-surface border border-border rounded-md p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex items-center gap-4 md:flex-1 min-w-0">
              <img
                src={user.avatarUrl}
                alt=""
                aria-hidden
                className="w-16 h-16 rounded-full bg-elevated shrink-0"
              />
              <div className="min-w-0">
                <p className="text-primary text-lg font-semibold truncate">{user.username}</p>
                <p className="text-muted text-[13px]">@{user.username}</p>
                <p className="text-muted text-[11px] font-mono tracking-[0.04em] mt-1">
                  Member since {memberSince}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:w-56">
              <Link
                to={`/u/${user.username}`}
                className={buttonClasses({ variant: 'ghost', size: 'md' })}
              >
                View public profile →
              </Link>
              <Button variant="ghost" size="md" onClick={() => setShowLogoutModal(true)}>
                Sign out
              </Button>
            </div>
          </div>
          <p className="text-muted text-[11px] font-mono tracking-[0.04em] mt-4 truncate">
            Your profile is public at{' '}
            <Link to={`/u/${user.username}`} className="text-accent underline">
              dojo.notdefined.dev/u/{user.username}
            </Link>
          </p>
          <div className="border-t border-border mt-4 pt-4 flex items-center justify-between">
            <p className="text-secondary text-[13px]">Make profile private</p>
            <Toggle
              checked={false}
              onChange={() => {
                /* G-NNN — backend `is_public` flag not yet implemented. */
              }}
              ariaLabel="Make profile private"
              disabled
            />
          </div>
        </div>
      </Section>

      <Section title="Practice">
        <div className="bg-surface border border-border rounded-md p-6 flex flex-col gap-6">
          <Field label="Skill level" hint="Shapes exercise difficulty and sensei tone.">
            <div className="flex gap-2 flex-wrap">
              {LEVELS.map((l) => (
                <PillButton
                  key={l.value}
                  active={prefs.level === l.value}
                  onClick={() => update({ level: l.value })}
                >
                  {l.label}
                </PillButton>
              ))}
            </div>
          </Field>

          <Field label="Interests" hint="Topics you'd like more of in the rotation.">
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((topic) => {
                const active = prefs.interests.includes(topic)
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleInterest(topic)}
                    aria-pressed={active}
                    className={`font-mono text-[12px] px-3 py-1.5 rounded-sm border transition-colors ${
                      active
                        ? 'border-accent text-accent'
                        : 'border-border text-secondary hover:border-accent/50'
                    }`}
                  >
                    {active && <span className="mr-1">✓</span>}
                    {topic}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Randomness" hint="How far the dojo strays from your interests.">
            <div className="flex flex-col gap-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={prefs.randomness}
                onChange={(e) => update({ randomness: Number(e.target.value) })}
                className="w-full accent-accent"
                aria-label="Randomness"
              />
              <div className="flex justify-between font-mono text-[10px] tracking-[0.08em] uppercase text-muted">
                {RANDOMNESS_STOPS.map((s) => (
                  <span key={s.label}>{s.label}</span>
                ))}
              </div>
            </div>
          </Field>

          <Field label="Weekly goal" hint="How many kata you'd like to complete per week.">
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => update({ goalWeeklyTarget: n })}
                  aria-pressed={prefs.goalWeeklyTarget === n}
                  className={`w-10 h-10 inline-flex items-center justify-center font-mono text-[13px] rounded-sm border transition-colors ${
                    prefs.goalWeeklyTarget === n
                      ? 'border-accent text-accent'
                      : 'border-border text-secondary hover:border-accent/50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      <Section title="Reminders">
        <div className="bg-surface border border-border rounded-md p-6 flex flex-col gap-4">
          <Toggle
            label="Daily reminder"
            checked={prefs.reminderEnabled}
            onChange={(v) => update({ reminderEnabled: v })}
          />
          {prefs.reminderEnabled && (
            <>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted text-[11px] font-mono tracking-[0.04em] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={prefs.email ?? ''}
                    onChange={(e) => update({ email: e.target.value || null })}
                    placeholder="you@example.com"
                    className="w-full h-9 px-3 bg-page border border-border rounded-sm text-primary text-[13px] focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-muted text-[11px] font-mono tracking-[0.04em] mb-1">
                    Hour (0–23 local)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={prefs.reminderHour}
                    onChange={(e) => update({ reminderHour: Number(e.target.value) })}
                    className="w-full h-9 px-3 bg-page border border-border rounded-sm text-primary text-[13px] tabular-nums focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
              <p className="text-muted text-[11px] font-mono tracking-[0.04em]">
                Sent at the time you pick. Not before. Never weekends if your goal is &lt; 5
                days/week.
              </p>
            </>
          )}
        </div>
      </Section>

      <p className="text-center text-muted text-[10px] font-mono tracking-[0.08em] uppercase mt-12 opacity-70">
        Changes auto-save.
      </p>

      <Modal open={showLogoutModal} onClose={() => setShowLogoutModal(false)}>
        <div className="p-6">
          <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted mb-3">
            Sign out?
          </p>
          <p className="text-secondary text-[14px] leading-relaxed mb-6">
            You&apos;ll lose your session. Active kata in progress will be lost.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setShowLogoutModal(false)}>
              Stay
            </Button>
            <Button variant="destructive" size="md" onClick={() => { void logout() }}>
              Sign out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted">{title}</h2>
        <span className="flex-1 h-px bg-border" />
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-primary text-[14px] font-medium">{label}</p>
        {hint && <p className="text-muted text-[12px] mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`font-mono text-[11px] tracking-[0.08em] uppercase px-3 py-1.5 rounded-sm border transition-colors ${
        active ? 'border-accent text-accent' : 'border-border text-secondary hover:border-accent/50'
      }`}
    >
      {children}
    </button>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return <div className="h-4" aria-hidden />
  return (
    <div className="font-mono text-[11px] tracking-[0.08em] uppercase">
      {state === 'saving' && (
        <span className="text-secondary inline-flex items-center">
          Saving<span className="animate-cursor text-accent ml-0.5" aria-hidden>_</span>
        </span>
      )}
      {state === 'saved' && <span className="text-success">Saved</span>}
      {state === 'error' && <span className="text-danger">Error</span>}
    </div>
  )
}
