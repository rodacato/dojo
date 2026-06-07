import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { runInIframe } from '../lib/iframeSandboxRunner'
import {
  clearAnonymousId,
  getAnonymousId,
  getOrCreateAnonymousId,
} from '../lib/anonymousId'
import { PageLoader } from '../components/PageLoader'
import { CodeEditor, type CodeEditorLanguage } from '../components/ui/CodeEditor'
import { ErrorState } from '../components/ui/ErrorState'
import type { ScrollDetailDTO, LessonDTO, StepDTO, ExecuteStepResponse, ExternalReference, ExternalReferenceKind } from '@dojo/shared'
import { isPlaygroundData } from '@dojo/shared'
import { useAuth } from '../context/AuthContext'
import { renderSlots, type SlotHeading } from '../lib/slots'
import { FigureRenderer, splitOnFigureDirectives } from '../scrolls/figures/FigureRenderer'

// ── Main component ──────────────────────────────────────────────

export function ScrollPlayerPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()

  const [scroll, setScroll] = useState<ScrollDetailDTO | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryTick, setRetryTick] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [activeStepId, setActiveStepId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Load scroll
  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setError(null)
    api.getScroll(slug)
      .then((c) => {
        if (cancelled) return
        setScroll(c)
        const firstLesson = c.lessons[0]
        const firstStep = firstLesson?.steps[0]
        if (firstStep) {
          setActiveStepId(firstStep.id)
        }
      })
      .catch(() => { if (!cancelled) setError('We couldn\'t load this scroll.') })
    return () => { cancelled = true }
  }, [slug, retryTick])

  // When the user logs in and there's leftover anonymous progress, merge it.
  useEffect(() => {
    if (!user) return
    const anonId = getAnonymousId()
    if (!anonId) return
    api.mergeAnonymousProgress(anonId)
      .catch(() => {})
      .finally(() => clearAnonymousId())
  }, [user])

  // Load progress from server — source of truth for both authenticated and
  // anonymous owners. We only create an anonymous id when we actually need
  // to track progress on a public scroll without auth.
  useEffect(() => {
    if (!scroll) return
    if (user) {
      api.getProgress(scroll.id)
        .then((r) => setCompletedSteps(r.completedSteps))
        .catch(() => setCompletedSteps([]))
    } else if (scroll.isPublic) {
      const anonId = getOrCreateAnonymousId()
      api.getProgress(scroll.id, anonId)
        .then((r) => setCompletedSteps(r.completedSteps))
        .catch(() => setCompletedSteps([]))
    } else {
      setCompletedSteps([])
    }
  }, [scroll, user])

  const markStepComplete = useCallback((stepId: string) => {
    if (!scroll) return
    setCompletedSteps((prev) => {
      if (prev.includes(stepId)) return prev
      return [...prev, stepId]
    })
    const anonId = !user && scroll.isPublic ? getAnonymousId() : undefined
    api.trackProgress(scroll.id, stepId, anonId ?? undefined).catch(() => {})
  }, [scroll, user])

  const advanceToNextStep = useCallback(() => {
    if (!scroll || !activeStepId) return
    const allSteps = scroll.lessons.flatMap((l) => l.steps)
    const currentIdx = allSteps.findIndex((s) => s.id === activeStepId)
    const nextStep = allSteps[currentIdx + 1]
    if (nextStep) {
      setActiveStepId(nextStep.id)
    }
  }, [scroll, activeStepId])

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
    <div className="h-screen bg-page flex flex-col overflow-hidden">
      {/* Top bar — 56px, mono caps progress */}
      <header className="h-14 shrink-0 border-b border-border bg-surface/90 backdrop-blur-md flex items-center px-4 md:px-6 gap-3">
        <Link
          to="/scrolls"
          className="font-mono text-xs tracking-[0.08em] uppercase text-muted hover:text-primary transition-colors"
        >
          ← Learn
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
          className="font-mono text-xs tracking-[0.08em] uppercase text-muted hover:text-primary transition-colors hidden md:inline"
        >
          {sidebarOpen ? 'Hide nav' : 'Show nav'}
        </button>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside
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
                onSelectStep={setActiveStepId}
              />
            ))}
            <FurtherReading refs={scroll.externalReferences} />
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
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

// ── LessonNav ───────────────────────────────────────────────────

function LessonNav({
  lesson,
  index,
  activeStepId,
  completedSteps,
  onSelectStep,
}: {
  lesson: LessonDTO
  index: number
  activeStepId: string | null
  completedSteps: string[]
  onSelectStep: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const lessonNumber = index.toString().padStart(2, '0')
  const lessonStepsDone = lesson.steps.filter((s) => completedSteps.includes(s.id)).length
  const allDone = lessonStepsDone === lesson.steps.length

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 h-8 flex items-center gap-2 hover:bg-elevated/50 transition-colors text-left"
        aria-expanded={expanded}
      >
        <span className="font-mono text-xs text-muted shrink-0">{expanded ? '▾' : '▸'}</span>
        <span className="font-mono text-sm text-primary truncate">
          <span className="text-muted">{lessonNumber} ·</span> {lesson.title}
        </span>
        <span
          className={`ml-auto font-mono text-xs tracking-[0.04em] shrink-0 ${
            allDone ? 'text-success' : 'text-muted'
          }`}
        >
          {lessonStepsDone}/{lesson.steps.length}
        </span>
      </button>
      {expanded && (
        <div>
          {lesson.steps.map((step) => {
            const isActive = step.id === activeStepId
            const isComplete = completedSteps.includes(step.id)
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelectStep(step.id)}
                className={`w-full pl-9 pr-4 h-7 flex items-center gap-2 transition-colors text-left text-xs ${
                  isActive
                    ? 'bg-accent/8 border-l-2 border-accent text-primary'
                    : 'border-l-2 border-transparent text-secondary hover:text-primary hover:bg-elevated/30'
                }`}
              >
                <StepStatusIcon complete={isComplete} active={isActive} />
                <span className="truncate flex-1" title={extractStepTitle(step)}>
                  {extractStepTitle(step)}
                </span>
                <span className="font-mono text-[9px] tracking-[0.08em] uppercase text-muted shrink-0">
                  {stepTypeLabel(step.type)}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StepStatusIcon({ complete, active }: { complete: boolean; active: boolean }) {
  if (complete) {
    return (
      <span className="font-mono text-xs text-success shrink-0" aria-hidden>
        ✓
      </span>
    )
  }
  if (active) {
    return (
      <span className="font-mono text-xs text-accent shrink-0" aria-hidden>
        ▸
      </span>
    )
  }
  return (
    <span className="font-mono text-xs text-muted shrink-0" aria-hidden>
      ○
    </span>
  )
}

function stepTypeLabel(type: StepDTO['type']): string {
  switch (type) {
    case 'read': return 'Read'
    case 'challenge': return 'Challenge'
    case 'exercise': return 'Exercise'
    case 'code': return 'Code'
    case 'predict': return 'Predict'
  }
}

// Prefer the explicit step.title field (Sprint 018 schema). Fall back to
// pulling the first H1 from the instruction body for legacy steps that
// haven't been backfilled, and finally the step ordinal.
function extractStepTitle(step: StepDTO): string {
  if (step.title && step.title.trim()) return step.title.trim()
  const match = step.instruction.match(/^#\s+(.+)$/m)
  if (match && match[1]) {
    return match[1].replace(/^(kata|challenge|read):\s*/i, '').trim()
  }
  if (step.type === 'read') return 'Read'
  return `Step ${step.order}`
}

// ── StepContent ─────────────────────────────────────────────────

function StepContent({
  step,
  scrollSlug,
  language,
  isCompleted,
  onMarkComplete,
  onAdvance,
}: {
  step: StepDTO
  scrollSlug: string
  language: string
  isCompleted: boolean
  onMarkComplete: () => void
  onAdvance: () => void
}) {
  // Read steps: the Continue button both marks-and-advances. There's nothing
  // to unlock on a read step (no solution tab), so the chained behaviour is
  // the right UX.
  const continueRead = () => {
    if (!isCompleted) onMarkComplete()
    onAdvance()
  }

  if (step.type === 'read') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <MarkdownContent content={step.instruction} />
        <div className="mt-8">
          <button
            onClick={continueRead}
            className="px-6 py-2.5 bg-accent text-bg font-mono text-sm rounded transition-all duration-150 hover:bg-accent/90 active:scale-95"
          >
            {isCompleted ? 'Next →' : 'Continue →'}
          </button>
        </div>
      </div>
    )
  }

  if (step.type === 'predict') {
    return (
      <PredictStep
        step={step}
        language={language}
        isCompleted={isCompleted}
        onMarkComplete={onMarkComplete}
        onAdvance={onAdvance}
      />
    )
  }

  return (
    <StepEditor
      step={step}
      scrollSlug={scrollSlug}
      language={language}
      isCompleted={isCompleted}
      onMarkComplete={onMarkComplete}
      onAdvance={onAdvance}
    />
  )
}

// ── PredictStep ─────────────────────────────────────────────────
//
// CSS-driven state machine for the `predict` step type per ADR 022 +
// docs/courses/INTERACTIVITY-PATTERNS.md §predict. Three states:
//   unanswered → revealed
// (the "reviewing" intermediate state from the doc applies to the Rive
// variant; CSS skips directly to revealed because no async transition is
// needed). On reveal, the per-option feedback is the load-bearing surface
// — the wrong-answer voice addresses the specific mental model the
// distractor encodes, not the right answer in the abstract.

function PredictStep({
  step,
  language,
  isCompleted,
  onMarkComplete,
  onAdvance,
}: {
  step: StepDTO
  language: string
  isCompleted: boolean
  onMarkComplete: () => void
  onAdvance: () => void
}) {
  // Predict: revealing the answer is what marks the step complete (so the
  // learner gets credit for engaging with the prediction even before they hit
  // Next). Continue advances. Splitting the two means the reveal stays on
  // screen at full opacity until the learner is ready to move on.
  const continuePredict = () => {
    if (!isCompleted) onMarkComplete()
    onAdvance()
  }
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const data = step.data as {
    snippet: string
    options: { id: string; text: string }[]
    correct: string
    feedback: Record<string, string>
  } | null

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <p className="text-sm font-mono text-danger">
          Predict step is missing required `data` payload.
        </p>
      </div>
    )
  }

  const revealed = selectedId !== null
  const isCorrect = revealed && selectedId === data.correct
  const stepTitle = step.title ?? `Step ${step.order}`
  const instructionBody = step.instruction
    .replace(new RegExp(`^# +${stepTitle}\\s*\\n+`), '')
    .trim()

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted mb-2">
          Predict
        </p>
        <h1 className="text-xl md:text-2xl font-mono text-primary leading-tight">
          {stepTitle}
        </h1>
      </div>

      {instructionBody && (
        <div className="text-secondary leading-relaxed">
          <MarkdownContent content={instructionBody} />
        </div>
      )}

      <pre className="bg-surface border border-border rounded p-4 overflow-x-auto">
        <code className={`font-mono text-sm text-primary language-${language}`}>
          {data.snippet}
        </code>
      </pre>

      <div role="radiogroup" aria-label="Predict the result" className="space-y-2">
        {data.options.map((opt, i) => {
          const letter = String.fromCharCode('A'.charCodeAt(0) + i)
          const isSelected = selectedId === opt.id
          const isThisCorrect = opt.id === data.correct
          let stateClass = 'border-border bg-surface hover:border-accent/60 hover:bg-elevated/40'
          let icon: string | null = null
          if (revealed) {
            if (isSelected && isThisCorrect) {
              stateClass = 'border-success bg-success/10 text-success'
              icon = '✓'
            } else if (isSelected && !isThisCorrect) {
              stateClass = 'border-danger bg-danger/10 text-danger'
              icon = '✗'
            } else if (!isSelected && isThisCorrect) {
              stateClass = 'border-success/60 bg-surface text-success'
              icon = '✓'
            } else {
              stateClass = 'border-border/40 bg-surface text-muted'
            }
          }
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={revealed}
              onClick={() => setSelectedId(opt.id)}
              className={`w-full text-left px-4 py-3 rounded border transition-all duration-200 font-mono text-sm flex items-start gap-3 ${stateClass} ${revealed ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'}`}
            >
              <span className="shrink-0 w-6 h-6 rounded border border-current/40 flex items-center justify-center text-xs">
                {revealed && icon ? icon : letter}
              </span>
              <span className="flex-1 leading-relaxed pt-0.5">{opt.text}</span>
            </button>
          )
        })}
      </div>

      {revealed && (
        <div
          key={selectedId}
          className={`animate-step-fade-in rounded border p-4 ${isCorrect ? 'border-success/40 bg-success/5' : 'border-danger/40 bg-danger/5'}`}
        >
          <p className={`font-mono text-xs uppercase tracking-[0.08em] mb-2 ${isCorrect ? 'text-success' : 'text-danger'}`}>
            {isCorrect ? 'Correct' : 'Not quite'}
          </p>
          <p className="text-secondary leading-relaxed whitespace-pre-wrap">
            {data.feedback[selectedId] ?? ''}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={continuePredict}
          disabled={!revealed}
          className="px-6 py-2.5 bg-accent text-bg font-mono text-sm rounded transition-all duration-150 hover:bg-accent/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isCompleted ? 'Next →' : 'Continue →'}
        </button>
        {!revealed && (
          <span className="text-xs font-mono text-muted">
            Pick an answer to reveal the explanation.
          </span>
        )}
      </div>
    </div>
  )
}

// ── StepEditor ──────────────────────────────────────────────────

type OutputTab = 'tests' | 'output' | 'solution'

function StepEditor({
  step,
  scrollSlug,
  language,
  isCompleted,
  onMarkComplete,
  onAdvance,
}: {
  step: StepDTO
  scrollSlug: string
  language: string
  isCompleted: boolean
  onMarkComplete: () => void
  onAdvance: () => void
}) {
  const [code, setCode] = useState(step.starterCode ?? '')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ExecuteStepResponse | null>(null)
  const [tab, setTab] = useState<OutputTab>('tests')
  const [showHint, setShowHint] = useState(false)
  // Reference solution — fetched lazily once the learner passes the step.
  // Server returns 403 until then, so there's no risk of leaking it early
  // even if a curious learner inspects the network panel.
  const [solutionCode, setSolutionCode] = useState<string | null>(null)
  const [alternativeApproach, setAlternativeApproach] = useState<string | null>(null)
  const [solutionError, setSolutionError] = useState<string | null>(null)
  // "Ask the sensei" nudge state (PRD 026). `nudgeDisabled` latches true when
  // the API 404s — that signals FF_COURSE_NUDGE_ENABLED=false on the server.
  const [nudge, setNudge] = useState<{ id: string; text: string } | null>(null)
  const [nudgeLoading, setNudgeLoading] = useState(false)
  const [nudgeError, setNudgeError] = useState<string | null>(null)
  const [nudgeDisabled, setNudgeDisabled] = useState(false)
  const [nudgeFeedback, setNudgeFeedback] = useState<'up' | 'down' | null>(null)

  const isIframeLang = language === 'javascript-dom'
  // Playground variant: a kata with `data.kind === "playground"`. The backend
  // runs the always-pass harness; the frontend hides verdict UI so the learner
  // experiences free exploration, not a graded exercise. See
  // docs/courses/curricula/ruby/ruby.md §2.3 for the local-experiment scope.
  const isPlayground = isPlaygroundData(step.data)
  const stepTitle = extractStepTitle(step)
  // The markdown still contains the H1; strip it so it isn't rendered twice.
  const instructionBody = stripLeadingH1(step.instruction)

  useEffect(() => {
    setCode(step.starterCode ?? '')
    setResult(null)
    setShowHint(false)
    setTab('tests')
    setSolutionCode(null)
    setAlternativeApproach(null)
    setSolutionError(null)
    setNudge(null)
    setNudgeError(null)
    setNudgeLoading(false)
    setNudgeFeedback(null)
  }, [step.id, step.starterCode])

  async function askSensei() {
    if (nudgeLoading || nudgeDisabled) return
    setNudgeLoading(true)
    setNudgeError(null)
    setNudgeFeedback(null)
    try {
      const response = await api.requestNudge({
        scrollSlug,
        stepId: step.id,
        userCode: code,
        stdout: result?.stdout,
        stderr: result?.stderr,
      })
      if ('disabled' in response) {
        setNudgeDisabled(true)
        return
      }
      setNudge({ id: response.id, text: response.nudge })
    } catch (err) {
      setNudgeError(err instanceof Error ? err.message : 'The sensei is unavailable right now.')
    } finally {
      setNudgeLoading(false)
    }
  }

  async function rateNudge(rating: 'up' | 'down') {
    if (!nudge || nudgeFeedback) return
    // Optimistic — we only use the signal for prompt iteration, a silent
    // failure to persist is not worth alerting the learner about.
    setNudgeFeedback(rating)
    try {
      await api.submitNudgeFeedback(nudge.id, rating)
    } catch {
      // swallow
    }
  }

  // Fetch the reference solution the first time the learner opens the
  // Solution tab after passing. We fetch on demand (not on pass) to keep
  // bandwidth zero for learners who never look.
  useEffect(() => {
    if (tab !== 'solution') return
    if (!isCompleted) return
    if (solutionCode !== null || solutionError !== null) return
    const anonId = !isIframeLang ? getAnonymousId() ?? undefined : undefined
    api
      .getStepSolution(scrollSlug, step.id, anonId)
      .then((r) => {
        setSolutionCode(r.solution ?? '')
        setAlternativeApproach(r.alternativeApproach ?? null)
      })
      .catch((e) => {
        setSolutionError(e instanceof Error ? e.message : 'Could not load solution')
      })
  }, [tab, isCompleted, solutionCode, solutionError, scrollSlug, step.id, isIframeLang])

  const runCode = async () => {
    if (!step.testCode || running) return
    setRunning(true)
    setResult(null)
    try {
      const res = isIframeLang
        ? await runInIframe({ starterCode: code, testCode: step.testCode })
        : await api.executeStep({ code, testCode: step.testCode, language })
      setResult(res)
      // For playgrounds the Tests / Solution tabs are hidden — always show
      // Output. For katas, jump to Output on error so the learner sees the
      // failure, otherwise to Tests for the pass/fail breakdown.
      setTab(isPlayground || res.errorKind ? 'output' : 'tests')
      // Mark the step complete on pass — but DO NOT advance. The learner
      // stays on this step so the Solution tab (now unlocked) is reachable
      // before they hit Next. Auto-advancing here was hiding the solution
      // behind the next step.
      if (res.passed && !isCompleted) {
        onMarkComplete()
      }
    } catch {
      setResult({
        passed: false,
        output: 'Execution failed — could not reach the sandbox.',
        stdout: '',
        stderr: 'Network or server error while running your code.',
        testResults: [],
        errorKind: 'sandbox',
        errorMessage: "Couldn't reach the code sandbox. Try again in a moment.",
      })
      setTab('output')
    } finally {
      setRunning(false)
    }
  }

  const editorLanguage = (isIframeLang ? 'javascript-dom' : language) as CodeEditorLanguage

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* Instruction */}
      <div className="px-6 py-4 border-b border-border/40 overflow-y-auto max-h-[35vh]">
        <h1 className="text-lg md:text-xl font-mono text-primary mb-3">
          {stepTitle}
        </h1>
        <MarkdownContent content={instructionBody} />
      </div>

      {/* Editor + Results */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 editor-focus-ring">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={editorLanguage}
          />
        </div>

        {/* Run button + status */}
        <div className="px-4 py-2 border-t border-border/40 bg-surface flex items-center gap-3 flex-wrap">
          <button
            onClick={runCode}
            disabled={running}
            className={`px-5 py-2 font-mono text-sm rounded transition-all duration-150 active:scale-95 ${
              running
                ? 'bg-muted/20 text-muted cursor-wait'
                : 'bg-accent text-bg hover:bg-accent/90'
            }`}
          >
            {running ? 'Running...' : isPlayground ? '↻ Try it' : '▶ Run'}
          </button>
          {isIframeLang && (
            <span className="text-xs text-muted font-mono">Runs in browser</span>
          )}
          {result && (isPlayground ? <ExploredChip /> : <StatusChip result={result} />)}
          {isCompleted && (
            <button
              onClick={onAdvance}
              className="px-4 py-2 bg-success/15 text-success border border-success/40 font-mono text-sm rounded transition-all duration-150 hover:bg-success/25 active:scale-95"
            >
              Next →
            </button>
          )}
          <div className="ml-auto flex items-center gap-3">
            {result && !nudgeDisabled && !isPlayground && (
              <button
                onClick={askSensei}
                disabled={nudgeLoading}
                className="text-xs font-mono text-accent hover:text-accent/80 transition-colors disabled:opacity-50 disabled:cursor-wait"
              >
                {nudgeLoading ? '⌛ Thinking…' : '🥋 Ask the sensei'}
              </button>
            )}
            {step.hint && (
              <button
                onClick={() => setShowHint((v) => !v)}
                className="text-xs font-mono text-muted hover:text-secondary transition-colors"
              >
                {showHint ? '× Hide hint' : '💡 Show hint'}
              </button>
            )}
          </div>
        </div>

        {/* Hint panel */}
        {showHint && step.hint && (
          <div className="px-4 py-3 border-t border-border/40 bg-surface/40">
            <p className="text-xs font-mono text-muted uppercase tracking-wider mb-1">hint</p>
            <p className="text-sm text-secondary leading-relaxed">{step.hint}</p>
          </div>
        )}

        {/* Sensei nudge */}
        {(nudge || nudgeError) && (
          <div className="px-4 py-3 border-t border-accent/40 bg-accent/5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-mono text-accent uppercase tracking-wider">sensei</p>
              <button
                onClick={() => { setNudge(null); setNudgeError(null); setNudgeFeedback(null) }}
                className="text-xs font-mono text-muted hover:text-secondary transition-colors"
                aria-label="Dismiss nudge"
              >
                ×
              </button>
            </div>
            {nudge && (
              <>
                <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{nudge.text}</p>
                <div className="flex items-center gap-2 mt-2 text-xs font-mono">
                  {nudgeFeedback ? (
                    <span className="text-muted">Thanks — noted.</span>
                  ) : (
                    <>
                      <span className="text-muted">Did this help?</span>
                      <button
                        onClick={() => rateNudge('up')}
                        className="text-muted hover:text-success transition-colors"
                        aria-label="This nudge helped"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => rateNudge('down')}
                        className="text-muted hover:text-danger transition-colors"
                        aria-label="This nudge did not help"
                      >
                        👎
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
            {nudgeError && (
              <p className="text-sm text-danger leading-relaxed">{nudgeError}</p>
            )}
          </div>
        )}

        {/* Output panel */}
        <OutputPanel
          result={result}
          tab={tab}
          onTabChange={setTab}
          isCompleted={isCompleted}
          solutionCode={solutionCode}
          alternativeApproach={alternativeApproach}
          solutionError={solutionError}
          editorLanguage={editorLanguage}
          isPlayground={isPlayground}
        />
      </div>
    </div>
  )
}

function StatusChip({ result }: { result: ExecuteStepResponse }) {
  if (result.errorKind) {
    return (
      <span className="text-sm font-mono text-warning animate-status-reveal">
        ⚠ {labelForErrorKind(result.errorKind)}
      </span>
    )
  }
  if (result.passed) {
    return (
      <span className="text-sm font-mono text-success animate-status-reveal">
        ✓ All tests passed
      </span>
    )
  }
  const failed = result.testResults.filter((t) => !t.passed).length
  const total = result.testResults.length
  return (
    <span className="text-sm font-mono text-danger animate-status-reveal">
      ✗ {failed} of {total} test{total === 1 ? '' : 's'} failed
    </span>
  )
}

function labelForErrorKind(kind: NonNullable<ExecuteStepResponse['errorKind']>): string {
  switch (kind) {
    case 'sandbox': return 'Sandbox unavailable'
    case 'timeout': return 'Timed out'
    case 'compile': return 'Compile error'
    case 'runtime': return 'Runtime error'
  }
}

function OutputPanel({
  result,
  tab,
  onTabChange,
  isCompleted,
  solutionCode,
  alternativeApproach,
  solutionError,
  editorLanguage,
  isPlayground,
}: {
  result: ExecuteStepResponse | null
  tab: OutputTab
  onTabChange: (t: OutputTab) => void
  isCompleted: boolean
  solutionCode: string | null
  alternativeApproach: string | null
  solutionError: string | null
  editorLanguage: string
  isPlayground: boolean
}) {
  // Playgrounds: only the Output tab. No Tests (the harness is trivially-true
  // so the test list is noise), no Solution (no canonical answer to a free
  // exploration). The current `tab` may carry an outdated value if the step
  // changed, but the render forces Output anyway.
  if (isPlayground) {
    return (
      <div className="border-t border-border/40 bg-surface/50 flex flex-col min-h-48 max-h-[34vh]">
        <div className="flex items-center gap-1 px-3 pt-2 border-b border-border/30">
          <TabButton active={true} onClick={() => onTabChange('output')}>
            Output
            {result && result.errorKind && <span className="ml-1.5 text-warning">●</span>}
          </TabButton>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!result ? (
            <p className="text-xs font-mono text-muted/60">
              Try the code above. Change things. Watch the output.
            </p>
          ) : (
            <OutputTab result={result} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-border/40 bg-surface/50 flex flex-col min-h-48 max-h-[34vh]">
      <div className="flex items-center gap-1 px-3 pt-2 border-b border-border/30">
        <TabButton active={tab === 'tests'} onClick={() => onTabChange('tests')}>
          Tests
          {result && result.testResults.length > 0 && (
            <span className="ml-1.5 text-muted">
              ({result.testResults.filter((t) => t.passed).length}/{result.testResults.length})
            </span>
          )}
        </TabButton>
        <TabButton active={tab === 'output'} onClick={() => onTabChange('output')}>
          Output
          {result && result.errorKind && <span className="ml-1.5 text-warning">●</span>}
        </TabButton>
        <TabButton
          active={tab === 'solution'}
          disabled={!isCompleted}
          title={isCompleted ? undefined : 'Pass the step to unlock the reference solution'}
          onClick={() => onTabChange('solution')}
        >
          Solution {!isCompleted && <span className="ml-1 text-muted/60">🔒</span>}
        </TabButton>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {tab === 'solution' ? (
          <SolutionTab
            isCompleted={isCompleted}
            solutionCode={solutionCode}
            alternativeApproach={alternativeApproach}
            solutionError={solutionError}
            language={editorLanguage}
          />
        ) : !result ? (
          <p className="text-xs font-mono text-muted/60">
            Run your code to see test results and output.
          </p>
        ) : tab === 'tests' ? (
          <TestsTab result={result} />
        ) : (
          <OutputTab result={result} />
        )}
      </div>
    </div>
  )
}

// Replaces StatusChip in the playground variant. Verdict is irrelevant here
// (the harness is trivially-true) but Maya's interaction-teaches contract
// requires *some* feedback that the run registered — otherwise the learner
// runs code and sees no acknowledgement, which reads as broken.
function ExploredChip() {
  return (
    <span className="text-sm font-mono text-secondary animate-status-reveal">
      ↻ explored
    </span>
  )
}

function SolutionTab({
  isCompleted,
  solutionCode,
  alternativeApproach,
  solutionError,
  language,
}: {
  isCompleted: boolean
  solutionCode: string | null
  alternativeApproach: string | null
  solutionError: string | null
  language: string
}) {
  if (!isCompleted) {
    return (
      <p className="text-xs font-mono text-muted/60">
        Pass the step to see one reference solution.
      </p>
    )
  }
  if (solutionError) {
    return (
      <p className="text-xs font-mono text-danger/80">
        Couldn&apos;t load the solution: {solutionError}
      </p>
    )
  }
  if (solutionCode === null) {
    return <p className="text-xs font-mono text-muted/60">Loading solution...</p>
  }
  if (solutionCode.trim() === '') {
    return (
      <p className="text-xs font-mono text-muted/60">
        No reference solution recorded for this step.
      </p>
    )
  }
  return (
    <div className="space-y-4">
      <section>
        <p className="text-xs font-mono text-muted mb-2">
          One way to write this. Yours might be different — both can be right.
        </p>
        <pre className="text-xs font-mono text-secondary whitespace-pre overflow-x-auto bg-bg/40 rounded p-3 border border-border/30">
          <code className={`language-${language}`}>{solutionCode}</code>
        </pre>
      </section>
      {alternativeApproach && (
        <details className="border-t border-border/30 pt-3">
          <summary className="cursor-pointer text-xs font-mono text-muted hover:text-secondary transition-colors">
            Alternative approach
          </summary>
          <div className="mt-2">
            <PlainMarkdown content={alternativeApproach} />
          </div>
        </details>
      )}
    </div>
  )
}

function TabButton({
  active,
  children,
  onClick,
  disabled,
  title,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-1.5 text-xs font-mono transition-colors border-b-2 -mb-px ${
        active
          ? 'text-accent border-accent'
          : disabled
          ? 'text-muted/40 border-transparent cursor-not-allowed'
          : 'text-muted border-transparent hover:text-secondary'
      }`}
    >
      {children}
    </button>
  )
}

function TestsTab({ result }: { result: ExecuteStepResponse }) {
  if (result.errorKind) {
    return (
      <ErrorCard
        kind={result.errorKind}
        message={result.errorMessage ?? labelForErrorKind(result.errorKind)}
        detail={result.stderr || result.output}
      />
    )
  }
  if (result.testResults.length === 0) {
    return (
      <p className="text-xs font-mono text-muted">
        No tests recorded. Check the Output tab for any console messages.
      </p>
    )
  }
  return (
    <div className="space-y-1.5">
      {result.testResults.map((tr, i) => (
        <div
          key={i}
          className={`text-xs font-mono flex items-start gap-2 animate-test-row ${
            tr.passed ? 'text-success' : 'text-danger'
          }`}
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <span className="shrink-0">{tr.passed ? '✓' : '✗'}</span>
          <div className="min-w-0 flex-1">
            <div className="break-words">{tr.name}</div>
            {tr.message && !tr.passed && (
              <div className="text-muted text-xs mt-0.5 break-words">{tr.message}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function OutputTab({ result }: { result: ExecuteStepResponse }) {
  const hasStdout = result.stdout.trim().length > 0
  const hasStderr = result.stderr.trim().length > 0
  if (!hasStdout && !hasStderr) {
    return (
      <p className="text-xs font-mono text-muted/60">
        No output. Add <code className="text-accent">console.log(...)</code> calls to inspect values.
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {hasStdout && (
        <div>
          <p className="text-xs font-mono text-muted uppercase tracking-widest mb-1">stdout</p>
          <pre className="text-xs font-mono text-secondary whitespace-pre-wrap break-words">
            {result.stdout}
          </pre>
        </div>
      )}
      {hasStderr && (
        <div>
          <p className="text-xs font-mono text-danger/80 uppercase tracking-widest mb-1">stderr</p>
          <pre className="text-xs font-mono text-danger/90 whitespace-pre-wrap break-words">
            {result.stderr}
          </pre>
        </div>
      )}
    </div>
  )
}

function ErrorCard({
  kind,
  message,
  detail,
}: {
  kind: NonNullable<ExecuteStepResponse['errorKind']>
  message: string
  detail: string
}) {
  const trimmed = detail.trim()
  return (
    <div className="p-3 border border-warning/40 bg-warning/5 rounded-sm">
      <p className="text-xs font-mono uppercase tracking-widest text-warning mb-1.5">
        ⚠ {labelForErrorKind(kind)}
      </p>
      <p className="text-sm text-secondary mb-2">{message}</p>
      {trimmed && (
        <pre className="text-xs font-mono text-muted/80 whitespace-pre-wrap break-words border-t border-warning/20 pt-2 mt-2 max-h-32 overflow-y-auto">
          {trimmed}
        </pre>
      )}
    </div>
  )
}

// ── Further reading ────────────────────────────────────────────

const KIND_ICON: Record<ExternalReferenceKind, string> = {
  book: '📘',
  docs: '📄',
  talk: '🎤',
  article: '📝',
}

function FurtherReading({ refs }: { refs: ExternalReference[] }) {
  const [open, setOpen] = useState(false)
  if (refs.length === 0) return null

  return (
    <section className="mt-4 mx-4 border-t border-border/20 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left text-xs font-mono text-muted uppercase tracking-wider hover:text-secondary transition-colors flex items-center gap-1"
      >
        <span className="text-xs">{open ? '▼' : '▶'}</span>
        Further reading
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5 text-xs">
          {refs.map((r) => (
            <li key={r.url} className="flex items-start gap-1.5">
              <span className="shrink-0">{KIND_ICON[r.kind]}</span>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline wrap-break-word"
              >
                {r.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function stripLeadingH1(md: string): string {
  // Drops the first line if it's an H1, plus one trailing blank line.
  return md.replace(/^#\s+.+(\r?\n(\r?\n)?)?/, '').trimStart()
}

// ── Simple markdown renderer ────────────────────────────────────

function markdownToInnerHtml(text: string): string {
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-bg/50 rounded p-3 my-3 overflow-x-auto"><code class="text-xs font-mono text-secondary">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-bg/50 px-1.5 py-0.5 rounded text-accent text-xs font-mono">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-mono text-primary mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-mono text-primary mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-mono text-primary mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-primary">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="text-sm text-muted ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-sm text-muted mb-3">')
}

function PlainMarkdown({ content }: { content: string }) {
  const segments = splitOnFigureDirectives(content)
  const only = segments[0]
  if (segments.length === 1 && only && only.kind === 'text') {
    return (
      <div
        className="text-sm text-muted leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: `<p class="text-sm text-muted mb-3">${markdownToInnerHtml(only.content)}</p>`,
        }}
      />
    )
  }
  return (
    <div className="text-sm text-muted leading-relaxed">
      {segments.map((seg, i) =>
        seg.kind === 'text' ? (
          <div
            key={i}
            dangerouslySetInnerHTML={{
              __html: `<p class="text-sm text-muted mb-3">${markdownToInnerHtml(seg.content)}</p>`,
            }}
          />
        ) : (
          <FigureRenderer key={i} id={seg.id} />
        ),
      )}
    </div>
  )
}

const SLOT_STYLES: Record<SlotHeading, string> = {
  'Why this matters': 'border-accent/40 bg-accent/5',
  'Your task': 'border-border bg-surface',
  'Examples': 'border-muted/40 bg-muted/5',
  'Edge cases': 'border-warning/40 bg-warning/5',
}

const SLOT_LABEL_COLORS: Record<SlotHeading, string> = {
  'Why this matters': 'text-accent',
  'Your task': 'text-muted',
  'Examples': 'text-muted',
  'Edge cases': 'text-warning',
}

function SlotCard({ slot, body }: { slot: SlotHeading; body: string }) {
  return (
    <section className={`p-3 border rounded-sm ${SLOT_STYLES[slot]}`}>
      <p className={`text-xs font-mono uppercase tracking-widest mb-2 ${SLOT_LABEL_COLORS[slot]}`}>
        {slot}
      </p>
      {body && <PlainMarkdown content={body} />}
    </section>
  )
}

function MarkdownContent({ content }: { content: string }) {
  const slots = renderSlots(content)
  if (slots) {
    return (
      <div className="space-y-3">
        {slots.map((s) => (
          <SlotCard key={s.slot} slot={s.slot} body={s.body} />
        ))}
      </div>
    )
  }
  return <PlainMarkdown content={content} />
}

// ── ScrollCompleteBanner ────────────────────────────────────────

function ScrollCompleteBanner({
  scrollTitle,
  scrollSlug,
  userId,
  lessonCount,
  stepCount,
}: {
  scrollTitle: string
  scrollSlug: string
  userId: string
  lessonCount: number
  stepCount: number
}) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/share/scroll/${scrollSlug}/${userId}`

  async function handleShare() {
    const text = `Completed ${scrollTitle} in dojo_`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'dojo_ scroll complete', text, url: shareUrl })
        return
      } catch {
        // Fall through to clipboard if the user dismisses the share sheet.
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
        '_blank',
      )
    }
  }

  return (
    <section className="px-4 md:px-8 py-10 md:py-12 max-w-3xl mx-auto text-center">
      <p className="font-mono text-xs tracking-[0.08em] uppercase text-success">
        Scroll · Complete
      </p>
      <h2 className="text-primary text-3xl md:text-5xl font-semibold leading-tight tracking-tight mt-4">
        {scrollTitle}
      </h2>
      <p className="font-mono text-xs tracking-[0.08em] uppercase text-muted mt-3">
        {lessonCount} lessons · {stepCount} steps
      </p>

      {/* Verdict-style block — emerald LEFT BORDER for completion (NOT indigo). */}
      <div className="bg-surface border border-border border-l-4 border-l-success rounded-md p-6 md:p-8 mt-8 text-left">
        <p className="font-mono text-xs tracking-[0.08em] uppercase text-secondary">
          [Sensei]
        </p>
        <p className="text-primary text-base leading-relaxed mt-3">
          You pulled apart everything you swore you understood. Some answers were elegant. Some
          you brute-forced. Both worked. The cursor disagrees and keeps blinking.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-center gap-2 mt-8">
        <Link
          to="/scrolls"
          className="font-mono text-xs tracking-[0.08em] uppercase border border-border text-secondary hover:border-accent hover:text-primary transition-colors px-4 h-9 inline-flex items-center justify-center rounded-sm"
        >
          ← Back to scrolls
        </Link>
        <button
          type="button"
          onClick={handleShare}
          className="font-mono text-xs tracking-[0.08em] uppercase border border-border text-secondary hover:border-accent hover:text-primary transition-colors px-4 h-9 inline-flex items-center justify-center rounded-sm"
        >
          {copied ? 'Link copied!' : 'Share completion'}
        </button>
        <Link
          to="/"
          className="font-mono text-xs tracking-[0.08em] uppercase bg-accent text-primary hover:bg-accent/90 transition-colors px-4 h-9 inline-flex items-center justify-center rounded-sm"
        >
          Try the dojo →
        </Link>
      </div>
    </section>
  )
}
