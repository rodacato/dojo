import { Fragment, useState } from 'react'
import { isReadInlineData } from '@dojo/shared'
import type { ReadInlineInteraction } from '@dojo/shared'
import type { StepComponentProps } from './types'
import { MarkdownContent } from '../markdown'
import { splitOnInteractionMarkers } from './readInline'

// `read+inline` per docs/courses/INTERACTIVITY-PATTERNS.md §read+inline:
// a read step whose prose is broken by tap-to-reveal prompts and 2-option
// micro-quizzes anchored to `<!-- interact:<id> -->` markers. CSS state
// machines only — reveal: collapsed → expanded; micro-quiz: unanswered →
// answered. Figures embed via the regular `:figure` markdown directive
// inside the prose segments; no interaction kind needed.

export function ReadInlineStep({ step, isCompleted, onMarkComplete, onAdvance }: Readonly<StepComponentProps>) {
  const interactions = isReadInlineData(step.data) ? step.data.interactions : []
  const segments = splitOnInteractionMarkers(step.instruction, interactions)

  const continueRead = () => {
    if (!isCompleted) onMarkComplete()
    onAdvance()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {segments.map((segment, i) => (
        <Fragment key={i}>
          {segment.prose.trim() && <MarkdownContent content={segment.prose} />}
          {segment.interaction && <InlineInteraction interaction={segment.interaction} />}
        </Fragment>
      ))}
      <div className="mt-8">
        <button
          onClick={continueRead}
          className="px-6 py-2.5 bg-accent text-bg font-mono text-sm rounded transition-all duration-150 hover:bg-accent/90 active:scale-95"
        >
          {isCompleted ? 'Next →' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}

function InlineInteraction({ interaction }: Readonly<{ interaction: ReadInlineInteraction }>) {
  if (interaction.kind === 'reveal') {
    return <Reveal prompt={interaction.prompt} answer={interaction.answer} />
  }
  return (
    <MicroQuiz
      question={interaction.question}
      options={interaction.options}
      correct={interaction.correct}
      feedback={interaction.feedback}
    />
  )
}

function Reveal({ prompt, answer }: Readonly<{ prompt: string; answer: string }>) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="my-5 border border-accent/40 rounded bg-accent/5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full text-left px-4 py-3 flex items-start gap-2 font-mono text-sm text-primary cursor-pointer hover:bg-accent/10 transition-colors"
      >
        <span className="text-accent shrink-0">{expanded ? '▾' : '▸'}</span>
        <span className="flex-1 leading-relaxed">{prompt}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pl-10 animate-step-fade-in">
          <MarkdownContent content={answer} />
        </div>
      )}
    </div>
  )
}

function MicroQuiz({
  question,
  options,
  correct,
  feedback,
}: Readonly<{
  question: string
  options: [string, string]
  correct: 0 | 1
  feedback: [string, string]
}>) {
  const [picked, setPicked] = useState<0 | 1 | null>(null)
  const answered = picked !== null

  return (
    <div className="my-5 border border-border rounded bg-surface p-4 space-y-3">
      <p className="font-mono text-sm text-primary leading-relaxed">{question}</p>
      <div className="flex flex-col sm:flex-row gap-2" role="group" aria-label="Quiz options">
        {options.map((option, i) => {
          const isPicked = picked === i
          const isCorrect = i === correct
          const pickedMark = isPicked ? '✗' : ''
          let stateClass = 'border-border bg-elevated/40 hover:border-accent/60 cursor-pointer'
          if (answered) {
            if (isPicked && isCorrect) stateClass = 'border-success bg-success/10 text-success cursor-default'
            else if (isPicked) stateClass = 'border-danger bg-danger/10 text-danger cursor-default'
            else if (isCorrect) stateClass = 'border-success/60 bg-surface text-success cursor-default'
            else stateClass = 'border-border/40 bg-surface text-muted cursor-default'
          }
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => setPicked(i as 0 | 1)}
              className={`flex-1 text-left px-3 py-2 rounded border font-mono text-sm transition-all duration-200 ${stateClass}`}
            >
              {answered && (
                <span className="mr-1.5">{isCorrect ? '✓' : pickedMark}</span>
              )}
              {option}
            </button>
          )
        })}
      </div>
      {answered && picked !== null && (
        <p className="text-sm text-secondary leading-relaxed animate-step-fade-in">
          {feedback[picked]}
        </p>
      )}
    </div>
  )
}
