import { Button } from '../ui/Button'
import type { DashboardData } from '../../lib/api'

interface TodayCardProps {
  todayComplete: boolean
  todaySession: DashboardData['todaySession']
  activeSessionId: string | null
  dailyKataMinutes: number | null
  isFirstVisit: boolean
  starting: boolean
  startError: string | null
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
  dailyKataMinutes,
  isFirstVisit,
  starting,
  startError,
  onStart,
  onResume,
  onViewResults,
}: Readonly<TodayCardProps>) {
  if (activeSessionId) {
    return (
      <HeroLayout
        eyebrow="In progress"
        headline="You have an active kata."
        body="Pick up where you left off. The timer remembers."
        cta={
          <Button variant="primary" size="lg" className="max-md:w-full" onClick={() => onResume(activeSessionId)}>
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
        headline={todaySession.kataTitle}
        body="The dojo received your work. The verdict is on the page."
        error={startError}
        cta={
          <div className="flex flex-col md:flex-row gap-3">
            <Button variant="ghost" size="lg" className="max-md:w-full" onClick={() => onViewResults(todaySession.id)}>
              View results →
            </Button>
            {dailyKataMinutes !== null && (
              <Button variant="subtle" size="lg" className="max-md:w-full" loading={starting} onClick={onStart}>
                One more kata
              </Button>
            )}
          </div>
        }
      />
    )
  }

  const blind = dailyKataMinutes !== null
  let body = 'Your streak resets at midnight. The dojo opens again whether you show up or not.'
  if (isFirstVisit) {
    body = blind
      ? 'One kata, about five minutes. You see the topic when it opens.'
      : 'Pick mood. Pick time. Get 3 kata. Choose one. Work.'
  }
  let headline = 'The dojo was empty today.'
  if (isFirstVisit) headline = 'First kata. The hardest one is always the first.'
  else if (blind) headline = "Today's kata is waiting."

  return (
    <HeroLayout
      eyebrow={blind ? `Today · ~${dailyKataMinutes} min` : 'Today'}
      headline={headline}
      body={body}
      error={startError}
      cta={
        <Button variant="primary" size="lg" className="max-md:w-full" loading={starting} onClick={onStart}>
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
  error = null,
}: Readonly<{
  eyebrow: string
  headline: string
  body: string
  cta: React.ReactNode
  error?: string | null
}>) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
      <div className="flex-1 min-w-0">
        <p className="text-secondary text-xs font-mono uppercase tracking-wider mb-2">{eyebrow}</p>
        <h2 className="font-mono text-2xl md:text-3xl text-primary leading-tight mb-3">
          {headline}
        </h2>
        <p className="text-secondary text-sm leading-relaxed max-w-md">{body}</p>
        {error && (
          <p role="alert" className="text-danger-text text-sm font-mono mt-3">
            {error}
          </p>
        )}
      </div>
      <div className="shrink-0">{cta}</div>
    </div>
  )
}
