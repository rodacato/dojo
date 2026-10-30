import { useId, useState } from 'react'
import { api, type KataFeedback } from '../../lib/api'
import { useAsync } from '../../hooks/useAsync'
import { Button } from './Button'

type Vote = 'clarity' | 'timing' | 'evaluation'

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

const SELECTED = 'border-primary ring-1 ring-inset ring-primary bg-elevated text-primary font-bold'
const UNSELECTED = 'border-border text-secondary font-medium hover:border-primary'

// D62: the trial questions sit open above the exits and every tap saves on its own.
export function FeedbackSection({ sessionId }: Readonly<{ sessionId: string }>) {
  const { data: saved, error: loadError } = useAsync(() => api.getFeedback(sessionId), [sessionId])
  const [votes, setVotes] = useState<Partial<KataFeedback>>({})
  const [more, setMore] = useState(false)
  const [note, setNote] = useState('')
  const [noteSent, setNoteSent] = useState(false)
  const [failed, setFailed] = useState(false)
  const noteId = useId()

  if (!saved && !loadError) return null

  const current = (field: Vote) => (field in votes ? votes[field] : saved?.[field])

  async function save(fields: Partial<KataFeedback>) {
    setFailed(false)
    try {
      await api.submitFeedback(sessionId, fields)
      return true
    } catch {
      setFailed(true)
      return false
    }
  }

  function vote(field: Vote) {
    return async (value: string) => {
      const previous = current(field)
      setVotes((prev) => ({ ...prev, [field]: value }))
      if (!(await save({ [field]: value }))) setVotes((prev) => ({ ...prev, [field]: previous }))
    }
  }

  async function sendNote() {
    if (await save({ note: note.trim() })) setNoteSent(true)
  }

  return (
    <section className="flex flex-col gap-5">
      <h2 className="paper-eyebrow">Quick feedback</h2>
      <Question label="Was the time limit right?" options={TIMING} value={current('timing')} onChange={vote('timing')} />
      <Question label="How was the sensei's review?" options={EVALUATION} value={current('evaluation')} onChange={vote('evaluation')} />

      {more ? (
        <>
          <Question label="Was the description clear?" options={CLARITY} value={current('clarity')} onChange={vote('clarity')} />
          <div className="flex flex-col gap-2">
            <label htmlFor={noteId} className="text-primary text-sm font-medium">
              Anything to add?
            </label>
            <textarea
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 280))}
              placeholder="One thing you'd change, or something you noticed"
              rows={3}
              className="w-full bg-page border border-border rounded-sm px-3 py-2 text-primary text-sm font-sans placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>
          {noteSent ? (
            <p className="paper-note text-center">feedback received — thank you.</p>
          ) : (
            <Button variant="ghost" size="lg" className="w-full" onClick={sendNote} disabled={!note.trim()}>
              Send note
            </Button>
          )}
        </>
      ) : (
        <Button variant="ghost" size="lg" className="w-full" onClick={() => setMore(true)}>
          More feedback
        </Button>
      )}

      {failed && (
        <p role="alert" className="text-danger-text text-xs font-mono">
          Couldn't send your feedback. Try again.
        </p>
      )}
    </section>
  )
}

function Question({
  label,
  options,
  value,
  onChange,
}: Readonly<{
  label: string
  options: ReadonlyArray<{ value: string; label: string }>
  value: string | null | undefined
  onChange: (value: string) => void
}>) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-2">
      <p id={id} className="text-primary text-sm font-medium">
        {label}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`min-h-13 px-1.5 py-1 rounded-sm border font-sans text-sm leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              value === option.value ? SELECTED : UNSELECTED
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
