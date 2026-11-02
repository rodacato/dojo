import { useState } from 'react'
import { Link } from 'react-router-dom'
import { admin } from '../../lib/api/admin'
import { useAsync } from '../../hooks/useAsync'
import { Button } from '../../components/ui/Button'
import { CLARITY, EVALUATION, TIMING } from '../../components/ui/FeedbackSection'
import { AdminBreadcrumb } from './_form-parts'

const WINDOWS = [7, 30, 90] as const

type Item = Awaited<ReturnType<typeof admin.getRecentFeedback>>['items'][number]

const label = (options: ReadonlyArray<{ value: string; label: string }>, value: string | null) =>
  options.find((option) => option.value === value)?.label

/** The monthly read: every rating in a window, newest first, notes in full. */
export function AdminFeedbackPage() {
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30)
  const [notesOnly, setNotesOnly] = useState(false)
  const { data, loading, error, reload } = useAsync(() => admin.getRecentFeedback(days), [days])
  const items = (data?.items ?? []).filter((item) => !notesOnly || item.note)

  return (
    <div>
      <AdminBreadcrumb trail={['ADMIN', 'FEEDBACK']} />
      <h1 className="text-2xl font-bold tracking-tight text-primary leading-tight">Kata feedback</h1>
      <p className="paper-note mt-2">Every rating in the window, newest first.</p>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div role="group" aria-label="Window" className="flex gap-2">
          {WINDOWS.map((window) => (
            <button
              key={window}
              type="button"
              aria-pressed={days === window}
              onClick={() => setDays(window)}
              className={`min-h-11 px-3 rounded-sm border font-mono text-xs uppercase tracking-wider ${
                days === window ? 'border-primary text-primary bg-elevated' : 'border-border text-secondary hover:border-secondary'
              }`}
            >
              {window} days
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 min-h-11 text-secondary text-sm cursor-pointer">
          <input type="checkbox" checked={notesOnly} onChange={(e) => setNotesOnly(e.target.checked)} className="size-4.5 accent-primary" />
          With notes only
        </label>
      </div>

      {loading && <p role="status" className="paper-note mt-8">Loading feedback…</p>}
      {Boolean(error) && (
        <div role="alert" className="mt-8 flex flex-wrap items-center gap-4">
          <p className="text-danger-text text-sm">Couldn't load feedback.</p>
          <Button variant="ghost" size="lg" onClick={reload}>Try again</Button>
        </div>
      )}
      {data && (
        <>
          <p className="paper-note tabular-nums mt-8">
            {items.length} {items.length === 1 ? 'rating' : 'ratings'}
          </p>
          {items.length === 0 ? (
            <p className="paper-body mt-4">No feedback in the last {days} days.</p>
          ) : (
            <ul className="mt-2">
              {items.map((item) => <FeedbackRow key={item.sessionId} item={item} />)}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

function FeedbackRow({ item }: Readonly<{ item: Item }>) {
  const votes = [
    label(TIMING, item.timing) && `Time: ${label(TIMING, item.timing)}`,
    label(EVALUATION, item.evaluation) && `Review: ${label(EVALUATION, item.evaluation)}`,
    label(CLARITY, item.clarity) && `Description: ${label(CLARITY, item.clarity)}`,
  ].filter(Boolean)
  return (
    <li className="border-t border-border py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Link to={`/admin/katas/${item.kataId}/edit`} className="text-primary font-medium hover:underline">
          {item.kataTitle}
        </Link>
        <span className="paper-note tabular-nums">
          {item.kataType} · @{item.username} · {item.submittedAt.slice(0, 10)}
        </span>
      </div>
      {votes.length > 0 && <p className="paper-note mt-1">{votes.join(' · ')}</p>}
      {item.note && <p className="paper-body mt-2 whitespace-pre-wrap wrap-anywhere">{item.note}</p>}
    </li>
  )
}
