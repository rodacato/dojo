import type { ReactNode } from 'react'
import { Button } from '../ui/Button'
import { VerdictLabel } from './RecentSessionRow'
import { isVerdict } from '../../lib/verdict'
import type { DashboardData } from '../../lib/api'

interface TodayCardProps {
  todayComplete: boolean
  todaySession: DashboardData['todaySession']
  activeSessionId: string | null
  dailyKataMinutes: number | null
  isFirstVisit: boolean
  starting: boolean
  startDisabled: boolean
  startError: string | null
  onStart: () => void
  onResume: (id: string) => void
  onViewResults: (id: string) => void
}

/** The dashboard's lead section. Three states: active session, today complete, waiting. */
export function TodayCard({
  todayComplete,
  todaySession,
  activeSessionId,
  dailyKataMinutes,
  isFirstVisit,
  starting,
  startDisabled,
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
      >
        <Button size="xl" onClick={() => onResume(activeSessionId)}>
          Resume kata →
        </Button>
      </HeroLayout>
    )
  }

  if (todayComplete && todaySession) {
    const { verdict } = todaySession
    return (
      <HeroLayout
        eyebrow="Done today"
        headline={todaySession.kataTitle}
        verdict={isVerdict(verdict) ? <VerdictLabel verdict={verdict} className="block mb-3" /> : null}
        body="The dojo received your work. The verdict is on the page."
        error={startError}
      >
        <Button size="xl" onClick={() => onViewResults(todaySession.id)}>
          View results →
        </Button>
        {dailyKataMinutes !== null && (
          <Button variant="link" size="xl" loading={starting} disabled={startDisabled} onClick={onStart}>
            One more kata
          </Button>
        )}
      </HeroLayout>
    )
  }

  const blind = dailyKataMinutes !== null
  let body = 'Your streak resets at midnight. The dojo opens again whether you show up or not.'
  if (blind) body = 'One kata, about five minutes. You see the topic when it opens.'
  else if (isFirstVisit) body = 'Set the constraints. Get one kata. Work.'

  let headline = 'The dojo was empty today.'
  if (isFirstVisit) headline = 'First kata. The hardest one is always the first.'
  else if (blind) headline = "Today's kata is waiting."

  return (
    <HeroLayout
      eyebrow={blind ? `Today · ~${dailyKataMinutes} min` : 'Today'}
      headline={headline}
      body={body}
      error={startError}
    >
      <Button size="xl" loading={starting} disabled={startDisabled} onClick={onStart}>
        Enter the dojo →
      </Button>
    </HeroLayout>
  )
}

function HeroLayout({
  eyebrow,
  headline,
  verdict = null,
  body,
  error = null,
  children,
}: Readonly<{
  eyebrow: string
  headline: string
  verdict?: ReactNode
  body: string
  error?: string | null
  children: ReactNode
}>) {
  return (
    <section
      aria-labelledby="today-heading"
      className="md:grid md:grid-cols-[minmax(0,1fr)_auto] items-center gap-6 lg:gap-10 pt-7 pb-7.5 md:pt-7.5 md:pb-8.5"
    >
      <div>
        <p className="paper-eyebrow">{eyebrow}</p>
        <h1 id="today-heading" className="paper-heading max-w-162.5 mt-3 mb-4 wrap-anywhere">
          {headline}
        </h1>
        {verdict}
        <p className="paper-body max-w-130">{body}</p>
        {error && (
          <p role="alert" className="mt-4 max-w-[48ch] text-sm text-danger-text">
            <span
              aria-hidden
              className="inline-flex items-center justify-center size-4.5 mr-2 border border-current rounded-sm font-mono text-xs"
            >
              !
            </span>
            {error}
          </p>
        )}
      </div>
      <div className="mt-6 md:mt-0 md:min-w-45 lg:min-w-50 flex flex-col gap-1">{children}</div>
    </section>
  )
}
