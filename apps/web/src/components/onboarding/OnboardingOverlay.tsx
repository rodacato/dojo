import { Button } from '../ui/Button'

interface OnboardingOverlayProps {
  daily: boolean
  startDisabled: boolean
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

/** First-visit welcome, in the page and in place of today's section. Only Skip, × or the start action end it. */
export function OnboardingOverlay({ daily, startDisabled, onStart, onDismiss }: Readonly<OnboardingOverlayProps>) {
  const stages = daily ? DAILY_STAGES : ADVANCED_STAGES

  function handleStart() {
    onDismiss()
    onStart()
  }

  return (
    <section aria-labelledby="onboarding-headline" className="mt-6.5 md:mt-7 pb-6 md:pb-7.5">
      <div className="flex items-start justify-between gap-3 md:gap-6">
        <div>
          <p className="paper-eyebrow">Invited by the dojo</p>
          <h1
            id="onboarding-headline"
            className="my-3 font-sans font-bold text-2xl md:text-[2.25rem] leading-[1.1] tracking-tight text-primary"
          >
            Welcome to the dojo.
          </h1>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss welcome"
          className="size-11 shrink-0 inline-flex items-center justify-center border border-border rounded-sm text-xl text-primary hover:border-primary transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ×
        </button>
      </div>
      <p className="paper-body max-w-165">
        You&apos;ve been invited to a daily practice. There&apos;s no tour. There&apos;s no tutorial. You&apos;ll
        start with one kata. The sensei will evaluate it. Then you&apos;ll know if this is for you or not.
      </p>

      <ol className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-4 md:gap-6 py-4.5 my-5 border-y border-border">
        {stages.map((stage) => (
          <li key={stage.n} className="flex items-baseline gap-2 md:gap-2.5 text-sm text-primary">
            <span className="paper-note tabular-nums">{stage.n}</span>
            {stage.label}
          </li>
        ))}
      </ol>

      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-5">
        <Button size="xl" disabled={startDisabled} onClick={handleStart}>
          Show me the first kata →
        </Button>
        <Button variant="link" size="xl" onClick={onDismiss}>
          Skip — I get it
        </Button>
      </div>

      <p className="paper-note mt-4">This message appears once. It won&apos;t be back tomorrow.</p>
    </section>
  )
}
