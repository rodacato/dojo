import { useNavigate } from 'react-router-dom'
import { LogoMark } from '../Logo'
import { Button } from '../ui/Button'

interface OnboardingOverlayProps {
  onDismiss: () => void
}

const STAGES = [
  { n: '01', label: 'Mood + time' },
  { n: '02', label: 'Pick from 3' },
  { n: '03', label: 'Work it' },
  { n: '04', label: 'Sensei evaluates' },
] as const

// First-visit welcome card. Non-modal — clicking the backdrop does NOT
// dismiss; user must use Skip, X, or the primary CTA. The backdrop is a
// flat 60% page color (no blur) so the underlying dashboard stays visible.
export function OnboardingOverlay({ onDismiss }: OnboardingOverlayProps) {
  const navigate = useNavigate()

  function handleStart() {
    onDismiss()
    navigate('/start')
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-page/60 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="false"
      aria-labelledby="onboarding-headline"
    >
      <div className="relative w-full max-w-120 bg-surface border border-border rounded-md p-6 md:p-8">
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss welcome"
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center text-muted hover:text-primary transition-colors text-lg leading-none"
        >
          ×
        </button>

        <div className="flex items-center gap-2 mb-6">
          <LogoMark size={20} className="text-accent" />
          <span className="font-mono font-bold text-primary text-base inline-flex items-center select-none">
            dojo<span className="animate-cursor text-accent ml-0.5" aria-hidden>_</span>
          </span>
        </div>

        <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-accent mb-3">
          Invited by the dojo
        </p>
        <h2 id="onboarding-headline" className="text-primary text-2xl font-semibold leading-tight tracking-tight mb-3">
          Welcome to the dojo.
        </h2>
        <p className="text-secondary text-[14px] leading-relaxed mb-6">
          You&apos;ve been invited to a daily practice. There&apos;s no tour. There&apos;s no
          tutorial. You&apos;ll start with one kata. The sensei will evaluate it. Then
          you&apos;ll know if this is for you or not.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {STAGES.map((stage) => (
            <div
              key={stage.n}
              className="border border-border bg-page rounded-sm px-2.5 py-2 flex flex-col gap-0.5"
            >
              <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted">
                {stage.n}
              </span>
              <span className="text-primary text-[12px] leading-tight">{stage.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between sm:items-center">
          <Button variant="ghost" size="md" onClick={onDismiss}>
            Skip — I get it
          </Button>
          <Button variant="primary" size="md" onClick={handleStart}>
            Show me the first kata →
          </Button>
        </div>

        <p className="text-muted text-[10px] font-mono tracking-[0.08em] uppercase mt-4 text-center">
          This message appears once. It won&apos;t be back tomorrow.
        </p>
      </div>
    </div>
  )
}
