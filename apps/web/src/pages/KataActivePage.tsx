import { Suspense, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { api, ApiError, type SessionWithKata } from '../lib/api'
import { TypeBadge, DifficultyBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { EnsoLoader } from '../components/ui/EnsoLoader'
import { Timer } from '../components/ui/Timer'
import { CodeEditor } from '../components/ui/CodeEditor'
import { CodeLine } from '../components/ui/CodeLine'
import { KataBody } from '../components/ui/KataBody'
import { ErrorState } from '../components/ui/ErrorState'
import { lazyWithRetry } from '../lib/lazyWithRetry'
import { useIsMobile } from '../hooks/useIsMobile'
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

const draftKey = (sessionId: string) => `dojo-draft-${sessionId}`
const pointKey = (sessionId: string) => `dojo-point-${sessionId}`

function readStored(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // storage unavailable (private mode, quota): the draft just isn't kept
  }
}

export function KataActivePage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [session, setSession] = useState<SessionWithKata | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [preparingMsg, setPreparingMsg] = useState(PREPARING_MESSAGES[0]!)
  const [prepareSlow, setPrepareSlow] = useState(false)
  const [userResponse, setUserResponse] = useState('')
  const [pointedLine, setPointedLine] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitFailed, setSubmitFailed] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [prepareError, setPrepareError] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [responseFont, setResponseFont] = useState<'mono' | 'sans'>('sans')
  const msgIndex = useRef(0)
  const pollCount = useRef(0)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    function applyActiveSession(s: SessionWithKata): void {
      setPreparing(false)
      setSession(s)
      const isPoint = s.kata.answerShape === 'point'
      const draft = readStored(draftKey(s.id))
      if (draft) {
        setUserResponse(draft)
      } else if (s.kata.starterCode && !isPoint) {
        setUserResponse(s.kata.starterCode)
      }
      const storedLine = Number(readStored(pointKey(s.id)))
      if (isPoint && storedLine > 0) setPointedLine(storedLine)
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

  useEffect(() => {
    if (!session) return
    writeStored(draftKey(session.id), userResponse)
  }, [session, userResponse])

  useEffect(() => {
    if (!session || pointedLine === null) return
    writeStored(pointKey(session.id), String(pointedLine))
  }, [session, pointedLine])

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

  const isPoint = session?.kata.answerShape === 'point'
  const answerReady = userResponse.trim().length > 0 && (!isPoint || pointedLine !== null)
  const expiredEmpty = timedOut && !answerReady
  const submitLabel = timedOut ? 'Submit now' : 'Submit'

  async function handleSubmit() {
    if (!session || !sessionId || !answerReady || submitting) return
    setSubmitting(true)
    setSubmitFailed(false)
    try {
      const { attemptId } = isPoint && pointedLine !== null
        ? await api.submitPointAttempt(sessionId, pointedLine, userResponse)
        : await api.submitAttempt(sessionId, userResponse)
      sessionStorage.setItem(`dojo-attempt-${sessionId}`, attemptId)
      navigate(`/katas/${sessionId}/eval`)
    } catch (err) {
      if (err instanceof ApiError && (err.status === 408 || err.status === 409)) {
        navigate(`/katas/${sessionId}/result`)
      } else {
        setSubmitting(false)
        setSubmitFailed(true)
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
      <div className="h-dvh bg-page flex flex-col items-center justify-center gap-4 px-4">
        <EnsoLoader size={32} label="Preparing your kata" />
        <p className="font-mono text-secondary text-sm animate-pulse">{preparingMsg}</p>
        {prepareSlow && (
          <p className="font-mono text-secondary text-sm text-center max-w-sm">
            This is taking a bit longer than usual. Hang on — if it doesn't resolve soon you can go back and retry.
          </p>
        )}
        {prepareSlow && (
          <Button variant="ghost" size="md" onClick={() => navigate('/katas')}>
            Back to katas
          </Button>
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
    <div className="h-dvh bg-page flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-14 shrink-0 border-b border-border bg-surface/90 backdrop-blur-md grid grid-cols-3 items-center px-4">
        <div className="flex items-center gap-3 max-md:gap-2 min-w-0">
          <span className="font-mono font-bold text-accent text-base inline-flex items-center select-none">
            dojo<span className="animate-cursor ml-0.5" aria-hidden>_</span>
          </span>
          <Button variant="subtle" size="sm" className="max-md:h-11" onClick={() => setLeaving(true)}>
            Leave
          </Button>
          <span className="h-4 w-px bg-border hidden sm:block" />
          <span className="font-mono text-sm font-medium tracking-wider text-success-text border border-success/40 bg-success/10 px-1.5 py-0.5 rounded-sm hidden sm:inline">
            READY
          </span>
          <span className="font-mono text-sm text-secondary truncate hidden md:inline">
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
            variant="primary"
            size="sm"
            className="max-md:h-11"
            onClick={expiredEmpty ? () => navigate(`/katas/${sessionId}/result`) : handleSubmit}
            loading={submitting}
            disabled={submitting || (!answerReady && !timedOut)}
          >
            {expiredEmpty ? 'View result' : submitLabel}
          </Button>
        </div>
      </header>

      {submitFailed && (
        <p role="alert" className="shrink-0 border-b border-border bg-surface px-4 py-2 text-danger-text text-sm text-center">
          Your answer didn't go through. It's still here. Try again.
        </p>
      )}

      {isPoint && isMobile ? (
        <div className="flex-1 overflow-y-auto">
          <section className="bg-surface border-b border-border p-4">
            <ProblemContent session={session} compact />
            <PointInstruction pointedLine={pointedLine} why={userResponse} />
          </section>
          <PointAnswer
            kata={kata}
            pointedLine={pointedLine}
            onPoint={setPointedLine}
            why={userResponse}
            onWhy={setUserResponse}
            onSubmit={handleSubmit}
          />
        </div>
      ) : (
        <PanelGroup orientation={orientation} className="flex-1 overflow-hidden">
          {/* Problem panel */}
          <Panel defaultSize={isCode ? 40 : 50} minSize={25}>
            <div className="h-full flex flex-col bg-surface">
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <ProblemContent session={session} />
                {isPoint && <PointInstruction pointedLine={pointedLine} why={userResponse} />}
              </div>
              <div className="px-6 py-3 border-t border-border bg-page/50 shrink-0">
                <p className="font-mono text-xs tracking-[0.08em] uppercase text-secondary text-center">
                  Enter the dojo. Leave the AI outside.
                </p>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className={`
            bg-border hover:bg-accent transition-colors duration-150
            ${orientation === 'horizontal' ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize'}
          `} />

          {isPoint ? (
            <Panel defaultSize={50} minSize={20}>
              <PointAnswer
                kata={kata}
                pointedLine={pointedLine}
                onPoint={setPointedLine}
                why={userResponse}
                onWhy={setUserResponse}
                onSubmit={handleSubmit}
              />
            </Panel>
          ) : (
            <ResponsePanel
              kata={kata}
              value={userResponse}
              onChange={setUserResponse}
              font={responseFont}
              onFontChange={setResponseFont}
              onSubmit={handleSubmit}
            />
          )}
        </PanelGroup>
      )}

      <ConfirmModal
        open={leaving}
        onCancel={() => setLeaving(false)}
        eyebrow="Leave kata?"
        tone="amber"
        title="Leave this kata?"
        cancelLabel="Stay"
        primaryVariant="primary"
        primaryLabel="Leave"
        onConfirm={() => navigate('/dashboard')}
      >
        <p>The timer keeps running. You can resume from the dashboard until time runs out.</p>
        <p>Your unsent answer is kept in this browser tab.</p>
      </ConfirmModal>
    </div>
  )
}

function ProblemContent({ session, compact = false }: Readonly<{ session: SessionWithKata; compact?: boolean }>) {
  const { kata } = session
  return (
    <>
      <div className="mb-4">
        {!compact && (
          <span className="inline-block font-mono text-xs tracking-[0.08em] uppercase text-secondary border border-border bg-elevated px-2 py-1 rounded-sm mb-3">
            [{session.ownerRole.toUpperCase()}]
          </span>
        )}
        <h1
          className={`text-primary font-bold leading-tight tracking-tight mb-3 ${
            compact ? 'text-2xl' : 'text-3xl md:text-4xl'
          }`}
        >
          {kata.title}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={kata.type} />
          <DifficultyBadge difficulty={kata.difficulty} />
          {kata.type === 'whiteboard' && kata.tags.length > 0 && kata.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-warning-text text-sm font-mono px-2 py-0.5 bg-warning/10 border border-warning/30 rounded-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
      <KataBody body={session.body} />
    </>
  )
}

function PointInstruction({ pointedLine, why }: Readonly<{ pointedLine: number | null; why: string }>) {
  let text = 'Tap the line with the bug.'
  if (pointedLine !== null) {
    text = why.trim()
      ? `Line ${pointedLine} selected. Tap another line to change it.`
      : `Line ${pointedLine} selected. Now say why it's wrong.`
  }
  return (
    <p className="mt-4 font-sans text-sm font-medium text-primary" aria-live="polite">
      {text}
    </p>
  )
}

function toCodeLines(code: string): string[] {
  return code.replace(/\n+$/, '').split('\n')
}

function PointAnswer({
  kata,
  pointedLine,
  onPoint,
  why,
  onWhy,
  onSubmit,
}: Readonly<{
  kata: SessionWithKata['kata']
  pointedLine: number | null
  onPoint: (line: number) => void
  why: string
  onWhy: (v: string) => void
  onSubmit: () => void
}>) {
  const language = resolveLanguage(kata.language)

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="flex flex-col bg-page md:h-full md:overflow-y-auto">
      <div className="h-9 shrink-0 border-b border-border bg-surface flex items-center px-4 gap-3">
        <span className="font-mono text-sm text-secondary">solution.{fileExtension(language)}</span>
        <span className="h-3 w-px bg-border" />
        <span className="font-mono text-sm text-secondary">{languageLabel(language)}</span>
      </div>
      <div role="group" aria-label="Code lines">
        {toCodeLines(kata.starterCode ?? '').map((code, i) => (
          <CodeLine
            key={i}
            number={i + 1}
            code={code}
            selected={pointedLine === i + 1}
            onSelect={() => onPoint(i + 1)}
          />
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-2 p-4 bg-surface border-t border-border">
        <label htmlFor="point-why" className="font-mono text-xs tracking-[0.08em] uppercase text-secondary">
          Why is it wrong?
        </label>
        <textarea
          id="point-why"
          value={why}
          onChange={(e) => onWhy(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Think out loud. The sensei reads everything."
          rows={4}
          className="flex-1 min-h-28 bg-page text-primary font-sans text-base leading-relaxed border border-border rounded-sm px-3 py-2.5 resize-none placeholder:text-muted focus-visible:outline-none focus-visible:border-accent"
        />
      </div>
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
  const nonCodeLabel = isWhiteboard ? 'Mermaid' : 'Prose'
  const editorLabel = isCode ? languageLabel(language) : nonCodeLabel

  return (
    <Panel defaultSize={isCode ? 60 : 50} minSize={20} className="flex flex-col">
      <div className="h-9 shrink-0 border-b border-border bg-surface flex items-center px-4 gap-3">
        {isCode || isWhiteboard ? (
          <>
            <span className="font-mono text-sm text-primary">{filename}</span>
            <span className="h-3 w-px bg-border" />
            <span className="font-mono text-sm text-secondary">{editorLabel}</span>
          </>
        ) : (
          <>
            <span className="font-mono text-xs tracking-[0.08em] uppercase text-secondary">
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
      <Suspense fallback={<div className="p-4 text-secondary font-mono text-sm">Loading editor...</div>}>
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
        className={`flex-1 bg-page text-primary resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent px-6 py-5 placeholder:text-muted leading-relaxed ${
          font === 'mono' ? 'font-mono text-sm' : 'font-sans text-base'
        }`}
      />
      <div className="h-9 shrink-0 border-t border-border bg-surface/60 flex items-center justify-between px-4">
        <span className="font-mono text-xs tracking-[0.08em] uppercase text-secondary">
          ⌘+Enter to submit
        </span>
        <span className="font-mono text-sm text-secondary">{wordCount} words</span>
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
          value === 'mono' ? 'bg-elevated text-primary' : 'text-secondary hover:text-primary'
        }`}
      >
        Mono
      </button>
      <button
        type="button"
        onClick={() => onChange('sans')}
        aria-pressed={value === 'sans'}
        className={`px-2 py-0.5 border-l border-border transition-colors ${
          value === 'sans' ? 'bg-elevated text-primary' : 'text-secondary hover:text-primary'
        }`}
      >
        Sans
      </button>
    </div>
  )
}

const LANGUAGES = {
  javascript: { extension: 'js', label: 'JavaScript' },
  typescript: { extension: 'ts', label: 'TypeScript' },
  python: { extension: 'py', label: 'Python' },
  sql: { extension: 'sql', label: 'SQL' },
  ruby: { extension: 'rb', label: 'Ruby' },
  go: { extension: 'go', label: 'Go' },
  rust: { extension: 'rs', label: 'Rust' },
}

type Language = keyof typeof LANGUAGES

function isLanguage(lang: string): lang is Language {
  return Object.keys(LANGUAGES).includes(lang)
}

// The first listed language is the one the sandbox runs (ws-handlers runTestCode).
function resolveLanguage(langs: string[]): Language {
  return langs.find(isLanguage) ?? 'javascript'
}

function fileExtension(lang: Language): string {
  return LANGUAGES[lang].extension
}

function languageLabel(lang: Language): string {
  return LANGUAGES[lang].label
}
