import { Suspense, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { api, ApiError, type SessionWithKata } from '../lib/api'
import { TypeBadge, DifficultyBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Timer } from '../components/ui/Timer'
import { CodeEditor } from '../components/ui/CodeEditor'
import { KataBody } from '../components/ui/KataBody'
import { ErrorState } from '../components/ui/ErrorState'
import { lazyWithRetry } from '../lib/lazyWithRetry'
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
  const [session, setSession] = useState<SessionWithKata | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [preparingMsg, setPreparingMsg] = useState(PREPARING_MESSAGES[0]!)
  const [prepareSlow, setPrepareSlow] = useState(false)
  const [userResponse, setUserResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [prepareError, setPrepareError] = useState(false)
  const [responseFont, setResponseFont] = useState<'mono' | 'sans'>('sans')
  const msgIndex = useRef(0)
  const pollCount = useRef(0)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    function applyActiveSession(s: SessionWithKata): void {
      setPreparing(false)
      setSession(s)
      if (s.kata.starterCode) {
        setUserResponse(s.kata.starterCode)
      }
    }

    // Resolve a not-active session: error UI when prep failed with no attempt,
    // otherwise route to the result screen.
    function resolveTerminalSession(s: SessionWithKata): void {
      if (s.status === 'failed' && !s.finalAttempt) {
        setPrepareError(true)
        return
      }
      navigate(`/katas/${sessionId}/result`, { replace: true })
    }

    function scheduleRetryOrFail(): void {
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

    // SSE stream first (S022 Part 6). Returns true once it has handled the
    // session terminally; false means the caller should fall back to polling
    // (FF off / pre-S022 deploys → the stream 404s).
    async function consumeStream(): Promise<boolean> {
      try {
        for await (const _chunk of api.streamSessionBody(sessionId!)) {
          if (cancelled) return true
          // Visible token-by-token feedback would need a body-progressive
          // surface in the prepare UI; for now we just confirm the
          // stream is alive so the slow-notice doesn't fire while the
          // model is producing.
        }
        if (cancelled) return true
        // Stream finished — body is persisted. Refetch once to
        // pull the now-active session shape (kata, ownerRole).
        const final = await api.getSession(sessionId!)
        if (cancelled) return true
        if (final.status === 'active') {
          applyActiveSession(final)
        } else {
          resolveTerminalSession(final)
        }
        return true
      } catch (sseErr) {
        if (cancelled) return true
        if (sseErr instanceof ApiError && sseErr.status === 404) {
          return false
        }
        setPrepareError(true)
        return true
      }
    }

    async function handlePreparing(): Promise<void> {
      setPreparing(true)
      const handled = await consumeStream()
      if (cancelled || handled) return
      scheduleRetryOrFail()
    }

    function isNonRetryableApiError(err: unknown): boolean {
      return (
        err instanceof ApiError &&
        err.status !== undefined &&
        err.status !== 0 &&
        err.status < 500
      )
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
          await handlePreparing()
          return
        }
        resolveTerminalSession(s)
      } catch (err) {
        if (cancelled) return
        if (isNonRetryableApiError(err)) {
          setPrepareError(true)
          return
        }
        scheduleRetryOrFail()
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
      navigate(`/katas/${sessionId}/eval`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 408) {
        navigate(`/katas/${sessionId}/result`)
      } else {
        setSubmitting(false)
      }
    }
  }

  if (prepareError) {
    return (
      <ErrorState
        message="Something went wrong preparing your kata."
        primaryAction={{ label: 'Start a new kata', onClick: () => navigate('/katas') }}
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

  const { kata } = session
  const isCode = kata.type === 'code'
  // All formats land side-by-side on desktop — the chat panel mirrors the
  // code/whiteboard shell so the redesign reads as one product.
  const orientation = isMobile ? 'vertical' : 'horizontal'

  return (
    <div className="h-screen bg-page flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-14 shrink-0 border-b border-border bg-surface/90 backdrop-blur-md grid grid-cols-3 items-center px-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono font-bold text-accent text-base inline-flex items-center select-none">
            dojo<span className="animate-cursor ml-0.5" aria-hidden>_</span>
          </span>
          <span className="h-4 w-px bg-border hidden sm:block" />
          <span className="font-mono text-xs tracking-wider text-success border border-success/40 bg-success/10 px-1.5 py-0.5 rounded-sm hidden sm:inline">
            READY
          </span>
          <span className="font-mono text-xs text-secondary truncate hidden md:inline">
            Active Task
          </span>
        </div>
        <div className="flex justify-center">
          <Timer
            durationMinutes={kata.duration}
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
                <span className="inline-block font-mono text-xs tracking-[0.08em] uppercase text-secondary border border-border bg-elevated px-2 py-1 rounded-sm mb-3">
                  [{session.ownerRole.toUpperCase()}]
                </span>
                <h1 className="text-primary text-3xl md:text-4xl font-semibold leading-tight tracking-tight mb-3">
                  {kata.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <TypeBadge type={kata.type} />
                  <DifficultyBadge difficulty={kata.difficulty} />
                  {kata.type === 'whiteboard' && kata.tags.length > 0 && kata.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-warning text-xs font-mono px-2 py-0.5 bg-warning/10 border border-warning/30 rounded-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <KataBody body={session.body} />
            </div>
            <div className="px-6 py-3 border-t border-border bg-page/50 shrink-0">
              <p className="font-mono text-xs tracking-[0.08em] uppercase text-muted text-center opacity-70">
                Enter the dojo. Leave the AI outside.
              </p>
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className={`
          bg-border hover:bg-accent transition-colors duration-150
          ${orientation === 'horizontal' ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize'}
        `} />

        <ResponsePanel
          kata={kata}
          value={userResponse}
          onChange={setUserResponse}
          font={responseFont}
          onFontChange={setResponseFont}
          onSubmit={handleSubmit}
        />
      </PanelGroup>
    </div>
  )
}

function ResponsePanel({
  kata,
  value,
  onChange,
  font,
  onFontChange,
  onSubmit,
}: Readonly<{
  kata: SessionWithKata['kata']
  value: string
  onChange: (v: string) => void
  font: 'mono' | 'sans'
  onFontChange: (v: 'mono' | 'sans') => void
  onSubmit: () => void
}>) {
  const isCode = kata.type === 'code'
  const isWhiteboard = kata.type === 'whiteboard'
  const isReview = kata.type === 'review'
  const language = resolveLanguage(kata.language)
  const filename = isCode ? `solution.${fileExtension(language)}` : 'architecture.md'
  const editorLabel = isCode
    ? languageLabel(language)
    : isWhiteboard
      ? 'Mermaid'
      : 'Prose'

  return (
    <Panel defaultSize={isCode ? 60 : 50} minSize={20} className="flex flex-col">
      <div className="h-9 shrink-0 border-b border-border bg-surface flex items-center px-4 gap-3">
        {isCode || isWhiteboard ? (
          <>
            <span className="font-mono text-xs text-primary">{filename}</span>
            <span className="h-3 w-px bg-border" />
            <span className="font-mono text-xs text-muted">{editorLabel}</span>
          </>
        ) : (
          <>
            <span className="font-mono text-xs tracking-[0.08em] uppercase text-muted">
              {isReview ? 'Code Review' : 'Your Response'}
            </span>
            <FontToggle value={font} onChange={onFontChange} className="ml-auto" />
          </>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <ResponseEditor
          kata={kata}
          language={language}
          value={value}
          onChange={onChange}
          font={font}
          onSubmit={onSubmit}
        />
      </div>
    </Panel>
  )
}

function ResponseEditor({
  kata,
  language,
  value,
  onChange,
  font,
  onSubmit,
}: Readonly<{
  kata: SessionWithKata['kata']
  language: Language
  value: string
  onChange: (v: string) => void
  font: 'mono' | 'sans'
  onSubmit: () => void
}>) {
  if (kata.type === 'code') {
    return (
      <CodeEditor
        value={value}
        onChange={onChange}
        language={language}
        placeholder="Write your solution..."
      />
    )
  }
  if (kata.type === 'whiteboard') {
    return (
      <Suspense fallback={<div className="p-4 text-muted font-mono text-sm">Loading editor...</div>}>
        <MermaidEditor value={value} onChange={onChange} />
      </Suspense>
    )
  }
  return (
    <ChatEditor
      value={value}
      onChange={onChange}
      font={font}
      onSubmit={onSubmit}
      placeholder={
        kata.type === 'review'
          ? 'Write your review. Focus on correctness — what would you ask to change before merging?'
          : undefined
      }
    />
  )
}

function ChatEditor({
  value,
  onChange,
  font,
  onSubmit,
  placeholder,
}: Readonly<{
  value: string
  onChange: (v: string) => void
  font: 'mono' | 'sans'
  onSubmit: () => void
  placeholder?: string
}>) {
  const wordCount = value.split(/\s+/).filter(Boolean).length

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="flex flex-col h-full bg-page">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Think out loud. The sensei reads everything.'}
        spellCheck={false}
        className={`flex-1 bg-page text-primary resize-none focus:outline-none px-6 py-5 placeholder:text-muted leading-relaxed ${
          font === 'mono' ? 'font-mono text-sm' : 'font-sans text-base'
        }`}
      />
      <div className="h-9 shrink-0 border-t border-border bg-surface/60 flex items-center justify-between px-4">
        <span className="font-mono text-xs tracking-[0.08em] uppercase text-muted">
          ⌘+Enter to submit
        </span>
        <span className="font-mono text-xs text-muted">{wordCount} words</span>
      </div>
    </div>
  )
}

function FontToggle({
  value,
  onChange,
  className = '',
}: Readonly<{
  value: 'mono' | 'sans'
  onChange: (v: 'mono' | 'sans') => void
  className?: string
}>) {
  return (
    <div
      className={`inline-flex items-center font-mono text-xs uppercase tracking-[0.08em] border border-border rounded-sm overflow-hidden ${className}`}
      role="group"
      aria-label="Response font"
    >
      <button
        type="button"
        onClick={() => onChange('mono')}
        aria-pressed={value === 'mono'}
        className={`px-2 py-0.5 transition-colors ${
          value === 'mono' ? 'bg-elevated text-primary' : 'text-muted hover:text-secondary'
        }`}
      >
        Mono
      </button>
      <button
        type="button"
        onClick={() => onChange('sans')}
        aria-pressed={value === 'sans'}
        className={`px-2 py-0.5 border-l border-border transition-colors ${
          value === 'sans' ? 'bg-elevated text-primary' : 'text-muted hover:text-secondary'
        }`}
      >
        Sans
      </button>
    </div>
  )
}

type Language = 'javascript' | 'typescript' | 'python' | 'sql'

function resolveLanguage(langs: string[]): Language {
  if (langs.includes('typescript')) return 'typescript'
  if (langs.includes('python')) return 'python'
  if (langs.includes('sql')) return 'sql'
  return 'javascript'
}

function fileExtension(lang: Language): string {
  return { javascript: 'js', typescript: 'ts', python: 'py', sql: 'sql' }[lang]
}

function languageLabel(lang: Language): string {
  return { javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python', sql: 'SQL' }[lang]
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const mq = globalThis.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return mobile
}
