import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { KataDTO, KataType } from '@dojo/shared'
import { api } from '../lib/api'
import { DURATIONS, loadKataFilters, saveKataFilters, type Duration, type KataFilters } from '../lib/kata-filters'
import { useOnline } from '../hooks/useOnline'
import { Button } from '../components/ui/Button'

const TYPES: Array<{ value: KataType | ''; label: string }> = [
  { value: '', label: 'Any' },
  { value: 'code', label: 'Code' },
  { value: 'review', label: 'Review' },
  { value: 'chat', label: 'Chat' },
  { value: 'whiteboard', label: 'Whiteboard' },
]

const LANGUAGES: Array<{ value: string; label: string }> = [
  { value: '', label: 'Any' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'SQL' },
  { value: 'go', label: 'Go' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'javascript', label: 'JS' },
]

const LOAD_ERROR = "Couldn't load your kata. Try again."
const START_ERROR = "Couldn't start that kata. Try again."

const SELECT =
  'w-full min-h-12 px-3 py-2.5 rounded-sm border border-border bg-surface text-primary font-mono text-[13px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent'

type Status = 'idle' | 'finding' | 'no-match' | 'load-error' | 'choosing' | 'starting' | 'start-error'

function storedFilters(): { duration: Duration | null; type: KataType | ''; language: string } {
  const stored = loadKataFilters()
  if (!stored) return { duration: null, type: '', language: '' }
  const language = LANGUAGES.some((l) => l.value === stored.language) ? stored.language : ''
  return { ...stored, language }
}

// Choose a kata (ADR-034): the last constraints come back with up to three kata, the first one selected.
export function KatasPage() {
  const navigate = useNavigate()
  const { online } = useOnline()
  const [initial] = useState(storedFilters)
  const [duration, setDuration] = useState<Duration | null>(initial.duration)
  const [type, setType] = useState<KataType | ''>(initial.type)
  const [language, setLanguage] = useState(initial.language)
  const [status, setStatus] = useState<Status>(initial.duration ? 'finding' : 'idle')
  const [matches, setMatches] = useState<KataDTO[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const firstChoice = useRef<HTMLInputElement>(null)
  const focusChoices = useRef(false)

  const choosing = status === 'choosing' || status === 'starting' || status === 'start-error'

  async function find(filters: KataFilters) {
    setStatus('finding')
    try {
      const katas = await api.getKatas({
        maxDuration: filters.duration,
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.language ? { language: filters.language } : {}),
      })
      saveKataFilters(filters)
      setMatches(katas)
      setSelectedId(katas[0]?.id ?? null)
      setStatus(katas.length > 0 ? 'choosing' : 'no-match')
    } catch {
      setStatus('load-error')
    }
  }

  useEffect(() => {
    if (initial.duration) void find({ duration: initial.duration, type: initial.type, language: initial.language })
    // Runs once: later lookups are the learner's own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status === 'choosing' && focusChoices.current) {
      focusChoices.current = false
      firstChoice.current?.focus()
    }
  }, [status])

  function handleFind(event: FormEvent) {
    event.preventDefault()
    if (!duration || status === 'finding' || !online) return
    focusChoices.current = true
    void find({ duration, type, language })
  }

  async function handleStart(event: FormEvent) {
    event.preventDefault()
    if (!selectedId || status === 'starting' || !online) return
    setStatus('starting')
    try {
      const { sessionId } = await api.startSession(selectedId)
      navigate(`/katas/${sessionId}`)
    } catch {
      setStatus('start-error')
    }
  }

  function edit<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      if (status !== 'finding') setStatus('idle')
    }
  }

  return (
    <div className="paper-container py-8 md:py-12">
      <div className="w-full max-w-190 flex flex-col">
        <header className="flex flex-col gap-4 max-md:gap-3.5">
          <h1 className="paper-heading max-md:text-[32px] min-[360px]:max-md:text-[36px] max-md:leading-[1.06]">Choose a kata</h1>
          <p className="paper-body max-w-150">
            {choosing ? 'Pick the one you want to practice.' : 'Set your limits, then choose from up to three katas.'}
          </p>
        </header>

        {choosing && duration ? (
          <ChoiceForm
            summary={`≤ ${duration}m · ${labelOf(TYPES, type)} · ${labelOf(LANGUAGES, language)}`}
            matches={matches}
            selectedId={selectedId}
            starting={status === 'starting'}
            error={status === 'start-error' ? START_ERROR : null}
            online={online}
            firstChoice={firstChoice}
            onSelect={(id) => {
              setSelectedId(id)
              setStatus('choosing')
            }}
            onEdit={() => setStatus('idle')}
            onSubmit={handleStart}
          />
        ) : (
          <form aria-label="Kata constraints" aria-busy={status === 'finding'} onSubmit={handleFind} className="mt-8 max-md:mt-6 border-t border-border">
            <fieldset className="py-6 min-w-0">
              <legend className="paper-eyebrow float-left w-full mb-3">Maximum duration</legend>
              <div className="clear-both grid grid-cols-3 gap-2">
                {DURATIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={duration === value}
                    disabled={status === 'finding'}
                    onClick={() => edit(setDuration)(value)}
                    className={`min-h-12 px-2 rounded-sm border font-mono text-[13px] tabular-nums transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-page focus-visible:ring-accent ${
                      duration === value
                        ? 'border-primary ring-1 ring-inset ring-primary bg-elevated text-primary'
                        : 'border-border bg-surface text-secondary hover:border-secondary'
                    }`}
                  >
                    {value}m
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid md:grid-cols-2 gap-5 md:gap-6 py-5 md:py-6 border-y border-border">
              <Field id="kata-type" label="Type">
                <select id="kata-type" className={SELECT} value={type} disabled={status === 'finding'} onChange={(e) => edit(setType)(e.target.value as KataType | '')}>
                  {TYPES.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field id="kata-language" label="Language">
                <select id="kata-language" className={SELECT} value={language} disabled={status === 'finding'} onChange={(e) => edit(setLanguage)(e.target.value)}>
                  {LANGUAGES.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </div>

            {status === 'no-match' && (
              <div role="status" className="mt-4 md:mt-5 border-l-2 border-warning py-0.5 pl-4">
                <p className="text-[15px] font-medium text-warning-text">No kata fits these filters.</p>
                <p className="text-[13px] text-secondary mt-1">Widen one: set Type or Language to Any.</p>
              </div>
            )}
            {status === 'load-error' && <p role="alert" className="mt-4 md:mt-5 font-mono text-[13px] text-danger-text">{LOAD_ERROR}</p>}

            <Submit
              hint={findHint(duration, online)}
              hintId="find-hint"
              label="Find katas →"
              busy={status === 'finding'}
              disabled={!duration || !online}
            />
          </form>
        )}
      </div>
    </div>
  )
}

function findHint(duration: Duration | null, online: boolean) {
  if (!online) return 'Reconnect to find a kata.'
  return duration ? 'Up to three options. The timer starts after you choose.' : 'Pick how long you have to continue.'
}

function labelOf<T>(options: Array<{ value: T; label: string }>, value: T) {
  return options.find((o) => o.value === value)?.label ?? 'Any'
}

function ChoiceForm({
  summary,
  matches,
  selectedId,
  starting,
  error,
  online,
  firstChoice,
  onSelect,
  onEdit,
  onSubmit,
}: Readonly<{
  summary: string
  matches: KataDTO[]
  selectedId: string | null
  starting: boolean
  error: string | null
  online: boolean
  firstChoice: React.RefObject<HTMLInputElement | null>
  onSelect: (id: string) => void
  onEdit: () => void
  onSubmit: (event: FormEvent) => void
}>) {
  return (
    <form aria-label="Choose a kata" aria-busy={starting} onSubmit={onSubmit} className="mt-6 max-md:mt-5">
      <div className="flex items-center justify-between gap-3 md:gap-5 pb-2 md:pb-3 border-b border-border">
        <p className="paper-note text-[10px] md:text-xs tabular-nums">{summary}</p>
        <Button variant="link" size="sm" type="button" disabled={starting} onClick={onEdit} className="whitespace-nowrap">
          Change constraints
        </Button>
      </div>
      <fieldset disabled={starting} className="min-w-0">
        <legend className="paper-eyebrow pt-3.5 pb-2">
          {matches.length} {matches.length === 1 ? 'kata' : 'katas'}
        </legend>
        {matches.map((kata, index) => (
          <label
            key={kata.id}
            className="flex items-start gap-3 md:gap-4 min-h-20 p-3 md:px-4 md:py-4.5 border-b border-border cursor-pointer hover:bg-surface has-checked:bg-surface has-checked:shadow-[inset_2px_0_var(--color-primary)] in-disabled:cursor-wait in-disabled:opacity-65"
          >
            <input
              ref={index === 0 ? firstChoice : undefined}
              type="radio"
              name="kata"
              value={kata.id}
              checked={kata.id === selectedId}
              onChange={() => onSelect(kata.id)}
              aria-labelledby={`title-${kata.id} meta-${kata.id}`}
              aria-describedby={`desc-${kata.id}`}
              className="appearance-none flex-none size-4.5 mt-0.75 rounded-full border border-secondary bg-page cursor-pointer checked:border-5 checked:border-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            />
            <span className="flex flex-col gap-1.25 md:gap-1.5 min-w-0">
              <span id={`title-${kata.id}`} className="text-base md:text-lg leading-[1.35] tracking-[-0.02em] text-primary">
                {kata.title}
              </span>
              <span id={`meta-${kata.id}`} className="font-mono text-[10px] md:text-[11px] text-secondary tabular-nums">
                {[`${kata.duration}m`, kata.type, ...kata.language.map(languageLabel), kata.difficulty].join(' · ')}
              </span>
              <span id={`desc-${kata.id}`} className="text-[13px] leading-normal text-secondary line-clamp-3">
                {withInlineCode(kata.description)}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      {error && <p role="alert" className="mt-4 md:mt-5 font-mono text-[13px] text-danger-text">{error}</p>}
      <Submit
        hint={online ? 'Ready when you are.' : 'Reconnect to start a kata.'}
        hintId="choice-hint"
        label="Start kata →"
        busy={starting}
        disabled={!selectedId || !online}
      />
    </form>
  )
}

function languageLabel(value: string) {
  return LANGUAGES.find((l) => l.value === value)?.label ?? value
}

function withInlineCode(text: string) {
  return text.split(/`([^`]+)`/g).map((part, i) =>
    i % 2 === 1 ? <code key={i} className="font-mono text-xs">{part}</code> : part,
  )
}

function Field({ id, label, children }: Readonly<{ id: string; label: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-3 min-w-0">
      <label htmlFor={id} className="paper-eyebrow">{label}</label>
      {children}
    </div>
  )
}

function Submit({
  hint,
  hintId,
  label,
  busy,
  disabled,
}: Readonly<{ hint: string; hintId: string; label: string; busy: boolean; disabled: boolean }>) {
  return (
    <div className="flex max-md:flex-col-reverse md:items-center md:justify-between gap-3 md:gap-8 pt-5 md:pt-6">
      <p id={hintId} className="paper-note max-md:text-center md:max-w-[44ch]">{hint}</p>
      <Button type="submit" variant="primary" size="lg" loading={busy} disabled={disabled || busy} aria-describedby={hintId} className="max-md:w-full md:min-w-50.5">
        {label}
      </Button>
    </div>
  )
}
