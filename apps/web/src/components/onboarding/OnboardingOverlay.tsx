import { LogoMark } from '../Logo'
import { Button } from '../ui/Button'

interface OnboardingOverlayProps {
  daily: boolean
  onStart: () => void
  onDismiss: () => void
}

const DAILY_STAGES = [
  { n: '01', label: "Open today's kata" },
  { n: '02', label: 'Work it' },
  { n: '03', label: 'Submit' },
  { n: '04', label: 'Sensei evaluates' },
] as const

const ADVANCED_STAGES = [
  { n: '01', label: 'Set the constraints' },
  { n: '02', label: 'Get one kata' },
  { n: '03', label: 'Work it' },
  { n: '04', label: 'Sensei evaluates' },
] as const

// First-visit welcome card. Non-modal — clicking the backdrop does NOT
// dismiss; user must use Skip, X, or the primary CTA. The backdrop is a
// flat 60% page color (no blur) so the underlying dashboard stays visible.
export function OnboardingOverlay({ daily, onStart, onDismiss }: Readonly<OnboardingOverlayProps>) {
  const stages = daily ? DAILY_STAGES : ADVANCED_STAGES

  function handleStart() {
    onDismiss()
    onStart()
  }

  return (
    <dialog
      open
      className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center bg-page/60 px-4 py-8"
      aria-labelledby="onboarding-headline"
    >
      <div className="relative w-full max-w-120 bg-surface border border-border rounded-md p-6 md:p-8">
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss welcome"
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center text-secondary hover:text-primary transition-colors text-lg leading-none"
        >
          ×
        </button>

        <div className="flex items-center gap-2 mb-6">
          <LogoMark size={20} className="text-accent" />
          <span className="font-mono font-bold text-primary text-base inline-flex items-center select-none">
            dojo<span className="animate-cursor ml-0.5" aria-hidden>_</span>
          </span>
        </div>

        <p className="paper-eyebrow mb-3">
          Invited by the dojo
        </p>
        <h2 id="onboarding-headline" className="font-sans font-bold text-primary text-3xl leading-tight tracking-tight mb-3">
          Welcome to the dojo.
        </h2>
        <p className="paper-body mb-6">
          You&apos;ve been invited to a daily practice. There&apos;s no tour. There&apos;s no
          tutorial. You&apos;ll start with one kata. The sensei will evaluate it. Then
          you&apos;ll know if this is for you or not.
        </p>

        <ol className="border-y border-border divide-y divide-border mb-6">
          {stages.map((stage) => (
            <li key={stage.n} className="flex items-baseline gap-4 py-2.5">
              <span className="paper-note tabular-nums">{stage.n}</span>
              <span className="text-primary text-sm">{stage.label}</span>
            </li>
          ))}
        </ol>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between sm:items-center">
          <Button variant="ghost" size="md" onClick={onDismiss}>
            Skip — I get it
          </Button>
          <Button variant="primary" size="md" onClick={handleStart}>
            Show me the first kata →
          </Button>
        </div>

        <p className="paper-note mt-4 text-center">
          This message appears once. It won&apos;t be back tomorrow.
        </p>
      </div>
    </dialog>
  )
}
