import { useState } from 'react'
import { api } from '../../lib/api'
import { GroupButtons } from './GroupButtons'

const CLARITY_OPTIONS = [
  { value: 'confusing', label: 'Confusing' },
  { value: 'somewhat_unclear', label: 'Somewhat clear' },
  { value: 'clear', label: 'Crystal clear' },
] as const

const TIMING_OPTIONS = [
  { value: 'too_short', label: 'Too tight' },
  { value: 'about_right', label: 'About right' },
  { value: 'too_long', label: 'Too loose' },
] as const

const EVALUATION_OPTIONS = [
  { value: 'missed_the_point', label: 'Missed the point' },
  { value: 'too_generic', label: 'Somewhat relevant' },
  { value: 'fair_and_relevant', label: 'Spot on' },
] as const

interface FeedbackSectionProps {
  sessionId: string
  alreadySubmitted: boolean
}

export function FeedbackSection({ sessionId, alreadySubmitted }: FeedbackSectionProps) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(alreadySubmitted)
  const [submitting, setSubmitting] = useState(false)
  const [clarity, setClarity] = useState<string | null>(null)
  const [timing, setTiming] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<string | null>(null)
  const [note, setNote] = useState('')

  if (submitted) {
    return (
      <p className="text-muted/50 text-xs font-mono text-center mt-6">
        feedback received — thank you.
      </p>
    )
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await api.submitFeedback(sessionId, {
        clarity,
        timing,
        evaluation,
        note: note.trim() || null,
      })
      setSubmitted(true)
    } catch {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-muted/40 text-xs font-mono hover:text-muted transition-colors mt-6 block mx-auto"
      >
        how was this kata? (optional)
      </button>
    )
  }

  return (
    <div className="mt-6 border border-border/30 rounded-md p-5 max-w-md mx-auto space-y-5">
      <p className="text-secondary text-xs font-mono uppercase tracking-wider">quick feedback</p>

      <div>
        <p className="text-secondary text-xs mb-2">Was the description clear?</p>
        <GroupButtons
          options={[...CLARITY_OPTIONS]}
          value={clarity}
          onChange={setClarity}
          size="sm"
        />
      </div>

      <div>
        <p className="text-secondary text-xs mb-2">Was the time limit right?</p>
        <GroupButtons
          options={[...TIMING_OPTIONS]}
          value={timing}
          onChange={setTiming}
          size="sm"
        />
      </div>

      <div>
        <p className="text-secondary text-xs mb-2">Did the evaluation feel fair?</p>
        <GroupButtons
          options={[...EVALUATION_OPTIONS]}
          value={evaluation}
          onChange={setEvaluation}
          size="sm"
        />
      </div>

      <div>
        <p className="text-secondary text-xs mb-2">Anything to add? <span className="text-muted/50">(optional)</span></p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 280))}
          placeholder="One thing you'd change or noticed"
          rows={2}
          className="w-full bg-base border border-border rounded-sm px-3 py-2 text-primary text-sm font-sans placeholder:text-muted/40 focus:outline-none focus:border-accent transition-colors resize-none"
        />
        <p className="text-muted/30 text-[10px] font-mono text-right mt-1">{note.length}/280</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 py-2 text-muted text-xs font-mono hover:text-secondary transition-colors"
        >
          skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || (!clarity && !timing && !evaluation && !note.trim())}
          className="flex-1 py-2 bg-accent text-primary text-xs font-mono rounded-sm hover:bg-accent/90 disabled:opacity-30 transition-colors"
        >
          {submitting ? '...' : 'send'}
        </button>
      </div>
    </div>
  )
}
