import { Button } from '../ui/Button'
import type { DashboardData } from '../../lib/api'

interface TodayCardProps {
  todayComplete: boolean
  todaySession: DashboardData['todaySession']
  activeSessionId: string | null
  isFirstVisit: boolean
  onStart: () => void
  onResume: (id: string) => void
  onViewResults: (id: string) => void
}

/**
 * Hero band on Dashboard — 2-col layout: status copy left, CTA right.
 * Three states: active session in progress / today complete / empty.
 */
export function TodayCard({
  todayComplete,
  todaySession,
  activeSessionId,
  isFirstVisit,
  onStart,
  onResume,
  onViewResults,
}: TodayCardProps) {
  if (activeSessionId) {
    return (
      <HeroLayout
        eyebrow="In progress"
        headline="You have an active kata."
        body="Pick up where you left off. The timer remembers."
        cta={
          <Button variant="primary" size="lg" onClick={() => onResume(activeSessionId)}>
            Resume kata →
          </Button>
        }
      />
    )
  }

  if (todayComplete && todaySession) {
    return (
      <HeroLayout
        eyebrow="Done today"
        headline={todaySession.exerciseTitle}
        body="The dojo received your work. The verdict is on the page."
        cta={
          <Button variant="ghost" size="lg" onClick={() => onViewResults(todaySession.id)}>
            View results →
          </Button>
        }
      />
    )
  }

  return (
    <HeroLayout
      eyebrow="Today"
      headline={isFirstVisit ? 'First kata. The hardest one is always the first.' : 'The dojo was empty today.'}
      body={isFirstVisit ? 'Pick mood. Pick time. Get 3 kata. Choose one. Work.' : 'Your streak resets at midnight. The dojo opens again whether you show up or not.'}
      cta={
        <Button variant="primary" size="lg" onClick={onStart}>
          Enter the dojo →
        </Button>
      }
    />
  )
}

function HeroLayout({
  eyebrow,
  headline,
  body,
  cta,
}: {
  eyebrow: string
  headline: string
  body: string
  cta: React.ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
      <div className="flex-1 min-w-0">
        <p className="text-muted text-xs font-mono uppercase tracking-wider mb-2">{eyebrow}</p>
        <h2 className="font-mono text-2xl md:text-3xl text-primary leading-tight mb-3">
          {headline}
        </h2>
        <p className="text-secondary text-sm leading-relaxed max-w-md">{body}</p>
      </div>
      <div className="shrink-0">{cta}</div>
    </div>
  )
}
