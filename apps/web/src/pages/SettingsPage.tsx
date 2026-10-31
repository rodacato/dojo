import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from '../components/PageLoader'
import { ErrorState } from '../components/ui/ErrorState'
import { Button, buttonClasses } from '../components/ui/Button'
import { Toggle } from '../components/ui/Toggle'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { BeltRingAvatar } from '../components/ui/BeltRingAvatar'
import { useTheme } from '../hooks/useTheme'
import type { ThemeChoice } from '../lib/theme'
import type { BeltDTO } from '@dojo/shared'

const THEME_CHOICES: Array<{ value: ThemeChoice; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'sumi', label: 'Sumi (dark)' },
  { value: 'washi', label: 'Washi (light)' },
]

type Level = 'junior' | 'mid' | 'senior'

// D42: selected reads by weight and a 2px-looking edge, the same as Advanced's chips.
const SELECTED = 'border-primary ring-1 ring-inset ring-primary bg-elevated text-primary font-bold'
const UNSELECTED = 'border-border text-secondary hover:border-primary'

const LEVELS: Array<{ value: Level; label: string }> = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
]

const INTEREST_OPTIONS = [
  'backend', 'frontend', 'architecture', 'security',
  'devops', 'testing', 'process', 'reliability',
  'debugging', 'sql',
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
  const [belt, setBelt] = useState<BeltDTO | null>(null)
  const [save, setSave] = useState<SaveState>('idle')
  const [prefsFailed, setPrefsFailed] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { theme, setTheme } = useTheme()

  function loadPrefs() {
    setPrefsFailed(false)
    api.getPreferences().then(setPrefs).catch(() => setPrefsFailed(true))
  }

  useEffect(() => {
    loadPrefs()
    api.getBelts().then((res) => setBelt(res.belt)).catch(() => {
      // Non-blocking — settings is still usable without the belt avatar ring
    })
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

  if (prefsFailed && !prefs) {
    return (
      <ErrorState
        variant="inline"
        message="We couldn't load your settings."
        primaryAction={{ label: 'Try again', onClick: loadPrefs }}
      />
    )
  }
  if (!user || !prefs) return <PageLoader />

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="paper-container py-8 md:py-12">
      <div className="max-w-3xl">
        <header className="flex items-end justify-between gap-4 mb-8">
          <h1 className="paper-heading">
            Settings
          </h1>
          <SaveIndicator state={save} />
        </header>

        <Section title="Account">
          <div>
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex items-center gap-4 md:flex-1 min-w-0">
                {belt ? (
                  <BeltRingAvatar src={user.avatarUrl} rank={belt.rank} size={64} alt="" />
                ) : (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    aria-hidden
                    className="w-16 h-16 rounded-full bg-elevated shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-primary text-lg font-semibold truncate">{user.username}</p>
                  <p className="text-secondary text-sm">@{user.username}</p>
                  <p className="paper-note mt-1">
                    Member since {memberSince}
                    {belt && ` · ${belt.rank} belt`}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:w-56">
                <Link
                  to={`/u/${user.username}`}
                  className={`${buttonClasses({ variant: 'ghost', size: 'md' })} max-md:h-11`}
                >
                  View public profile →
                </Link>
                <Button variant="ghost" size="md" className="max-md:h-11" onClick={() => setShowLogoutModal(true)}>
                  Sign out
                </Button>
              </div>
            </div>
            <p className="paper-note mt-4 truncate">
              Your profile is public at{' '}
              <Link to={`/u/${user.username}`} className="text-accent-text underline">
                {globalThis.location.host}/u/{user.username}
              </Link>
            </p>
            <div className="border-t border-border mt-4 pt-4 flex items-center justify-between">
              <p className="paper-body">Make profile private</p>
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

        <Section title="Theme">
          <div>
            <Field label="Visual theme" hint="Auto follows your OS color preference.">
              <div className="flex gap-2 flex-wrap">
                {THEME_CHOICES.map((c) => (
                  <PillButton
                    key={c.value}
                    active={theme === c.value}
                    onClick={() => setTheme(c.value)}
                  >
                    {c.label}
                  </PillButton>
                ))}
              </div>
            </Field>
          </div>
        </Section>

        <Section title="Practice">
          <div className="flex flex-col gap-6">
            <Field label="Skill level" hint="Shapes kata difficulty and sensei tone.">
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
                      className={`font-mono text-xs px-3 py-1.5 max-md:min-h-11 max-md:px-3.5 rounded-sm border transition-colors ${
                        active ? SELECTED : UNSELECTED
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
                  className="w-full max-md:h-11 accent-accent"
                  aria-label="Randomness"
                />
                <div className="flex justify-between font-mono text-xs tracking-[0.08em] uppercase text-secondary">
                  {RANDOMNESS_STOPS.map((s) => (
                    <span key={s.label}>{s.label}</span>
                  ))}
                </div>
              </div>
            </Field>

            <Field label="Weekly goal" hint="How many kata you'd like to complete per week.">
              <div className="grid grid-cols-7 gap-1.5 md:flex md:gap-2 md:flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => update({ goalWeeklyTarget: n })}
                    aria-pressed={prefs.goalWeeklyTarget === n}
                    className={`h-11 md:w-10 md:h-10 inline-flex items-center justify-center font-mono text-sm rounded-sm border transition-colors ${
                      prefs.goalWeeklyTarget === n ? SELECTED : UNSELECTED
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
          <div className="flex flex-col gap-4">
            <Toggle
              label="Daily reminder"
              checked={prefs.reminderEnabled}
              onChange={(v) => update({ reminderEnabled: v })}
            />
            {prefs.reminderEnabled && (
              <>
                <ReminderFields
                  email={prefs.email}
                  hour={prefs.reminderHour}
                  onEmail={(email) => update({ email })}
                  onHour={(reminderHour) => update({ reminderHour })}
                />
              </>
            )}
          </div>
        </Section>

        <p className="paper-note text-center uppercase mt-12">
          Changes auto-save.
        </p>
      </div>

      <ConfirmModal
        open={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        eyebrow="Sign out?"
        tone="muted"
        title="See you tomorrow."
        cancelLabel="Stay"
        primaryVariant="destructive"
        primaryLabel="Sign out"
        onConfirm={() => { void logout() }}
      >
        <p>You&apos;ll lose your session. Active kata in progress will be lost.</p>
      </ConfirmModal>
    </div>
  )
}

function Section({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="mt-10 md:mt-12 border-t border-border pt-6 md:pt-8">
      <h2 className="paper-eyebrow mb-4">{title}</h2>
      {children}
    </section>
  )
}

function Field({
  label,
  hint,
  children,
}: Readonly<{
  label: string
  hint?: string
  children: React.ReactNode
}>) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="paper-body text-primary font-medium">{label}</p>
        {hint && <p className="paper-note mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function PillButton({
  active,
  onClick,
  children,
}: Readonly<{
  active: boolean
  onClick: () => void
  children: React.ReactNode
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`font-mono text-xs tracking-[0.08em] uppercase px-3 py-1.5 max-md:min-h-11 max-md:px-3.5 rounded-sm border transition-colors ${
        active ? SELECTED : UNSELECTED
      }`}
    >
      {children}
    </button>
  )
}

function localHour(utcHour: number): string {
  const time = new Date()
  time.setUTCHours(utcHour, 0, 0, 0)
  return time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

const REMINDER_INPUT =
  'w-full h-11 md:h-9 px-3 bg-page border border-border rounded-sm text-primary text-sm focus:outline-none focus:border-accent transition-colors'

function ReminderFields({
  email,
  hour,
  onEmail,
  onHour,
}: Readonly<{
  email: string | null
  hour: number
  onEmail: (email: string | null) => void
  onHour: (hour: number) => void
}>) {
  const [emailDraft, setEmailDraft] = useState(email ?? '')
  const [hourDraft, setHourDraft] = useState(String(hour))
  const [emailInvalid, setEmailInvalid] = useState(false)
  const [hourInvalid, setHourInvalid] = useState(false)

  function commitEmail(input: HTMLInputElement) {
    const valid = input.validity.valid
    setEmailInvalid(!valid)
    const next = emailDraft.trim() || null
    if (valid && next !== email) onEmail(next)
  }

  function commitHour() {
    const next = Number(hourDraft)
    const valid = hourDraft.trim() !== '' && Number.isInteger(next) && next >= 0 && next <= 23
    setHourInvalid(!valid)
    if (valid && next !== hour) onHour(next)
  }

  return (
    <>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="reminder-email" className="block text-secondary text-xs font-mono tracking-[0.04em] mb-1">
            Email
          </label>
          <input
            id="reminder-email"
            type="email"
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
            onBlur={(e) => commitEmail(e.target)}
            aria-invalid={emailInvalid}
            placeholder="you@example.com"
            className={REMINDER_INPUT}
          />
          {emailInvalid && <p className="text-danger-text text-sm mt-1">That doesn't look like an email.</p>}
        </div>
        <div>
          <label htmlFor="reminder-hour" className="block text-secondary text-xs font-mono tracking-[0.04em] mb-1">
            Hour (0–23 UTC)
          </label>
          <input
            id="reminder-hour"
            type="number"
            min={0}
            max={23}
            value={hourDraft}
            onChange={(e) => setHourDraft(e.target.value)}
            onBlur={commitHour}
            aria-invalid={hourInvalid}
            className={`${REMINDER_INPUT} tabular-nums`}
          />
          {hourInvalid && <p className="text-danger-text text-sm mt-1">Pick an hour from 0 to 23.</p>}
        </div>
      </div>
      <p className="paper-note">
        Sent at {hour}:00 UTC, {localHour(hour)} for you. Not before. Never weekends if your goal
        is &lt; 5 days/week.
      </p>
    </>
  )
}

function SaveIndicator({ state }: Readonly<{ state: SaveState }>) {
  if (state === 'idle') return <div className="h-4" aria-hidden />
  return (
    <div className="font-mono text-xs tracking-[0.08em] uppercase">
      {state === 'saving' && (
        <span className="text-secondary inline-flex items-center">
          Saving<span className="animate-cursor text-accent ml-0.5" aria-hidden>_</span>
        </span>
      )}
      {state === 'saved' && <span className="text-success-text">Saved</span>}
      {state === 'error' && <span className="text-danger-text">Error</span>}
    </div>
  )
}
