import { LoadState } from '../ui/LoadState'
import { Skeleton } from '../ui/SkeletonLoader'

const UNAVAILABLE = ['Current streak', 'Practice patterns', 'Recent kata'] as const

type DashboardLoadStateProps = { status: 'loading' } | { status: 'error'; onRetry: () => void }

/** The dashboard's own wait and failure: its shape stays put, and no section pretends to be zero. */
export function DashboardLoadState(props: Readonly<DashboardLoadStateProps>) {
  if (props.status === 'loading') {
    return (
      <div className="pt-7 md:pt-7.5">
        <LoadState status="loading" eyebrow="Dashboard / loading" title="Opening the dojo">
          <Placeholders />
        </LoadState>
      </div>
    )
  }

  return (
    <div className="md:grid md:grid-cols-[minmax(0,1fr)_15rem] md:gap-8 lg:gap-14 items-start pt-7.5 pb-9 border-b border-border">
      <LoadState
        status="error"
        pageTitle
        eyebrow="Dashboard / error"
        title="Something broke."
        aside="The dojo is still here."
        body="We couldn't load your dashboard."
        onRetry={props.onRetry}
      />
      <aside aria-label="Unavailable dashboard data" className="mt-8 md:mt-5 border-y border-border py-4.5">
        <p className="paper-eyebrow">Dashboard</p>
        <dl className="my-3">
          {UNAVAILABLE.map((label) => (
            <div key={label} className="flex items-center justify-between gap-4 min-h-11 border-b border-border last:border-b-0">
              <dt className="text-sm text-secondary">{label}</dt>
              <dd className="font-mono text-secondary">
                <span aria-hidden>—</span>
                <span className="sr-only">Not loaded</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="paper-note" aria-hidden>Not loaded</p>
      </aside>
    </div>
  )
}

function Placeholders() {
  return (
    <div aria-hidden>
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_auto] items-center gap-6 lg:gap-10 pb-7.5 md:pb-8.5">
        <div>
          <Skeleton className="h-3 w-4/5 max-w-130" />
        </div>
        <Skeleton className="h-12 w-full md:w-45 lg:w-50 mt-6 md:mt-0" />
      </div>

      <div className="grid md:grid-cols-2 gap-7 md:gap-8 lg:gap-14 border-t border-border py-6 md:py-6.5">
        <div>
          <p className="paper-eyebrow">Current streak</p>
          <Skeleton className="size-12 mt-3.5" />
          <div className="grid grid-cols-7 gap-2 mt-4.5">
            {Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-2" />)}
          </div>
        </div>
        <div className="max-md:border-t max-md:border-border max-md:pt-6">
          <p className="paper-eyebrow mb-2.5">Practice patterns</p>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-8 min-h-10 md:min-h-9.25 border-b border-border last:border-b-0">
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-4 w-7 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] lg:grid-cols-[1.15fr_2.5fr_auto] items-center gap-5 lg:gap-6 py-5.5 md:py-6 border-y border-border">
        <Skeleton className="h-6 w-3/5 lg:w-3/4" />
        <div className="max-lg:row-start-2 max-lg:col-span-2 grid grid-cols-2 min-[360px]:grid-cols-4 gap-2.5 lg:gap-4.5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col justify-between h-12">
              <Skeleton className="h-2.5 w-12" />
              <Skeleton className="h-6 w-7" />
            </div>
          ))}
        </div>
        <Skeleton className="h-3 w-11" />
      </div>

      <div className="mt-5.5 md:mt-6.5">
        <p className="paper-eyebrow min-h-11 flex items-center">Recent kata</p>
        <div className="border-t border-border">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-8 min-h-14.5 border-b border-border">
              <Skeleton className={`h-3 ${i === 1 ? 'w-2/5' : 'w-1/2'}`} />
              <Skeleton className="h-2.5 w-14 md:w-21.5 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
