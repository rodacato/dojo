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
import { CodeEditor } from '../components/ui/CodeEditor'
import type { CourseDetailDTO, LessonDTO, StepDTO, ExecuteStepResponse } from '@dojo/shared'
import { useAuth } from '../context/AuthContext'

// ── Main component ──────────────────────────────────────────────

export function CoursePlayerPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()

  const [course, setCourse] = useState<CourseDetailDTO | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [activeStepId, setActiveStepId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Load course
  useEffect(() => {
    if (!slug) return
    api.getCourse(slug)
      .then((c) => {
        setCourse(c)
        const firstLesson = c.lessons[0]
        const firstStep = firstLesson?.steps[0]
        if (firstStep) {
          setActiveStepId(firstStep.id)
        }
      })
      .catch(() => setError('Course not found'))
  }, [slug])

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
  // to track progress on a public course without auth.
  useEffect(() => {
    if (!course) return
    if (user) {
      api.getProgress(course.id)
        .then((r) => setCompletedSteps(r.completedSteps))
        .catch(() => setCompletedSteps([]))
    } else if (course.isPublic) {
      const anonId = getOrCreateAnonymousId()
      api.getProgress(course.id, anonId)
        .then((r) => setCompletedSteps(r.completedSteps))
        .catch(() => setCompletedSteps([]))
    } else {
      setCompletedSteps([])
    }
  }, [course, user])

  const markStepComplete = useCallback((stepId: string) => {
    if (!course) return
    setCompletedSteps((prev) => {
      if (prev.includes(stepId)) return prev
      return [...prev, stepId]
    })
    const anonId = !user && course.isPublic ? getAnonymousId() : undefined
    api.trackProgress(course.id, stepId, anonId ?? undefined).catch(() => {})
  }, [course, user])

  const advanceToNextStep = useCallback(() => {
    if (!course || !activeStepId) return
    const allSteps = course.lessons.flatMap((l) => l.steps)
    const currentIdx = allSteps.findIndex((s) => s.id === activeStepId)
    const nextStep = allSteps[currentIdx + 1]
    if (nextStep) {
      setActiveStepId(nextStep.id)
    }
  }, [course, activeStepId])

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted font-mono text-lg">{error}</p>
          <Link to="/learn" className="text-accent text-sm font-mono mt-4 inline-block hover:underline">
            ← back to courses
          </Link>
        </div>
      </div>
    )
  }

  if (!course) return <PageLoader />

  const activeStep = course.lessons
    .flatMap((l) => l.steps)
    .find((s) => s.id === activeStepId)

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside
        className={`bg-surface border-r border-border/40 transition-all duration-200 flex flex-col shrink-0 ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="p-4 border-b border-border/20">
          <Link to="/learn" className="text-muted text-xs font-mono hover:text-secondary transition-colors">
            ← courses
          </Link>
          <h2 className="text-sm font-mono text-primary mt-2 truncate">{course.title}</h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {course.lessons.map((lesson) => (
            <LessonNav
              key={lesson.id}
              lesson={lesson}
              activeStepId={activeStepId}
              completedSteps={completedSteps}
              onSelectStep={setActiveStepId}
            />
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="border-b border-border/40 bg-surface px-4 py-2 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted hover:text-secondary text-sm font-mono transition-colors"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <span className="text-xs text-muted font-mono truncate">
            {course.title}
          </span>
        </div>

        {activeStep ? (
          <StepContent
            step={activeStep}
            courseSlug={course.slug}
            language={course.language}
            isCompleted={completedSteps.includes(activeStep.id)}
            onComplete={() => {
              markStepComplete(activeStep.id)
              advanceToNextStep()
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-48px)]">
            <p className="text-muted font-mono">Select a step to begin</p>
          </div>
        )}
      </main>
    </div>
  )
}

// ── LessonNav ───────────────────────────────────────────────────

function LessonNav({
  lesson,
  activeStepId,
  completedSteps,
  onSelectStep,
}: {
  lesson: LessonDTO
  activeStepId: string | null
  completedSteps: string[]
  onSelectStep: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="mb-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-2 text-xs font-mono text-muted uppercase tracking-wider hover:text-secondary transition-colors flex items-center gap-1"
      >
        <span className="text-[10px]">{expanded ? '▼' : '▶'}</span>
        <span className="truncate">{lesson.title}</span>
      </button>
      {expanded && (
        <div className="ml-2">
          {lesson.steps.map((step) => {
            const isActive = step.id === activeStepId
            const isComplete = completedSteps.includes(step.id)
            return (
              <button
                key={step.id}
                onClick={() => onSelectStep(step.id)}
                className={`w-full text-left px-4 py-1.5 text-sm font-mono transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'text-accent bg-accent/5 border-l-2 border-accent'
                    : 'text-muted hover:text-secondary border-l-2 border-transparent'
                }`}
              >
                <span className="text-xs shrink-0">
                  {isComplete ? '✓' : stepIcon(step.type)}
                </span>
                <span className="truncate text-xs" title={extractStepTitle(step)}>
                  {extractStepTitle(step)}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function stepIcon(type: StepDTO['type']): string {
  switch (type) {
    case 'read': return '📖'
    case 'challenge': return '⚡'
    case 'exercise': return '📝'
    case 'code': return '💻'
  }
}

// Prefer the explicit step.title field (Sprint 018 schema). Fall back to
// pulling the first H1 from the instruction body for legacy steps that
// haven't been backfilled, and finally the step ordinal.
function extractStepTitle(step: StepDTO): string {
  if (step.title && step.title.trim()) return step.title.trim()
  const match = step.instruction.match(/^#\s+(.+)$/m)
  if (match && match[1]) {
    return match[1].replace(/^(exercise|challenge|read):\s*/i, '').trim()
  }
  if (step.type === 'read') return 'Read'
  return `Step ${step.order}`
}

// ── StepContent ─────────────────────────────────────────────────

function StepContent({
  step,
  courseSlug,
  language,
  isCompleted,
  onComplete,
}: {
  step: StepDTO
  courseSlug: string
  language: string
  isCompleted: boolean
  onComplete: () => void
}) {
  if (step.type === 'read') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <MarkdownContent content={step.instruction} />
        <div className="mt-8">
          <button
            onClick={onComplete}
            className="px-6 py-2.5 bg-accent text-bg font-mono text-sm rounded hover:bg-accent/90 transition-colors"
          >
            {isCompleted ? 'Next →' : 'Continue →'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <StepEditor
      step={step}
      courseSlug={courseSlug}
      language={language}
      isCompleted={isCompleted}
      onComplete={onComplete}
    />
  )
}

// ── StepEditor ──────────────────────────────────────────────────

type OutputTab = 'tests' | 'output' | 'solution'

function StepEditor({
  step,
  courseSlug,
  language,
  isCompleted,
  onComplete,
}: {
  step: StepDTO
  courseSlug: string
  language: string
  isCompleted: boolean
  onComplete: () => void
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
  const [solutionError, setSolutionError] = useState<string | null>(null)

  const isIframeLang = language === 'javascript-dom'
  const stepTitle = extractStepTitle(step)
  // The markdown still contains the H1; strip it so it isn't rendered twice.
  const instructionBody = stripLeadingH1(step.instruction)

  useEffect(() => {
    setCode(step.starterCode ?? '')
    setResult(null)
    setShowHint(false)
    setTab('tests')
    setSolutionCode(null)
    setSolutionError(null)
  }, [step.id, step.starterCode])

  // Fetch the reference solution the first time the learner opens the
  // Solution tab after passing. We fetch on demand (not on pass) to keep
  // bandwidth zero for learners who never look.
  useEffect(() => {
    if (tab !== 'solution') return
    if (!isCompleted) return
    if (solutionCode !== null || solutionError !== null) return
    const anonId = !isIframeLang ? getAnonymousId() ?? undefined : undefined
    api
      .getStepSolution(courseSlug, step.id, anonId)
      .then((r) => setSolutionCode(r.solution ?? ''))
      .catch((e) => {
        setSolutionError(e instanceof Error ? e.message : 'Could not load solution')
      })
  }, [tab, isCompleted, solutionCode, solutionError, courseSlug, step.id, isIframeLang])

  const runCode = async () => {
    if (!step.testCode || running) return
    setRunning(true)
    setResult(null)
    try {
      const res = isIframeLang
        ? await runInIframe({ starterCode: code, testCode: step.testCode })
        : await api.executeStep({ code, testCode: step.testCode, language })
      setResult(res)
      setTab(res.errorKind ? 'output' : 'tests')
      if (res.passed && !isCompleted) {
        onComplete()
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

  const editorLanguage = (isIframeLang ? 'javascript-dom' : language) as
    'javascript' | 'typescript' | 'python' | 'sql' | 'javascript-dom'

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
        <div className="flex-1 min-h-0">
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
            className={`px-5 py-2 font-mono text-sm rounded transition-colors ${
              running
                ? 'bg-muted/20 text-muted cursor-wait'
                : 'bg-accent text-bg hover:bg-accent/90'
            }`}
          >
            {running ? 'Running...' : '▶ Run'}
          </button>
          {isIframeLang && (
            <span className="text-xs text-muted font-mono">Runs in browser</span>
          )}
          {result && <StatusChip result={result} />}
          {step.hint && (
            <button
              onClick={() => setShowHint((v) => !v)}
              className="ml-auto text-xs font-mono text-muted hover:text-secondary transition-colors"
            >
              {showHint ? '× Hide hint' : '💡 Show hint'}
            </button>
          )}
        </div>

        {/* Hint panel */}
        {showHint && step.hint && (
          <div className="px-4 py-3 border-t border-border/40 bg-surface/40">
            <p className="text-xs font-mono text-muted uppercase tracking-wider mb-1">hint</p>
            <p className="text-sm text-secondary leading-relaxed">{step.hint}</p>
          </div>
        )}

        {/* Output panel */}
        <OutputPanel
          result={result}
          tab={tab}
          onTabChange={setTab}
          isCompleted={isCompleted}
          solutionCode={solutionCode}
          solutionError={solutionError}
          editorLanguage={editorLanguage}
        />
      </div>
    </div>
  )
}

function StatusChip({ result }: { result: ExecuteStepResponse }) {
  if (result.errorKind) {
    return (
      <span className="text-sm font-mono text-warning">
        ⚠ {labelForErrorKind(result.errorKind)}
      </span>
    )
  }
  if (result.passed) {
    return <span className="text-sm font-mono text-success">✓ All tests passed</span>
  }
  const failed = result.testResults.filter((t) => !t.passed).length
  const total = result.testResults.length
  return (
    <span className="text-sm font-mono text-danger">
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
  solutionError,
  editorLanguage,
}: {
  result: ExecuteStepResponse | null
  tab: OutputTab
  onTabChange: (t: OutputTab) => void
  isCompleted: boolean
  solutionCode: string | null
  solutionError: string | null
  editorLanguage: string
}) {
  return (
    <div className="border-t border-border/40 bg-surface/50 flex flex-col min-h-[12rem] max-h-[34vh]">
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

function SolutionTab({
  isCompleted,
  solutionCode,
  solutionError,
  language,
}: {
  isCompleted: boolean
  solutionCode: string | null
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
    <div className="space-y-2">
      <p className="text-xs font-mono text-muted">
        One way to write this. Yours might be different — both can be right.
      </p>
      <pre className="text-xs font-mono text-secondary whitespace-pre overflow-x-auto bg-bg/40 rounded p-3 border border-border/30">
        <code className={`language-${language}`}>{solutionCode}</code>
      </pre>
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
          className={`text-xs font-mono flex items-start gap-2 ${
            tr.passed ? 'text-success' : 'text-danger'
          }`}
        >
          <span className="shrink-0">{tr.passed ? '✓' : '✗'}</span>
          <div className="min-w-0 flex-1">
            <div className="break-words">{tr.name}</div>
            {tr.message && !tr.passed && (
              <div className="text-muted text-[11px] mt-0.5 break-words">{tr.message}</div>
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
          <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1">stdout</p>
          <pre className="text-xs font-mono text-secondary whitespace-pre-wrap break-words">
            {result.stdout}
          </pre>
        </div>
      )}
      {hasStderr && (
        <div>
          <p className="text-[10px] font-mono text-danger/80 uppercase tracking-widest mb-1">stderr</p>
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
        <pre className="text-[11px] font-mono text-muted/80 whitespace-pre-wrap break-words border-t border-warning/20 pt-2 mt-2 max-h-32 overflow-y-auto">
          {trimmed}
        </pre>
      )}
    </div>
  )
}

function stripLeadingH1(md: string): string {
  // Drops the first line if it's an H1, plus one trailing blank line.
  return md.replace(/^#\s+.+(\r?\n(\r?\n)?)?/, '').trimStart()
}

// ── Simple markdown renderer ────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  const html = content
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-bg/50 rounded p-3 my-3 overflow-x-auto"><code class="text-xs font-mono text-secondary">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-bg/50 px-1.5 py-0.5 rounded text-accent text-xs font-mono">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-mono text-primary mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-mono text-primary mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-mono text-primary mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-primary">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="text-sm text-muted ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-sm text-muted mb-3">')

  return (
    <div
      className="text-sm text-muted leading-relaxed"
      dangerouslySetInnerHTML={{ __html: `<p class="text-sm text-muted mb-3">${html}</p>` }}
    />
  )
}
