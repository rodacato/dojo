import { useState } from 'react'
import type { LessonDTO } from '@dojo/shared'
import { extractStepTitle, stepTypeLabel } from './steps/stepMeta'

export function LessonNav({
  lesson,
  index,
  activeStepId,
  completedSteps,
  onSelectStep,
}: {
  lesson: LessonDTO
  index: number
  activeStepId: string | null
  completedSteps: string[]
  onSelectStep: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const lessonNumber = index.toString().padStart(2, '0')
  const lessonStepsDone = lesson.steps.filter((s) => completedSteps.includes(s.id)).length
  const allDone = lessonStepsDone === lesson.steps.length

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 h-8 flex items-center gap-2 hover:bg-elevated/50 transition-colors text-left"
        aria-expanded={expanded}
      >
        <span className="font-mono text-xs text-muted shrink-0">{expanded ? '▾' : '▸'}</span>
        <span className="font-mono text-sm text-primary truncate">
          <span className="text-muted">{lessonNumber} ·</span> {lesson.title}
        </span>
        <span
          className={`ml-auto font-mono text-xs tracking-[0.04em] shrink-0 ${
            allDone ? 'text-success' : 'text-muted'
          }`}
        >
          {lessonStepsDone}/{lesson.steps.length}
        </span>
      </button>
      {expanded && (
        <div>
          {lesson.steps.map((step) => {
            const isActive = step.id === activeStepId
            const isComplete = completedSteps.includes(step.id)
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelectStep(step.id)}
                className={`w-full pl-9 pr-4 h-7 flex items-center gap-2 transition-colors text-left text-xs ${
                  isActive
                    ? 'bg-accent/8 border-l-2 border-accent text-primary'
                    : 'border-l-2 border-transparent text-secondary hover:text-primary hover:bg-elevated/30'
                }`}
              >
                <StepStatusIcon complete={isComplete} active={isActive} />
                <span className="truncate flex-1" title={extractStepTitle(step)}>
                  {extractStepTitle(step)}
                </span>
                <span className="font-mono text-[9px] tracking-[0.08em] uppercase text-muted shrink-0">
                  {stepTypeLabel(step.type)}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StepStatusIcon({ complete, active }: { complete: boolean; active: boolean }) {
  if (complete) {
    return (
      <span className="font-mono text-xs text-success shrink-0" aria-hidden>
        ✓
      </span>
    )
  }
  if (active) {
    return (
      <span className="font-mono text-xs text-accent shrink-0" aria-hidden>
        ▸
      </span>
    )
  }
  return (
    <span className="font-mono text-xs text-muted shrink-0" aria-hidden>
      ○
    </span>
  )
}
