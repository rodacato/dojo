import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { LoadState } from '../components/ui/LoadState'
import { Skeleton } from '../components/ui/SkeletonLoader'
import { Button, buttonClasses } from '../components/ui/Button'
import { Choice } from '../components/ui/Choice'
import { Input } from '../components/ui/Input'
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

const WEEKLY_GOALS = [1, 2, 3, 4, 5, 6, 7] as const

const CHOICES = 'flex gap-2 flex-wrap mt-3.5'

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
      <SettingsShell>
        <div className="max-w-2xl mx-auto text-center">
          <LoadState
            status="error"
            flush
            eyebrow="Preferences"
            title="We couldn't load your settings."
            onRetry={loadPrefs}
          />
        </div>
      </SettingsShell>
    )
  }
  if (!user || !prefs || !accepted) {
    return (
      <SettingsShell>
        <div className="max-w-2xl mx-auto text-center">
          <LoadState status="loading" eyebrow="Loading your settings">
            <div className="grid gap-4 mt-5 max-w-110 mx-auto" aria-hidden>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/5 mx-auto" />
              <Skeleton className="h-3 w-full" />
            </div>
          </LoadState>
        </div>
      </SettingsShell>
    )
  }

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
    <SettingsShell summary={saveSummary(statuses, reminderDetailsInvalid)}>
      <Section title="Account">
        <div className="flex items-start md:items-center gap-4 mb-5">
          <BeltRingAvatar src={user.avatarUrl} rank={belt?.rank} monogram={user.username.charAt(0)} size={64} alt="" />
          <div className="min-w-0">
            <p className="text-primary text-lg font-semibold wrap-anywhere">{user.username}</p>
            <p className="paper-note wrap-anywhere">@{user.username}</p>
            <p className="paper-note">
              Member since {memberSince}
              {belt && (
                <>
                  {' · '}
                  <Link to="/belts" className="text-accent-text underline whitespace-nowrap">{belt.rank} belt ↗</Link>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-x-6 flex-wrap mb-3">
          <Link to={`/u/${user.username}`} className={buttonClasses({ variant: 'link', size: 'lg' })}>
            View public profile →
          </Link>
          <Button variant="link" size="lg" onClick={() => setShowLogoutModal(true)}>
            Sign out
          </Button>
        </div>
        <p className="paper-note wrap-anywhere">
          Your profile is public at{' '}
          <Link to={`/u/${user.username}`} className="text-accent-text underline">
            {globalThis.location.host}/u/{user.username}
          </Link>
        </p>
        <div className="border-t border-border mt-5 pt-4">
          <CheckboxRow title="Make profile private" note="Profile privacy is not available yet." checked={false} disabled />
        </div>
      </Section>

      <Section title="Theme">
        <Field label="Visual theme" hint="Auto follows your OS color preference.">
          <div className={CHOICES}>
            {THEME_CHOICES.map((c) => (
              <Choice key={c.value} selected={theme === c.value} onClick={() => setTheme(c.value)}>
                {c.label}
              </Choice>
            ))}
          </div>
          <p className="paper-note mt-4">Theme stays on this device.</p>
        </Field>
      </Section>

      <Section
        title="Practice"
        busy={statuses.practice === 'saving'}
        headingRef={(el) => { headings.current.practice = el }}
        footer={sectionStatus('practice')}
      >
        <div className="flex flex-col gap-7">
          <p className="paper-note">Your standing preferences, across daily and optional practice.</p>

          <Field label="Skill level" hint="Shapes kata difficulty and sensei tone.">
            <div className={CHOICES}>
              {LEVELS.map((l) => (
                <Choice
                  key={l.value}
                  selected={prefs.level === l.value}
                  onClick={() => edit('practice', { level: l.value })}
                >
                  {l.label}
                </Choice>
              ))}
            </div>
          </Field>

          <Field label="Interests" hint="Topics you'd like more of in the rotation.">
            <div className={CHOICES}>
              {INTEREST_OPTIONS.map((topic) => {
                const active = prefs.interests.includes(topic)
                return (
                  <Choice key={topic} selected={active} onClick={() => toggleInterest(topic)}>
                    <span className="w-4.5 text-left" aria-hidden>{active ? '✓' : '+'}</span>
                    {topic}
                  </Choice>
                )
              })}
            </div>
            <p className="paper-note mt-3">
              {prefs.interests.length} {prefs.interests.length === 1 ? 'topic' : 'topics'} selected
            </p>
          </Field>

          <div>
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="settings-randomness" className="paper-body text-primary font-medium">
                Randomness
              </label>
              <output htmlFor="settings-randomness" className="font-mono text-xs tabular-nums text-secondary">
                {Math.round(prefs.randomness * 100)}%
              </output>
            </div>
            <p id="randomness-hint" className="paper-note mt-0.5">How far the dojo strays from your interests.</p>
            <input
              id="settings-randomness"
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={prefs.randomness}
              onChange={(e) => slideRandomness(Number(e.target.value))}
              onBlur={() => flushSliderSave.current()}
              aria-describedby="randomness-hint"
              aria-valuetext={randomnessText(prefs.randomness)}
              className="block w-full h-11 mt-2.5 accent-primary"
            />
            <div className="flex justify-between gap-3 font-mono text-xs text-secondary" aria-hidden>
              {RANDOMNESS_STOPS.map((s) => (
                <span key={s.label}>{s.label}</span>
              ))}
            </div>
          </div>

          <Field label="Weekly goal" hint="How many kata you'd like to complete per week.">
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2 max-w-80 md:max-w-105 mt-3.5">
              {WEEKLY_GOALS.map((n) => (
                <Choice
                  key={n}
                  selected={prefs.goalWeeklyTarget === n}
                  onClick={() => edit('practice', { goalWeeklyTarget: n })}
                  aria-label={`${n} kata per week`}
                  className="px-2"
                >
                  {n}
                </Choice>
              ))}
            </div>
            <p className="paper-note mt-3">{prefs.goalWeeklyTarget} kata per week</p>
          </Field>
        </div>
      </Section>

      <Section
        title="Reminders"
        busy={statuses.reminders === 'saving'}
        headingRef={(el) => { headings.current.reminders = el }}
        footer={sectionStatus('reminders')}
      >
        <CheckboxRow
          title="Daily reminder"
          note="A quiet nudge to come back to practice."
          checked={prefs.reminderEnabled}
          onChange={(reminderEnabled) => edit('reminders', { reminderEnabled })}
        />
        {prefs.reminderEnabled && (
          <ReminderFields
            key={reminderFieldsVersion}
            email={prefs.email}
            hour={prefs.reminderHour}
            onEmail={(email) => edit('reminders', { email })}
            onHour={(reminderHour) => edit('reminders', { reminderHour })}
            onInvalidChange={setReminderDetailsInvalid}
          />
        )}
      </Section>

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
    </SettingsShell>
  )
}

function SettingsShell({ summary, children }: Readonly<{ summary?: string; children: React.ReactNode }>) {
  return (
    <div className="paper-container py-8 md:py-12 pb-24 md:pb-24">
      <div className="max-w-240">
        <header className="md:flex md:items-end md:justify-between gap-6 mb-7 md:mb-8">
          <h1 className="paper-heading">Settings</h1>
          {summary && (
            <p className="paper-note max-md:mt-4 md:text-right md:max-w-55" role="status">{summary}</p>
          )}
        </header>
        {children}
      </div>
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
    <section
      aria-label={title}
      aria-busy={busy}
      className="md:grid md:grid-cols-[144px_minmax(0,1fr)] md:gap-10 border-t border-border pt-6 pb-7 md:pt-7 md:pb-8"
    >
      <h2 ref={headingRef} tabIndex={-1} className="paper-eyebrow max-md:mb-5 md:pt-1 focus:outline-none">
        {title}
      </h2>
      <div className="min-w-0">
        {children}
        {footer}
      </div>
    </section>
  )
}

function Field({
  label,
  hint,
  children,
}: Readonly<{
  label: string
  hint: string
  children: React.ReactNode
}>) {
  return (
    <fieldset className="min-w-0">
      <legend className="paper-body text-primary font-medium">{label}</legend>
      <p className="paper-note mt-0.5">{hint}</p>
      {children}
    </fieldset>
  )
}

function randomnessText(value: number): string {
  const stop = RANDOMNESS_STOPS.find((s) => s.value === value)
  const percent = `${Math.round(value * 100)}%`
  return stop ? `${percent} · ${stop.label}` : percent
}

function localHour(utcHour: number): string {
  const time = new Date()
  time.setUTCHours(utcHour, 0, 0, 0)
  return time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

// Stricter than type="email", which accepts an address the API rejects.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    <div className="mt-6">
      <div className="grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6 md:gap-5">
        <div>
          <Input
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
            onBlur={(e) => commitEmail(e.target)}
            aria-invalid={emailInvalid}
            aria-describedby={emailInvalid ? 'reminder-email-error' : undefined}
            placeholder="you@example.com"
            hint={emailDraft.trim() ? "Where you'd like to receive the reminder." : 'Add an email to receive reminders.'}
          />
          {emailInvalid && (
            <p id="reminder-email-error" className="text-danger-text text-sm mt-2">
              Enter a complete email, like you@example.com.
            </p>
          )}
        </div>
        <div>
          <Input
            label="Hour (0–23 UTC)"
            type="number"
            inputMode="numeric"
            min={0}
            max={23}
            step={1}
            value={hourDraft}
            onChange={(e) => setHourDraft(e.target.value)}
            onBlur={commitHour}
            aria-invalid={hourInvalid}
            aria-describedby={hourInvalid ? 'reminder-hour-error' : undefined}
            className="tabular-nums"
          />
          {hourInvalid && (
            <p id="reminder-hour-error" className="text-danger-text text-sm mt-2">
              Choose a whole hour from 0 to 23 UTC.
            </p>
          )}
        </div>
      </div>
      <p className="paper-note mt-5">
        Sent at {hour}:00 UTC, {localHour(hour)} for you. Not before. Only if you haven&apos;t started
        today&apos;s practice. Never on a UTC weekend if your goal is under 5 kata a week.
      </p>
    </div>
  )
}

function CheckboxRow({
  title,
  note,
  checked,
  disabled,
  onChange,
}: Readonly<{
  title: string
  note: string
  checked: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
}>) {
  return (
    <label className={`flex items-center justify-between gap-6 min-h-11 ${disabled ? '' : 'cursor-pointer'}`}>
      <span>
        <span className="paper-body block text-primary font-medium">{title}</span>
        <span className="paper-note block mt-1">{note}</span>
      </span>
      <input
        type="checkbox"
        aria-label={title}
        checked={checked}
        disabled={disabled}
        readOnly={!onChange}
        onChange={(e) => onChange?.(e.target.checked)}
        className="size-5.5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      />
    </label>
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
