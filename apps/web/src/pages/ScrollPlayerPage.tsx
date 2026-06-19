import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import type { ScrollDetailDTO } from '@dojo/shared'
import { api } from '../lib/api'
import { PageLoader } from '../components/PageLoader'
import { ErrorState } from '../components/ui/ErrorState'
import { useAuth } from '../context/AuthContext'
import { useScrollProgress } from '../scrolls/player/useScrollProgress'
import { useStepNavigation } from '../scrolls/player/useStepNavigation'
import { LessonNav } from '../scrolls/player/LessonNav'
import { FurtherReading } from '../scrolls/player/FurtherReading'
import { ScrollCompleteBanner } from '../scrolls/player/ScrollCompleteBanner'
import { StepContent } from '../scrolls/player/steps/StepContent'

export function ScrollPlayerPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()

  const [scroll, setScroll] = useState<ScrollDetailDTO | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryTick, setRetryTick] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.matchMedia('(min-width: 768px)').matches,
  )
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    api.getScroll(slug)
      .then((c) => {
        if (cancelled) return
        setScroll(c)
      })
      .catch(() => { if (!cancelled) setError('We couldn\'t load this scroll.') })
    return () => { cancelled = true }
  }, [slug, retryTick])

  const navigate = useNavigate()
  const { completedSteps, markStepComplete } = useScrollProgress(scroll, !!user)
  const { activeStepId, navigateToStep, advanceToNextStep } = useStepNavigation(scroll)

  // The route always carries a :stepId; a bad/stale one falls back to the landing.
  useEffect(() => {
    if (scroll && activeStepId === null && slug) {
      navigate(`/scrolls/${slug}`, { replace: true })
    }
  }, [scroll, activeStepId, slug, navigate])

  // On narrow viewports the sidebar overlays most of the screen — picking a
  // step is the signal the learner is done navigating.
  const selectStepFromSidebar = useCallback((stepId: string) => {
    navigateToStep(stepId)
    if (!window.matchMedia('(min-width: 768px)').matches) {
      setSidebarOpen(false)
    }
  }, [navigateToStep])

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [activeStepId])

  if (error) {
    return (
      <ErrorState
        message={error}
        primaryAction={{ label: 'Try again', onClick: () => setRetryTick((n) => n + 1) }}
        secondaryAction={{ label: 'Back to scrolls', to: '/scrolls' }}
      />
    )
  }

  if (!scroll) return <PageLoader />

  const allSteps = scroll.lessons.flatMap((l) => l.steps)
  const activeStep = allSteps.find((s) => s.id === activeStepId)
  const scrollComplete = allSteps.length > 0 && completedSteps.length >= allSteps.length
  const completedCount = completedSteps.length

  return (
    <div className="h-[100dvh] bg-page flex flex-col overflow-hidden">
      {/* Top bar — 56px, mono caps progress */}
      <header className="h-14 shrink-0 border-b border-border bg-surface/90 backdrop-blur-md flex items-center px-4 md:px-6 gap-3">
        <Link
          to={`/scrolls/${slug}`}
          className="font-mono text-xs tracking-[0.08em] uppercase text-muted hover:text-primary transition-colors"
        >
          ← Overview
        </Link>
        <span className="h-4 w-px bg-border hidden sm:block" />
        <span className="text-primary text-sm font-medium truncate hidden sm:inline">
          {scroll.title}
        </span>
        <span
          className={`ml-auto font-mono text-xs tracking-[0.08em] uppercase ${
            scrollComplete ? 'text-success' : 'text-muted'
          }`}
        >
          {completedCount} / {allSteps.length} steps
        </span>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
          aria-expanded={sidebarOpen}
          className="font-mono text-xs tracking-[0.08em] uppercase text-muted hover:text-primary transition-colors"
        >
          {sidebarOpen ? 'Hide nav' : 'Show nav'}
        </button>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside
          inert={!sidebarOpen}
          aria-hidden={!sidebarOpen}
          className={`bg-surface border-r border-border transition-[width] duration-200 flex flex-col shrink-0 overflow-hidden ${
            sidebarOpen ? 'w-70' : 'w-0'
          }`}
        >
          <div className="px-4 pt-5 pb-3">
            <p className="font-mono text-xs tracking-[0.08em] uppercase text-muted">
              Lessons · {scroll.lessons.length}
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto pb-4">
            {scroll.lessons.map((lesson, i) => (
              <LessonNav
                key={lesson.id}
                lesson={lesson}
                index={i + 1}
                activeStepId={activeStepId}
                completedSteps={completedSteps}
                onSelectStep={selectStepFromSidebar}
              />
            ))}
            <FurtherReading refs={scroll.externalReferences} />
          </nav>
        </aside>

        {/* Main content */}
        <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto">
          {scrollComplete && user && (
            <ScrollCompleteBanner
              scrollTitle={scroll.title}
              scrollSlug={scroll.slug}
              userId={user.id}
              lessonCount={scroll.lessons.length}
              stepCount={allSteps.length}
            />
          )}

          {activeStep ? (
            <div key={activeStep.id} className="animate-step-fade-in h-full">
              <StepContent
                step={activeStep}
                scrollSlug={scroll.slug}
                language={scroll.language}
                isCompleted={completedSteps.includes(activeStep.id)}
                onMarkComplete={() => markStepComplete(activeStep.id)}
                onAdvance={advanceToNextStep}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted font-mono">Select a step to begin</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
