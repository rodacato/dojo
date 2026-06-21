import type { StepComponentProps } from './types'
import { MarkdownContent } from '../markdown'

export function ReadStep({ step, isCompleted, onMarkComplete, onAdvance }: Readonly<StepComponentProps>) {
  // Read steps: the Continue button both marks-and-advances. There's nothing
  // to unlock on a read step (no solution tab), so the chained behaviour is
  // the right UX.
  const continueRead = () => {
    if (!isCompleted) onMarkComplete()
    onAdvance()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <MarkdownContent content={step.instruction} />
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
