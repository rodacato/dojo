import { useRef, useState, type KeyboardEvent } from 'react'
import type { StepComponentProps } from './types'
import { MarkdownContent } from '../markdown'

// CSS-driven state machine for the `predict` step type per ADR 022 +
// docs/courses/INTERACTIVITY-PATTERNS.md §predict. Three states:
//   unanswered → revealed
// (the "reviewing" intermediate state from the doc applies to the Rive
// variant; CSS skips directly to revealed because no async transition is
// needed). On reveal, the per-option feedback is the load-bearing surface
// — the wrong-answer voice addresses the specific mental model the
// distractor encodes, not the right answer in the abstract.

export function PredictStep({
  step,
  language,
  isCompleted,
  onMarkComplete,
  onAdvance,
}: Readonly<StepComponentProps>) {
  // Predict: revealing the answer is what marks the step complete (so the
  // learner gets credit for engaging with the prediction even before they hit
  // Next). Continue advances. Splitting the two means the reveal stays on
  // screen at full opacity until the learner is ready to move on.
  const continuePredict = () => {
    if (!isCompleted) onMarkComplete()
    onAdvance()
  }
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const data = step.data as {
    snippet: string
    options: { id: string; text: string }[]
    correct: string
    feedback: Record<string, string>
  } | null

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-sm font-mono text-danger">
          Predict step is missing required `data` payload.
        </p>
      </div>
    )
  }

  const revealed = selectedId !== null
  const isCorrect = revealed && selectedId === data.correct

  // Arrow keys move focus between options without selecting — selection
  // reveals the answer and can't be undone, so Enter/Space stays the commit.
  const handleOptionKeyDown = (e: KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const count = data.options.length
    optionRefs.current[(index + delta + count) % count]?.focus()
  }

  const stepTitle = step.title ?? `Step ${step.order}`
  const instructionBody = step.instruction
    .replace(new RegExp(String.raw`^# +${stepTitle}\s*\n+`), '')
    .trim()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted mb-2">
          Predict
        </p>
        <h1 className="text-xl md:text-2xl font-mono text-primary leading-tight">
          {stepTitle}
        </h1>
      </div>

      {instructionBody && (
        <div className="text-secondary leading-relaxed">
          <MarkdownContent content={instructionBody} />
        </div>
      )}

      <pre className="bg-surface border border-border rounded p-4 overflow-x-auto">
        <code className={`font-mono text-sm text-primary language-${language}`}>
          {data.snippet}
        </code>
      </pre>

      <div role="radiogroup" aria-label="Predict the result" className="space-y-2">
        {data.options.map((opt, i) => {
          const letter = String.fromCodePoint('A'.codePointAt(0)! + i)
          const isSelected = selectedId === opt.id
          const isThisCorrect = opt.id === data.correct
          let stateClass = 'border-border bg-surface hover:border-accent/60 hover:bg-elevated/40'
          let icon: string | null = null
          if (revealed) {
            if (isSelected && isThisCorrect) {
              stateClass = 'border-success bg-success/10 text-success'
              icon = '✓'
            } else if (isSelected && !isThisCorrect) {
              stateClass = 'border-danger bg-danger/10 text-danger'
              icon = '✗'
            } else if (!isSelected && isThisCorrect) {
              stateClass = 'border-success/60 bg-surface text-success'
              icon = '✓'
            } else {
              stateClass = 'border-border/40 bg-surface text-muted'
            }
          }
          return (
            <button
              key={opt.id}
              ref={(el) => { optionRefs.current[i] = el }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={revealed}
              onClick={() => setSelectedId(opt.id)}
              onKeyDown={(e) => handleOptionKeyDown(e, i)}
              className={`w-full text-left px-4 py-3 rounded border transition-all duration-200 font-mono text-sm flex items-start gap-3 ${stateClass} ${revealed ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'}`}
            >
              <span className="shrink-0 w-6 h-6 rounded border border-current/40 flex items-center justify-center text-xs">
                {revealed && icon ? icon : letter}
              </span>
              <span className="flex-1 min-w-0 break-words leading-relaxed pt-0.5">{opt.text}</span>
            </button>
          )
        })}
      </div>

      {revealed && (
        <div
          key={selectedId}
          className={`animate-step-fade-in rounded border p-4 ${isCorrect ? 'border-success/40 bg-success/5' : 'border-danger/40 bg-danger/5'}`}
        >
          <p className={`font-mono text-xs uppercase tracking-[0.08em] mb-2 ${isCorrect ? 'text-success' : 'text-danger'}`}>
            {isCorrect ? 'Correct' : 'Not quite'}
          </p>
          <p className="text-secondary leading-relaxed whitespace-pre-wrap">
            {data.feedback[selectedId] ?? ''}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={continuePredict}
          disabled={!revealed}
          className="px-6 py-2.5 bg-accent text-bg font-mono text-sm rounded transition-all duration-150 hover:bg-accent/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isCompleted ? 'Next →' : 'Continue →'}
        </button>
        {!revealed && (
          <span className="text-xs font-mono text-muted">
            Pick an answer to reveal the explanation.
          </span>
        )}
      </div>
    </div>
  )
}
