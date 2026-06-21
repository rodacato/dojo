import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { ScrollDetailDTO, LessonDTO } from '@dojo/shared'
import { api } from '../lib/api'
import { PublicPageLayout } from '../components/PublicPageLayout'
import { PageLoader } from '../components/PageLoader'
import { ErrorState } from '../components/ui/ErrorState'
import { useAuth } from '../context/AuthContext'
import { buttonClasses } from '../components/ui/Button'
import { getAnonymousId } from '../lib/anonymousId'

type LessonState = 'not-started' | 'in-progress' | 'completed'

const LESSON_STATE: Record<LessonState, { label: string; glyph: string; cls: string }> = {
  'not-started': { label: 'Not started', glyph: '◇', cls: 'text-muted' },
  'in-progress': { label: 'In progress', glyph: '◐', cls: 'text-accent' },
  completed: { label: 'Done', glyph: '✓', cls: 'text-success' },
}

function lessonState(lesson: LessonDTO, completed: Set<string>): LessonState {
  const done = lesson.steps.filter((s) => completed.has(s.id)).length
  if (done === 0) return 'not-started'
  if (done >= lesson.steps.length) return 'completed'
  return 'in-progress'
}

export function ScrollLandingPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const [scroll, setScroll] = useState<ScrollDetailDTO | null>(null)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setError(null)
    api
      .getScroll(slug)
      .then(async (s) => {
        if (cancelled) return
        setScroll(s)
        // A fresh anon (not logged in, no stored session) has no progress and
        // the single-scroll endpoint 401s without a session id — skip the call.
        const anon = user ? undefined : (getAnonymousId() ?? undefined)
        if (!user && !anon) return
        const progress = await api.getProgress(s.id, anon).catch(() => ({ completedSteps: [] }))
        if (!cancelled) setCompleted(new Set(progress.completedSteps))
      })
      .catch(() => {
        if (!cancelled) setError("We couldn't load this scroll.")
      })
    return () => {
      cancelled = true
    }
  }, [slug, user, retry])

  if (error) {
    return (
      <ErrorState
        message={error}
        primaryAction={{ label: 'Try again', onClick: () => setRetry((n) => n + 1) }}
        secondaryAction={{ label: 'Back to scrolls', to: '/scrolls' }}
      />
    )
  }

  if (!scroll) return <PageLoader />

  const allSteps = scroll.lessons.flatMap((l) => l.steps)
  const completedCount = allSteps.filter((s) => completed.has(s.id)).length
  const firstIncomplete = allSteps.find((s) => !completed.has(s.id))
  const target = firstIncomplete ?? allSteps[0]
  const targetLesson = target
    ? scroll.lessons.find((l) => l.steps.some((s) => s.id === target.id))
    : undefined
  const inProgressVerb = firstIncomplete ? 'Continue' : 'Review'
  const ctaVerb = completedCount === 0 ? 'Start' : inProgressVerb
  const toGo = allSteps.length - completedCount

  return (
    <PublicPageLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <Link
          to="/scrolls"
          className="font-mono text-xs tracking-[0.08em] uppercase text-muted hover:text-primary transition-colors"
        >
          ← All scrolls
        </Link>

        <div className="mt-6 flex flex-col lg:flex-row lg:gap-12">
          {/* Main column */}
          <div className="lg:flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="font-mono text-xs tracking-[0.08em] uppercase border px-2 py-1 rounded-sm"
                style={{
                  color: scroll.accentColor,
                  borderColor: `${scroll.accentColor}66`,
                  backgroundColor: `${scroll.accentColor}1a`,
                }}
              >
                {scroll.language}
              </span>
            </div>

            <h1 className="text-primary text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
              {scroll.title}
            </h1>
            <p className="font-mono text-xs tracking-[0.04em] text-muted mt-3">
              {scroll.estimatedMinutes != null && `~${scroll.estimatedMinutes} min · `}
              for developers who already program
            </p>
            <p className="text-secondary text-base md:text-lg leading-relaxed mt-4 max-w-2xl">
              {scroll.description}
            </p>

            {target && (
              <Link
                to={`/scrolls/${scroll.slug}/${target.id}`}
                className={`${buttonClasses({ variant: 'primary', size: 'lg' })} mt-6`}
              >
                {ctaVerb}
                {targetLesson ? ` · ${targetLesson.title}` : ''} →
              </Link>
            )}

            {/* Lesson list — free jump-to, not a gate */}
            <ol className="mt-10 flex flex-col gap-px bg-border border border-border rounded-md overflow-hidden">
              {scroll.lessons.map((lesson, i) => {
                const state = lessonState(lesson, completed)
                const sm = LESSON_STATE[state]
                const firstStep = lesson.steps[0]
                return (
                  <li key={lesson.id}>
                    <Link
                      to={firstStep ? `/scrolls/${scroll.slug}/${firstStep.id}` : `/scrolls/${scroll.slug}`}
                      className="group bg-surface hover:bg-elevated transition-colors flex items-center gap-4 px-4 py-4"
                    >
                      <span className="font-mono text-xs text-muted w-6 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="text-primary text-base font-medium group-hover:text-accent transition-colors block truncate">
                          {lesson.title}
                        </span>
                        {lesson.outcome && (
                          <span className="text-secondary text-sm mt-0.5 block">
                            {lesson.outcome}
                          </span>
                        )}
                        <span className="font-mono text-xs tracking-[0.04em] text-muted">
                          {lesson.steps.length} steps
                        </span>
                      </span>
                      <span className={`font-mono text-xs tracking-[0.06em] uppercase shrink-0 ${sm.cls}`}>
                        <span aria-hidden>{sm.glyph}</span> {sm.label}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </div>

          {/* Progress rail */}
          <aside className="lg:w-64 shrink-0 mt-8 lg:mt-0">
            <div className="bg-surface border border-border rounded-md p-5 lg:sticky lg:top-8">
              <p className="font-mono text-xs tracking-[0.08em] uppercase text-muted">Your progress</p>
              <p className="font-mono text-4xl text-primary mt-3 leading-none">
                {completedCount}
                <span className="text-muted text-2xl"> / {allSteps.length}</span>
              </p>
              <p className="font-mono text-xs tracking-[0.04em] text-muted mt-2">steps</p>
              <div className="h-1 bg-border rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-accent transition-[width]"
                  style={{ width: allSteps.length ? `${(completedCount / allSteps.length) * 100}%` : '0%' }}
                />
              </div>
              <p className="text-secondary text-sm mt-3">
                {toGo === 0 ? 'Complete.' : `${toGo} to go.`}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PublicPageLayout>
  )
}
