import { Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { api, ApiError, type SessionWithExercise } from '../lib/api'
import { TypeBadge, DifficultyBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Timer } from '../components/ui/Timer'
import { CodeEditor } from '../components/ui/CodeEditor'
import { KataBody } from '../components/ui/KataBody'
import { ErrorState } from '../components/ui/ErrorState'
import { lazyWithRetry } from '../lib/lazyWithRetry'
import type { ExerciseType } from '@dojo/shared'
const MermaidEditor = lazyWithRetry(() => import('../components/ui/MermaidEditor').then(m => ({ default: m.MermaidEditor })))

const PREPARING_MESSAGES = [
  'The sensei is reading your brief...',
  'Setting the scene...',
  'Preparing the kata...',
  'The dojo is getting ready...',
  'Sharpening the problem...',
  'Almost there...',
]

// Session-body generation can take ~30s p50 against slower LLM proxies and
// occasionally longer. Ceiling ~2min so we don't bail before the API has
// had a realistic chance to finish or mark the session failed.
const PREPARE_POLL_INTERVAL_MS = 2000
const PREPARE_MAX_POLLS = 60
const PREPARE_SLOW_NOTICE_AFTER = 8

export function KataActivePage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [session, setSession] = useState<SessionWithExercise | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [preparingMsg, setPreparingMsg] = useState(PREPARING_MESSAGES[0]!)
  const [prepareSlow, setPrepareSlow] = useState(false)
  const [userResponse, setUserResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [prepareError, setPrepareError] = useState(false)
  const msgIndex = useRef(0)
  const pollCount = useRef(0)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    function applyActiveSession(s: SessionWithExercise): void {
      setPreparing(false)
      setSession(s)
      if (s.exercise.starterCode) {
        setUserResponse(s.exercise.starterCode)
      }
    }

    async function load() {
      try {
        const s = await api.getSession(sessionId!)
        if (cancelled) return

        if (s.status === 'active') {
          applyActiveSession(s)
          return
        }
        if (s.status === 'preparing') {
          setPreparing(true)
          // Try the SSE stream first (S022 Part 6). If it 404s the flag
          // is off on the API side and we fall back to the polling
          // path. Any other error surfaces the prepare-error UI.
          try {
            for await (const _chunk of api.streamSessionBody(sessionId!)) {
              if (cancelled) return
              // Visible token-by-token feedback would need a body-progressive
              // surface in the prepare UI; for now we just confirm the
              // stream is alive so the slow-notice doesn't fire while the
              // model is producing.
            }
            if (cancelled) return
            // Stream finished — body is persisted. Refetch once to
            // pull the now-active session shape (exercise, ownerRole).
            const final = await api.getSession(sessionId!)
            if (cancelled) return
            if (final.status === 'active') {
              applyActiveSession(final)
              return
            }
            if (final.status === 'failed' && !final.finalAttempt) {
              setPrepareError(true)
              return
            }
            navigate(`/kata/${sessionId}/result`, { replace: true })
            return
          } catch (sseErr) {
            if (cancelled) return
            if (sseErr instanceof ApiError && sseErr.status === 404) {
              // SSE flag off on the API — fall back to the polling path.
            } else {
              setPrepareError(true)
              return
            }
          }
          // Polling fallback (also covers FF off and pre-S022 deploys).
          pollCount.current++
          if (pollCount.current >= PREPARE_MAX_POLLS) {
            setPrepareError(true)
            return
          }
          if (pollCount.current >= PREPARE_SLOW_NOTICE_AFTER) {
            setPrepareSlow(true)
          }
          setTimeout(load, PREPARE_POLL_INTERVAL_MS)
          return
        }
        // Preparation failed on the server — show the error UI instead of
        // routing to results (there is no attempt to render).
        if (s.status === 'failed' && !s.finalAttempt) {
          setPrepareError(true)
          return
        }
        // completed or failed with an attempt to show
        navigate(`/kata/${sessionId}/result`, { replace: true })
      } catch (err) {
        if (cancelled) return
        // Non-retryable API errors: show the error UI immediately instead of polling blindly.
        if (err instanceof ApiError && err.status !== undefined && err.status !== 0 && err.status < 500) {
          setPrepareError(true)
          return
        }
        pollCount.current++
        if (pollCount.current >= PREPARE_MAX_POLLS) {
          setPrepareError(true)
          return
        }
        if (pollCount.current >= PREPARE_SLOW_NOTICE_AFTER) {
          setPrepareSlow(true)
        }
        setTimeout(load, PREPARE_POLL_INTERVAL_MS)
      }
    }

    load()
    return () => { cancelled = true }
  }, [sessionId, navigate])

  // Warn before closing tab during active kata
  useEffect(() => {
    if (!session) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [session])

  useEffect(() => {
    if (!preparing) return
    const interval = setInterval(() => {
      msgIndex.current = (msgIndex.current + 1) % PREPARING_MESSAGES.length
      setPreparingMsg(PREPARING_MESSAGES[msgIndex.current]!)
    }, 3000)
    return () => clearInterval(interval)
  }, [preparing])

  async function handleSubmit() {
    if (!session || !sessionId || !userResponse.trim() || submitting) return
    setSubmitting(true)
    try {
      const { attemptId } = await api.submitAttempt(sessionId, userResponse)
      sessionStorage.setItem(`dojo-attempt-${sessionId}`, attemptId)
      navigate(`/kata/${sessionId}/eval`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 408) {
        navigate(`/kata/${sessionId}/result`)
      } else {
        setSubmitting(false)
      }
    }
  }

  if (prepareError) {
    return (
      <ErrorState
        message="Something went wrong preparing your kata."
        primaryAction={{ label: 'Start a new kata', onClick: () => navigate('/start') }}
        secondaryAction={{ label: 'Back to dashboard', onClick: () => navigate('/dashboard') }}
      />
    )
  }

  if (preparing || !session) {
    return (
      <div className="h-screen bg-page flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-secondary text-sm animate-pulse">{preparingMsg}</p>
        {prepareSlow && (
          <p className="font-mono text-muted text-xs text-center max-w-sm">
            This is taking a bit longer than usual. Hang on — if it doesn't resolve soon you can retry.
          </p>
        )}
      </div>
    )
  }

  const { exercise } = session
  const isCode = exercise.type === 'code'
  const isWhiteboard = exercise.type === 'whiteboard'
  const isReview = exercise.type === 'review'
  // Horizontal split for side-by-side formats (diff + review panel works
  // exactly like code + response). Chat stays vertical — the body is prose.
  const orientation =
    isMobile || (!isCode && !isWhiteboard && !isReview) ? 'vertical' : 'horizontal'
  const language = resolveLanguage(exercise.language)
  const filename = isCode ? `solution.${fileExtension(language)}` : null
  const editorLabel = isCode
    ? languageLabel(language)
    : isWhiteboard
      ? 'Mermaid'
      : 'Prose'

  return (
    <div className="h-screen bg-page flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-14 shrink-0 border-b border-border bg-surface/90 backdrop-blur-md grid grid-cols-3 items-center px-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono font-bold text-accent text-base inline-flex items-center select-none">
            dojo<span className="animate-cursor ml-0.5" aria-hidden>_</span>
          </span>
          <span className="h-4 w-px bg-border hidden sm:block" />
          <span className="font-mono text-[10px] tracking-wider text-success border border-success/40 bg-success/10 px-1.5 py-0.5 rounded-sm hidden sm:inline">
            READY
          </span>
          <span className="font-mono text-[11px] text-secondary truncate hidden md:inline">
            Active Task
          </span>
        </div>
        <div className="flex justify-center">
          <Timer
            durationMinutes={exercise.duration}
            startedAt={session.startedAt}
            onExpired={() => { setTimedOut(true); handleSubmit() }}
            size="sm"
          />
        </div>
        <div className="flex justify-end">
          <Button
            variant={timedOut ? 'destructive' : 'primary'}
            size="sm"
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting || (!userResponse.trim() && !timedOut)}
          >
            {timedOut ? 'Submit now' : 'Submit'}
          </Button>
        </div>
      </header>

      {/* Resizable split */}
      <PanelGroup orientation={orientation} className="flex-1 overflow-hidden">
        {/* Problem panel */}
        <Panel defaultSize={isCode ? 40 : 50} minSize={25}>
          <div className="h-full flex flex-col bg-surface">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mb-4">
                <span className="inline-block font-mono text-[11px] tracking-[0.08em] uppercase text-secondary border border-border bg-elevated px-2 py-1 rounded-sm mb-3">
                  [{session.ownerRole.toUpperCase()}]
                </span>
                <h1 className="text-primary text-3xl md:text-4xl font-semibold leading-tight tracking-tight mb-3">
                  {exercise.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <TypeBadge type={exercise.type as ExerciseType} />
                  <DifficultyBadge difficulty={exercise.difficulty} />
                  {isWhiteboard && exercise.tags.length > 0 && exercise.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-warning text-[10px] font-mono px-2 py-0.5 bg-warning/10 border border-warning/30 rounded-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <KataBody body={session.body} />
            </div>
            <div className="px-6 py-3 border-t border-border bg-page/50 shrink-0">
              <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted text-center opacity-70">
                Enter the dojo. Leave the AI outside.
              </p>
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className={`
          bg-border hover:bg-accent transition-colors duration-150
          ${orientation === 'horizontal' ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize'}
        `} />

        {/* Response panel */}
        <Panel defaultSize={isCode ? 60 : 50} minSize={20} className="flex flex-col">
          {(isCode || isWhiteboard) && (
            <div className="h-9 shrink-0 border-b border-border bg-surface flex items-center px-4 gap-3">
              <span className="font-mono text-[12px] text-primary">
                {filename ?? 'whiteboard.mmd'}
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="font-mono text-[11px] text-muted">{editorLabel}</span>
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            {isCode ? (
              <CodeEditor
                value={userResponse}
                onChange={setUserResponse}
                language={language}
                placeholder="Write your solution..."
              />
            ) : isWhiteboard ? (
              <Suspense fallback={<div className="p-4 text-muted font-mono text-sm">Loading editor...</div>}>
                <MermaidEditor value={userResponse} onChange={setUserResponse} />
              </Suspense>
            ) : (
              <ChatEditor
                value={userResponse}
                onChange={setUserResponse}
                placeholder={
                  isReview
                    ? 'Write your review. Focus on correctness — what would you ask to change before merging?'
                    : undefined
                }
              />
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}

function ChatEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [mono, setMono] = useState(false)
  const wordCount = value.split(/\s+/).filter(Boolean).length

  return (
    <div className="flex flex-col h-full p-4 gap-2 bg-page">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Start writing. Think out loud. The sensei reads everything.'}
        spellCheck={false}
        className={`flex-1 bg-surface border border-border rounded-sm p-3 text-primary text-sm resize-none focus:outline-none focus:border-accent transition-colors ${
          mono ? 'font-mono' : 'font-sans'
        }`}
      />
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMono(!mono)}
          className="text-muted text-[10px] font-mono hover:text-secondary transition-colors"
        >
          {mono ? 'sans' : 'mono'}
        </button>
        <span className="text-muted text-xs font-mono">{wordCount} words</span>
      </div>
    </div>
  )
}

function resolveLanguage(langs: string[]): 'javascript' | 'typescript' | 'python' | 'sql' {
  if (langs.includes('typescript')) return 'typescript'
  if (langs.includes('python')) return 'python'
  if (langs.includes('sql')) return 'sql'
  return 'javascript'
}

function fileExtension(lang: 'javascript' | 'typescript' | 'python' | 'sql'): string {
  return { javascript: 'js', typescript: 'ts', python: 'py', sql: 'sql' }[lang]
}

function languageLabel(lang: 'javascript' | 'typescript' | 'python' | 'sql'): string {
  return { javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python', sql: 'SQL' }[lang]
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return mobile
}
