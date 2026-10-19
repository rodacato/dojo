import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { KataType } from '@dojo/shared'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'

type Duration = 10 | 20 | 30 | 45

const DURATIONS: Array<{ value: Duration; label: string }> = [
  { value: 10, label: '10m' },
  { value: 20, label: '20m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m+' },
]

const TYPES: Array<{ value: KataType | null; label: string }> = [
  { value: null, label: 'Any' },
  { value: 'code', label: 'Code' },
  { value: 'review', label: 'Review' },
  { value: 'chat', label: 'Chat' },
  { value: 'whiteboard', label: 'Whiteboard' },
]

const LANGUAGES: Array<{ value: string | null; label: string }> = [
  { value: null, label: 'Any' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'SQL' },
  { value: 'go', label: 'Go' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'javascript', label: 'JS' },
]

const LOAD_ERROR = "Couldn't load your kata. Try again."
const START_ERROR = "Couldn't start that kata. Try again."

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

// Advanced (D56): the learner sets the constraints and gets one kata inside them, with no list.
export function KatasPage() {
  const navigate = useNavigate()
  const [duration, setDuration] = useState<Duration | null>(null)
  const [type, setType] = useState<KataType | null>(null)
  const [language, setLanguage] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    if (!duration) return
    setStarting(true)
    setError(null)
    setNoMatch(false)
    let failure = LOAD_ERROR
    try {
      const katas = await api.getKatas({
        maxDuration: duration,
        ...(type ? { type } : {}),
        ...(language ? { language } : {}),
      })
      const kata = katas[0]
      if (!kata) {
        setNoMatch(true)
        setStarting(false)
        return
      }
      failure = START_ERROR
      const { sessionId } = await api.startSession(kata.id)
      navigate(`/katas/${sessionId}`)
    } catch {
      setError(failure)
      setStarting(false)
    }
  }

  function pick<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setNoMatch(false)
    }
  }

  return (
    <div className="min-h-screen bg-page px-4 py-6 md:py-16">
      <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-secondary text-xs font-mono uppercase tracking-wider">{DATE_FORMATTER.format(new Date())}</p>
          <h1 className="font-mono text-2xl md:text-3xl text-primary">Ready for your kata</h1>
          <p className="text-secondary text-sm">Set the constraints. The kata inside them is a surprise.</p>
        </header>

        <FilterGroup label="How long?" options={DURATIONS} value={duration} onChange={pick(setDuration)} />
        <FilterGroup label="Type" options={TYPES} value={type} onChange={pick(setType)} />
        <FilterGroup label="Language" options={LANGUAGES} value={language} onChange={pick(setLanguage)} />

        <div className="flex flex-col gap-3">
          {noMatch && (
            <div role="status" className="flex flex-col gap-1 p-3 rounded-sm border border-warning/30 bg-warning/10">
              <p className="text-warning-text text-sm">No kata fits all three.</p>
              <p className="text-secondary text-[13px]">Widen one: set Type or Language to Any.</p>
            </div>
          )}
          {error && (
            <p role="alert" className="text-danger-text text-sm font-mono">
              {error}
            </p>
          )}
          <Button variant="primary" size="lg" className="w-full" onClick={handleStart} loading={starting} disabled={!duration || starting}>
            Start →
          </Button>
          <p className="text-secondary text-xs font-mono text-center">
            {duration ? 'Your kata comes from your selections. No skip. No reroll.' : 'Pick how long you have to continue.'}
          </p>
        </div>
      </div>
    </div>
  )
}

function FilterGroup<T>({
  label,
  options,
  value,
  onChange,
}: Readonly<{
  label: string
  options: Array<{ value: T; label: string }>
  value: T | null
  onChange: (v: T) => void
}>) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-secondary text-xs font-mono uppercase tracking-wider">{label}</h2>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={`h-11 px-3.5 rounded-sm border font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-page focus-visible:ring-accent ${
                selected
                  ? 'border-primary ring-1 ring-inset ring-primary bg-elevated text-primary font-bold'
                  : 'border-border bg-surface text-secondary hover:border-secondary'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
