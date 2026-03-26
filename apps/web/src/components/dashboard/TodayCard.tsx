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
      <div className="z-10">
        <h3 className="font-mono text-xl text-primary lowercase mb-1">today's kata</h3>
        <p className="text-sm text-secondary mb-6">You have an active kata in progress.</p>
        <button
          onClick={() => onResume(activeSessionId)}
          className="px-6 py-2.5 bg-accent text-primary text-xs font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 hover:bg-accent/90 active:scale-[0.98] transition-all"
        >
          Resume kata <span className="text-sm">→</span>
        </button>
      </div>
    )
  }

  if (todayComplete && todaySession) {
    return (
      <div className="z-10">
        <h3 className="font-mono text-xl text-primary lowercase mb-1">today's kata</h3>
        <p className="text-sm text-secondary mb-1">
          Complete — {todaySession.exerciseTitle}
        </p>
        <button
          onClick={() => onViewResults(todaySession.id)}
          className="mt-4 px-6 py-2.5 border border-border text-secondary text-xs font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 hover:border-accent hover:text-primary transition-all"
        >
          View results <span className="text-sm">→</span>
        </button>
      </div>
    )
  }

  return (
    <div className="z-10">
      <h3 className="font-mono text-xl text-primary lowercase mb-1">today's kata</h3>
      <p className="text-sm text-muted mb-6">
        {isFirstVisit ? 'Day 1. The dojo opens.' : 'The dojo was empty today.'}
      </p>
      <button
        onClick={onStart}
        className="px-6 py-2.5 bg-accent text-primary text-xs font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 hover:bg-accent/90 active:scale-[0.98] transition-all"
      >
        Enter the dojo <span className="text-sm">→</span>
      </button>
    </div>
  )
}
