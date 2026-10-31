import { useEffect, useRef, useState } from 'react'
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

type Section = 'practice' | 'reminders'
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline'

const SECTIONS: readonly Section[] = ['practice', 'reminders']

const SECTION_FIELDS = {
  practice: ['level', 'interests', 'randomness', 'goalWeeklyTarget'],
  reminders: ['reminderEnabled', 'reminderHour', 'email'],
} as const satisfies Record<Section, ReadonlyArray<keyof Preferences>>

const SAVED_FADE_MS = 1500
const SLIDER_DEBOUNCE_MS = 400

function sectionFields(prefs: Preferences, section: Section): Partial<Preferences> {
  return Object.fromEntries(SECTION_FIELDS[section].map((field) => [field, prefs[field]]))
}

function sectionChanged(draft: Preferences, accepted: Preferences, section: Section): boolean {
  return JSON.stringify(sectionFields(draft, section)) !== JSON.stringify(sectionFields(accepted, section))
}

export function SettingsPage() {
  const { user, logout } = useAuth()
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [accepted, setAccepted] = useState<Preferences | null>(null)
  const [belt, setBelt] = useState<BeltDTO | null>(null)
  const [statuses, setStatuses] = useState<Record<Section, SaveStatus>>({ practice: 'idle', reminders: 'idle' })
  const [reminderDetailsInvalid, setReminderDetailsInvalid] = useState(false)
  const [reminderFieldsVersion, setReminderFieldsVersion] = useState(0)
  const [prefsFailed, setPrefsFailed] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { theme, setTheme } = useTheme()
  const draft = useRef<Preferences | null>(null)
  const lastSave = useRef<Promise<unknown>>(Promise.resolve())
  const newestSave = useRef<Partial<Record<Section, Promise<unknown>>>>({})
  const sliderTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const headings = useRef<Partial<Record<Section, HTMLHeadingElement | null>>>({})

  function setStatus(section: Section, status: SaveStatus) {
    setStatuses((current) => ({ ...current, [section]: status }))
  }

  function loadPrefs() {
    setPrefsFailed(false)
    api.getPreferences()
      .then((loaded) => {
        draft.current = loaded
        setPrefs(loaded)
        setAccepted(loaded)
      })
      .catch(() => setPrefsFailed(true))
  }

  useEffect(() => {
    loadPrefs()
    api.getBelts().then((res) => setBelt(res.belt)).catch(() => {
      // Non-blocking — settings is still usable without the belt avatar ring
    })
  }, [])

  useEffect(() => {
    const finishing = SECTIONS.filter((section) => statuses[section] === 'saved')
    if (finishing.length === 0) return
    const handle = setTimeout(() => {
      setStatuses((current) => {
        const settled = { ...current }
        for (const section of finishing) if (settled[section] === 'saved') settled[section] = 'idle'
        return settled
      })
    }, SAVED_FADE_MS)
    return () => clearTimeout(handle)
  }, [statuses])

  function cancelSliderSave() {
    if (sliderTimer.current === null) return false
    clearTimeout(sliderTimer.current)
    sliderTimer.current = null
    return true
  }

  // Saves run one at a time, so an older one can never land after a newer one.
  function persist(section: Section) {
    if (section === 'practice') cancelSliderSave()
    if (!draft.current) return
    if (!globalThis.navigator.onLine) {
      setStatus(section, 'offline')
      return
    }
    setStatus(section, 'saving')
    const fields = sectionFields(draft.current, section)
    const thisSave = lastSave.current
      .catch(() => undefined)
      .then(() => api.updatePreferences(fields))
    lastSave.current = thisSave
    newestSave.current[section] = thisSave
    thisSave
      .then(() => {
        setAccepted((current) => (current ? { ...current, ...fields } : current))
        if (newestSave.current[section] === thisSave) setStatus(section, 'saved')
      })
      .catch(() => {
        if (newestSave.current[section] === thisSave) setStatus(section, 'error')
      })
  }

  const flushSliderSave = useRef(() => {})
  flushSliderSave.current = () => {
    if (cancelSliderSave()) persist('practice')
  }

  const saveUnsaved = useRef(() => {})
  saveUnsaved.current = () => {
    for (const section of SECTIONS) {
      if (statuses[section] === 'offline' || statuses[section] === 'error') persist(section)
    }
  }

  useEffect(() => () => flushSliderSave.current(), [])

  useEffect(() => {
    const onOnline = () => saveUnsaved.current()
    globalThis.addEventListener('online', onOnline)
    return () => globalThis.removeEventListener('online', onOnline)
  }, [])

  function edit(section: Section, patch: Partial<Preferences>) {
    if (!draft.current) return
    draft.current = { ...draft.current, ...patch }
    setPrefs(draft.current)
    persist(section)
  }

  function slideRandomness(randomness: number) {
    if (!draft.current) return
    draft.current = { ...draft.current, randomness }
    setPrefs(draft.current)
    setStatus('practice', globalThis.navigator.onLine ? 'saving' : 'offline')
    cancelSliderSave()
    sliderTimer.current = setTimeout(() => persist('practice'), SLIDER_DEBOUNCE_MS)
  }

  function toggleInterest(topic: string) {
    if (!prefs) return
    const next = prefs.interests.includes(topic)
      ? prefs.interests.filter((t) => t !== topic)
      : [...prefs.interests, topic]
    edit('practice', { interests: next })
  }

  function retry(section: Section) {
    persist(section)
    headings.current[section]?.focus()
  }

  function undo(section: Section) {
    if (!draft.current || !accepted) return
    if (section === 'practice') cancelSliderSave()
    draft.current = { ...draft.current, ...sectionFields(accepted, section) }
    setPrefs(draft.current)
    setStatus(section, 'idle')
    if (section === 'reminders') setReminderFieldsVersion((version) => version + 1)
    headings.current[section]?.focus()
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
  if (!user || !prefs || !accepted) return <PageLoader />

  function sectionStatus(section: Section) {
    if (!prefs || !accepted) return null
    return (
      <SectionStatus
        section={section}
        status={statuses[section]}
        invalid={section === 'reminders' && reminderDetailsInvalid}
        remindersOff={!accepted.reminderEnabled}
        canUndo={sectionChanged(prefs, accepted, section) || (section === 'reminders' && reminderDetailsInvalid)}
        onRetry={() => retry(section)}
        onUndo={() => undo(section)}
      />
    )
  }

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
          <p className="paper-note md:text-right" role="status">
            {saveSummary(statuses, reminderDetailsInvalid)}
          </p>
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

        <Section
          title="Practice"
          busy={statuses.practice === 'saving'}
          headingRef={(el) => { headings.current.practice = el }}
          footer={sectionStatus('practice')}
        >
          <div className="flex flex-col gap-6">
            <Field label="Skill level" hint="Shapes kata difficulty and sensei tone.">
              <div className="flex gap-2 flex-wrap">
                {LEVELS.map((l) => (
                  <PillButton
                    key={l.value}
                    active={prefs.level === l.value}
                    onClick={() => edit('practice', { level: l.value })}
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
                  onChange={(e) => slideRandomness(Number(e.target.value))}
                  onBlur={() => flushSliderSave.current()}
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
                    onClick={() => edit('practice', { goalWeeklyTarget: n })}
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

        <Section
          title="Reminders"
          busy={statuses.reminders === 'saving'}
          headingRef={(el) => { headings.current.reminders = el }}
          footer={sectionStatus('reminders')}
        >
          <div className="flex flex-col gap-4">
            <Toggle
              label="Daily reminder"
              checked={prefs.reminderEnabled}
              onChange={(v) => edit('reminders', { reminderEnabled: v })}
            />
            {prefs.reminderEnabled && (
              <>
                <ReminderFields
                  key={reminderFieldsVersion}
                  email={prefs.email}
                  hour={prefs.reminderHour}
                  onEmail={(email) => edit('reminders', { email })}
                  onHour={(reminderHour) => edit('reminders', { reminderHour })}
                  onInvalidChange={setReminderDetailsInvalid}
                />
              </>
            )}
          </div>
        </Section>

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

function Section({
  title,
  busy,
  headingRef,
  footer,
  children,
}: Readonly<{
  title: string
  busy?: boolean
  headingRef?: (el: HTMLHeadingElement | null) => void
  footer?: React.ReactNode
  children: React.ReactNode
}>) {
  return (
    <section aria-label={title} aria-busy={busy} className="mt-10 md:mt-12 border-t border-border pt-6 md:pt-8">
      <h2 ref={headingRef} tabIndex={-1} className="paper-eyebrow mb-4 focus:outline-none">{title}</h2>
      {children}
      {footer}
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

// Stricter than type="email", which accepts an address the API rejects.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const REMINDER_INPUT =
  'w-full h-11 md:h-9 px-3 bg-page border border-border rounded-sm text-primary text-sm focus:outline-none focus:border-accent transition-colors'

function ReminderFields({
  email,
  hour,
  onEmail,
  onHour,
  onInvalidChange,
}: Readonly<{
  email: string | null
  hour: number
  onEmail: (email: string | null) => void
  onHour: (hour: number) => void
  onInvalidChange: (invalid: boolean) => void
}>) {
  const [emailDraft, setEmailDraft] = useState(email ?? '')
  const [hourDraft, setHourDraft] = useState(String(hour))
  const [emailInvalid, setEmailInvalid] = useState(false)
  const [hourInvalid, setHourInvalid] = useState(false)

  useEffect(() => {
    onInvalidChange(emailInvalid || hourInvalid)
    return () => onInvalidChange(false)
  }, [emailInvalid, hourInvalid, onInvalidChange])

  function commitEmail(input: HTMLInputElement) {
    const typed = emailDraft.trim()
    const valid = input.validity.valid && (typed === '' || EMAIL_SHAPE.test(typed))
    setEmailInvalid(!valid)
    const next = typed || null
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
        Sent at {hour}:00 UTC, {localHour(hour)} for you. Not before. Only if you haven&apos;t started
        today&apos;s practice. Never on a UTC weekend if your goal is under 5 days a week.
      </p>
    </>
  )
}

function saveSummary(statuses: Record<Section, SaveStatus>, reminderDetailsInvalid: boolean): string {
  const all = Object.values(statuses)
  if (all.includes('error')) return 'Some changes are not saved'
  if (reminderDetailsInvalid) return 'Check reminder details'
  if (all.includes('offline')) return 'Draft kept on this page'
  if (all.includes('saving')) return 'Saving…'
  if (all.includes('saved')) return 'Saved'
  return 'Changes auto-save'
}

function statusText(section: Section, status: SaveStatus, invalid: boolean, remindersOff: boolean): string {
  if (invalid) return 'These details are not saved yet.'
  switch (status) {
    case 'saving': return `Saving ${section}…`
    case 'saved': return section === 'reminders' && remindersOff ? 'Reminders off · saved' : 'Saved'
    case 'error': return `We couldn't save ${section}. Your choices are still here.`
    case 'offline': return 'Draft kept on this page. Reconnect to save.'
    case 'idle': return ''
  }
}

function SectionStatus({
  section,
  status,
  invalid,
  remindersOff,
  canUndo,
  onRetry,
  onUndo,
}: Readonly<{
  section: Section
  status: SaveStatus
  invalid: boolean
  remindersOff: boolean
  canUndo: boolean
  onRetry: () => void
  onUndo: () => void
}>) {
  const failed = status === 'error' && !invalid
  const undoable = canUndo && status !== 'saving'
  const text = statusText(section, status, invalid, remindersOff)
  return (
    <div className="mt-4 min-h-[18px]">
      <p className={`paper-note ${failed ? 'text-danger-text' : ''}`} role={failed ? 'alert' : undefined}>
        {text}
      </p>
      {(failed || undoable) && (
        <div className="flex gap-6 flex-wrap">
          {failed && <Button variant="link" size="lg" onClick={onRetry}>Retry {section}</Button>}
          {undoable && <Button variant="link" size="lg" onClick={onUndo}>Undo changes</Button>}
        </div>
      )}
    </div>
  )
}
