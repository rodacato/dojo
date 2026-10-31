import { useEffect, useId, useRef, useState } from 'react'
import { api, type KataFeedback } from '../../lib/api'
import { useAsync } from '../../hooks/useAsync'
import { Button } from './Button'
import { Disclosure } from './Disclosure'

type Vote = 'clarity' | 'timing' | 'evaluation'
type Options = ReadonlyArray<{ value: string; label: string }>

// D62: labels say exactly what is stored, since these votes measure the #193 trial.
const TIMING = [
  { value: 'too_short', label: 'Too tight' },
  { value: 'about_right', label: 'About right' },
  { value: 'too_long', label: 'Too loose' },
] as const

const EVALUATION = [
  { value: 'missed_the_point', label: 'Missed the point' },
  { value: 'too_generic', label: 'Too generic' },
  { value: 'fair_and_relevant', label: 'Spot on' },
] as const

const CLARITY = [
  { value: 'confusing', label: 'Confusing' },
  { value: 'somewhat_unclear', label: 'Somewhat unclear' },
  { value: 'clear', label: 'Clear' },
] as const

const SELECTED = 'border-primary ring-1 ring-inset ring-primary bg-elevated text-primary'
const UNSELECTED = 'border-border text-secondary hover:border-secondary'

const NOTE_LIMIT = 280

type SaveState = 'saving' | 'failed'
type Saves = Partial<Record<Vote | 'note', SaveState>>

function saveStatus(saves: Saves, saved: boolean) {
  const states = Object.values(saves)
  if (states.includes('saving')) return 'Saving…'
  if (states.includes('failed')) return 'Some feedback is not saved'
  return saved ? 'Saved' : ''
}

// D62: the trial questions sit open above the exits and every tap saves on its own.
export function FeedbackSection({ sessionId }: Readonly<{ sessionId: string }>) {
  const { data: saved, error: loadError } = useAsync(() => api.getFeedback(sessionId), [sessionId])
  const [votes, setVotes] = useState<Partial<KataFeedback>>({})
  const [note, setNote] = useState('')
  const [noteSent, setNoteSent] = useState(false)
  const [saves, setSaves] = useState<Saves>({})
  const [anySaved, setAnySaved] = useState(false)
  const noteId = useId()
  const received = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (noteSent && document.activeElement === document.body) received.current?.focus()
  }, [noteSent])

  if (!saved && !loadError) return null

  const current = (field: Vote) => (field in votes ? votes[field] : saved?.[field])

  async function save(field: Vote | 'note', value: string) {
    setSaves((prev) => ({ ...prev, [field]: 'saving' }))
    try {
      await api.submitFeedback(sessionId, { [field]: value })
      setSaves(({ [field]: _done, ...rest }) => rest)
      setAnySaved(true)
      return true
    } catch {
      setSaves((prev) => ({ ...prev, [field]: 'failed' }))
      return false
    }
  }

  function vote(field: Vote, value: string) {
    if (saves[field] === 'saving') return
    setVotes((prev) => ({ ...prev, [field]: value }))
    void save(field, value)
  }

  async function sendNote() {
    if (saves.note === 'saving') return
    if (await save('note', note.trim())) setNoteSent(true)
  }

  const question = (field: Vote, label: string, options: Options) => (
    <Question
      label={label}
      options={options}
      value={current(field)}
      save={saves[field]}
      onChange={(value) => vote(field, value)}
      onRetry={() => void save(field, String(current(field)))}
    />
  )

  return (
    <section className="mt-7 md:mt-8 pt-6 md:pt-7 border-t border-border flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="paper-eyebrow">Quick feedback</h2>
        <span className="paper-note">Optional</span>
      </div>
      {question('timing', 'Was the time limit right?', TIMING)}
      {question('evaluation', "How was the sensei's review?", EVALUATION)}

      <Disclosure summary="More feedback">
        <div className="flex flex-col gap-5 pt-2">
          {question('clarity', 'Was the description clear?', CLARITY)}
          <div className="flex flex-col gap-2">
            <label htmlFor={noteId} className="text-primary text-base font-medium">
              Anything to add?
            </label>
            <textarea
              id={noteId}
              value={note}
              onChange={(e) => {
                setNote(e.target.value.slice(0, NOTE_LIMIT))
                setNoteSent(false)
              }}
              placeholder="One thing you'd change, or something you noticed"
              rows={3}
              className="w-full min-h-28 bg-surface border border-border rounded-sm px-3 py-2 text-primary text-base font-sans placeholder:text-secondary focus:outline-none focus:border-accent transition-colors resize-y"
            />
            <div className="flex items-center justify-between gap-4">
              <span className="paper-note tabular-nums">{note.length}/{NOTE_LIMIT}</span>
              {!noteSent && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={sendNote}
                  disabled={!note.trim()}
                  aria-busy={saves.note === 'saving'}
                >
                  {saves.note === 'saving' ? 'Sending…' : 'Send note'}
                </Button>
              )}
            </div>
            {noteSent && (
              <p ref={received} tabIndex={-1} className="paper-note focus:outline-none">
                feedback received — thank you.
              </p>
            )}
            {saves.note === 'failed' && <SaveFailure onRetry={sendNote} />}
          </div>
        </div>
      </Disclosure>

      <p role="status" className="paper-note min-h-4.5">{saveStatus(saves, anySaved)}</p>
    </section>
  )
}

function SaveFailure({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4">
      <p role="alert" className="text-danger-text text-sm">
        Couldn't send your feedback. Try again.
      </p>
      <Button variant="ghost" size="lg" onClick={onRetry}>
        Retry feedback
      </Button>
    </div>
  )
}

function Question({
  label,
  options,
  value,
  save,
  onChange,
  onRetry,
}: Readonly<{
  label: string
  options: Options
  value: string | null | undefined
  save: SaveState | undefined
  onChange: (value: string) => void
  onRetry: () => void
}>) {
  const id = useId()
  const saving = save === 'saving'
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-3">
      <h3 id={id} className="text-primary text-base font-medium">
        {label}
      </h3>
      <div className="grid grid-cols-3 gap-1.5 md:gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            aria-disabled={saving}
            onClick={() => onChange(option.value)}
            className={`min-h-13 px-1.5 py-1 rounded-sm border font-sans font-medium text-base leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              value === option.value ? SELECTED : UNSELECTED
            } ${saving ? 'opacity-65 cursor-wait' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {save === 'failed' && <SaveFailure onRetry={onRetry} />}
    </div>
  )
}
