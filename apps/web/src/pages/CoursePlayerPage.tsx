import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { runInIframe } from '../lib/iframeSandboxRunner'
import { PageLoader } from '../components/PageLoader'
import { CodeEditor } from '../components/ui/CodeEditor'
import type { CourseDetailDTO, LessonDTO, StepDTO, ExecuteStepResponse } from '@dojo/shared'
import { useAuth } from '../context/AuthContext'

// ── localStorage progress helpers ────────────────────────────────

function getLocalProgress(courseId: string): string[] {
  try {
    const raw = localStorage.getItem(`dojo_course_progress_${courseId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalProgress(courseId: string, steps: string[]) {
  localStorage.setItem(`dojo_course_progress_${courseId}`, JSON.stringify(steps))
}

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
        // Set first step as active
        const firstLesson = c.lessons[0]
        const firstStep = firstLesson?.steps[0]
        if (firstStep) {
          setActiveStepId(firstStep.id)
        }
      })
      .catch(() => setError('Course not found'))
  }, [slug])

  // Load progress (merge localStorage + server)
  useEffect(() => {
    if (!course) return
    const local = getLocalProgress(course.id)

    if (user) {
      api.getProgress(course.id)
        .then((serverProgress) => {
          const merged = [...new Set([...local, ...serverProgress.completedSteps])]
          setCompletedSteps(merged)
          saveLocalProgress(course.id, merged)
        })
        .catch(() => setCompletedSteps(local))
    } else {
      setCompletedSteps(local)
    }
  }, [course, user])

  const markStepComplete = useCallback((stepId: string) => {
    if (!course) return
    setCompletedSteps((prev) => {
      if (prev.includes(stepId)) return prev
      const updated = [...prev, stepId]
      saveLocalProgress(course.id, updated)
      // Persist server-side if authenticated
      if (user) {
        api.trackProgress(course.id, stepId).catch(() => {})
      }
      return updated
    })
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
                  {isComplete ? '✓' : step.type === 'read' ? '📖' : step.type === 'challenge' ? '⚡' : '💻'}
                </span>
                <span className="truncate text-xs">
                  {step.type === 'read' ? 'Read' : `Step ${step.order}`}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── StepContent ─────────────────────────────────────────────────

function StepContent({
  step,
  language,
  isCompleted,
  onComplete,
}: {
  step: StepDTO
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
      language={language}
      isCompleted={isCompleted}
      onComplete={onComplete}
    />
  )
}

// ── StepEditor ──────────────────────────────────────────────────

function StepEditor({
  step,
  language,
  isCompleted,
  onComplete,
}: {
  step: StepDTO
  language: string
  isCompleted: boolean
  onComplete: () => void
}) {
  const [code, setCode] = useState(step.starterCode ?? '')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ExecuteStepResponse | null>(null)

  const isIframeLang = language === 'javascript-dom'

  // Reset code when step changes
  useEffect(() => {
    setCode(step.starterCode ?? '')
    setResult(null)
  }, [step.id])

  const runCode = async () => {
    if (!step.testCode || running) return
    setRunning(true)
    setResult(null)
    try {
      const res = isIframeLang
        ? await runInIframe({ starterCode: code, testCode: step.testCode })
        : await api.executeStep({ code, testCode: step.testCode, language })
      setResult(res)
      if (res.passed && !isCompleted) {
        onComplete()
      }
    } catch {
      setResult({ passed: false, output: 'Execution failed', testResults: [] })
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
        <MarkdownContent content={step.instruction} />
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

        {/* Run button */}
        <div className="px-4 py-2 border-t border-border/40 bg-surface flex items-center gap-3">
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
          {result && (
            <span className={`text-sm font-mono ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
              {result.passed ? '✓ All tests passed' : '✗ Tests failed'}
            </span>
          )}
        </div>

        {/* Test results */}
        {result && (
          <div className="border-t border-border/40 bg-surface/50 max-h-[30vh] overflow-y-auto">
            <div className="px-4 py-3">
              {result.testResults.length > 0 ? (
                <div className="space-y-1">
                  {result.testResults.map((tr, i) => (
                    <div
                      key={i}
                      className={`text-xs font-mono flex items-start gap-2 ${
                        tr.passed ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      <span className="shrink-0">{tr.passed ? '✓' : '✗'}</span>
                      <span>{tr.name}</span>
                      {tr.message && !tr.passed && (
                        <span className="text-muted/60 ml-2">{tr.message}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="text-xs font-mono text-muted whitespace-pre-wrap">
                  {result.output}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Simple markdown renderer ────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  // Convert markdown to HTML (basic: headers, code blocks, bold, paragraphs)
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
