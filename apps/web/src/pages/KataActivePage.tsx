import { Suspense, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'
import type { SessionWithKata } from '../lib/api'
import { TypeBadge, DifficultyBadge } from '../components/ui/Badge'
import { ActiveKataActions, ANSWER_HINT_ID } from '../components/kata/ActiveKataActions'
import { Button, buttonClasses } from '../components/ui/Button'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { FocusedHeader } from '../components/layout/FocusedHeader'
import { Timer } from '../components/ui/Timer'
import { CodeEditor } from '../components/ui/CodeEditor'
import { CodeLine } from '../components/ui/CodeLine'
import { KataBody } from '../components/ui/KataBody'
import { Skeleton } from '../components/ui/SkeletonLoader'
import { lazyWithRetry } from '../lib/lazyWithRetry'
import { useIsMobile } from '../hooks/useIsMobile'
import { useKataSession } from '../hooks/useKataSession'
const MermaidEditor = lazyWithRetry(() => import('../components/ui/MermaidEditor').then(m => ({ default: m.MermaidEditor })))

export function KataActivePage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const {
    session,
    preparing,
    preparingMsg,
    prepareSlow,
    prepareError,
    userResponse,
    changeResponse,
    pointedLine,
    pointAtLine,
    submitting,
    submitFailed,
    online,
    draftKept,
    lastSeconds,
    timedOut,
    answerReady,
    expiredEmpty,
    hasDraft,
    handleSubmit,
    expire,
  } = useKataSession(sessionId)
  const [leaving, setLeaving] = useState(false)
  const [responseFont, setResponseFont] = useState<'mono' | 'sans'>('sans')

  if (prepareError || preparing || !session) {
    return (
      <Preparation
        failed={prepareError}
        message={preparingMsg}
        slow={prepareSlow}
        onBack={() => navigate('/dashboard')}
      />
    )
  }

  const { kata } = session
  const isPoint = kata.answerShape === 'point'
  const isCode = kata.type === 'code'
  // All formats land side-by-side on desktop — the chat panel mirrors the
  // code/whiteboard shell so the redesign reads as one product.
  const orientation = isMobile ? 'vertical' : 'horizontal'
  const showFailure = submitFailed && online && !submitting

  return (
    <div className="h-dvh bg-page flex flex-col overflow-hidden">
      <FocusedHeader
        leading={
          <Button
            variant="subtle"
            size="lg"
            className="px-2 md:px-3"
            disabled={submitting}
            onClick={timedOut ? () => navigate('/dashboard') : () => setLeaving(true)}
          >
            {timedOut ? 'Back' : 'Leave'}
          </Button>
        }
        center={
          <ClockSlot>
            <Timer durationMinutes={kata.duration} startedAt={session.startedAt} onExpired={expire} size="sm" />
          </ClockSlot>
        }
      />

      <div role="status">
        {!online && (
          <p className="border-b border-border bg-surface px-4 md:px-8 py-2 text-sm text-primary">
            Offline. Keep writing. The timer keeps running.
          </p>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {lastSeconds && !timedOut ? 'Less than thirty seconds remain.' : ''}
      </p>

      {isPoint && isMobile ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <section className="bg-surface border-b border-border p-4">
            <PointProblem session={session} />
          </section>
          <PointAnswer
            kata={kata}
            pointedLine={pointedLine}
            onPoint={pointAtLine}
            why={userResponse}
            onWhy={changeResponse}
            onSubmit={handleSubmit}
            submitting={submitting}
            expired={timedOut}
          />
        </div>
      ) : (
        <PanelGroup orientation={orientation} className="flex-1 min-h-0 overflow-hidden">
          {/* Problem panel */}
          <Panel defaultSize={isCode || isPoint ? 40 : 50} minSize={25}>
            <div className="h-full flex flex-col bg-surface">
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {isPoint ? <PointProblem session={session} /> : <ProblemContent session={session} />}
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
            <Panel defaultSize={60} minSize={20}>
              <PointAnswer
                kata={kata}
                pointedLine={pointedLine}
                onPoint={pointAtLine}
                why={userResponse}
                onWhy={changeResponse}
                onSubmit={handleSubmit}
                submitting={submitting}
                expired={timedOut}
              />
            </Panel>
          ) : (
            <ResponsePanel
              kata={kata}
              value={userResponse}
              onChange={changeResponse}
              font={responseFont}
              onFontChange={setResponseFont}
              onSubmit={handleSubmit}
            />
          )}
        </PanelGroup>
      )}

      <ActiveKataActions
        hint={answerHint({
          submitting,
          expired: timedOut,
          expiredEmpty,
          online,
          failed: showFailure,
          hasDraft,
          isPoint,
          pointedLine,
          why: userResponse,
        })}
        failed={showFailure}
        note={draftNote(draftKept, isPoint && online && !timedOut)}
        label={actionLabel(submitting, timedOut, expiredEmpty)}
        loading={submitting}
        disabled={submitting || (!answerReady && !timedOut) || (!online && !expiredEmpty)}
        onAction={expiredEmpty ? () => navigate(`/katas/${sessionId}/result`) : handleSubmit}
      />

      <ConfirmModal
        open={leaving && !timedOut}
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
        <p>
          {draftKept
            ? 'Your unsent answer is kept in this browser tab.'
            : 'This browser could not keep the draft. Stay to copy your answer before leaving.'}
        </p>
      </ConfirmModal>
    </div>
  )
}

function actionLabel(submitting: boolean, expired: boolean, expiredEmpty: boolean): string {
  if (submitting) return 'Submitting…'
  if (expiredEmpty) return 'View result'
  return expired ? 'Submit now' : 'Submit'
}

function draftNote(draftKept: boolean, shortcutWorks: boolean): string {
  if (!draftKept) return 'Keep this tab open · local storage unavailable'
  return shortcutWorks ? 'Draft kept in this tab · Ctrl/⌘ + Enter to submit' : 'Draft kept in this tab'
}

function answerHint({
  submitting,
  expired,
  expiredEmpty,
  online,
  failed,
  hasDraft,
  isPoint,
  pointedLine,
  why,
}: Readonly<{
  submitting: boolean
  expired: boolean
  expiredEmpty: boolean
  online: boolean
  failed: boolean
  hasDraft: boolean
  isPoint: boolean
  pointedLine: number | null
  why: string
}>): string {
  if (submitting) return 'Submitting…'
  if (expiredEmpty) return hasDraft ? 'Time expired. Your draft is here.' : 'Time expired. No answer was sent.'
  if (!online) return hasDraft ? 'Reconnect to submit. Your answer is still here.' : 'Reconnect to submit.'
  if (failed) return "Your answer didn't go through. It's still here. Try again."
  if (expired) return 'Time expired. Your draft is here.'
  if (!isPoint) return ''
  if (pointedLine === null) return why.trim() ? 'Choose a line to continue.' : 'Tap the line with the bug.'
  return why.trim()
    ? `Line ${pointedLine} selected. Tap another line to change it.`
    : `Line ${pointedLine} selected. Now say why it's wrong.`
}

function ClockSlot({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="paper-eyebrow leading-none">Time left</span>
      {children}
    </div>
  )
}

function Preparation({
  failed,
  message,
  slow,
  onBack,
}: Readonly<{ failed: boolean; message: string; slow: boolean; onBack: () => void }>) {
  return (
    <div className="h-dvh bg-page flex flex-col overflow-hidden">
      <FocusedHeader
        leading={
          <Button variant="subtle" size="lg" className="px-2 md:px-3" onClick={onBack}>
            Back
          </Button>
        }
        center={
          <ClockSlot>
            <span className="font-mono font-bold text-lg leading-none text-secondary">—</span>
          </ClockSlot>
        }
      />
      <main className="flex-1 min-h-0 overflow-y-auto flex items-center px-6 py-6 md:px-12 md:py-12">
        <div className="w-full max-w-165 mx-auto">
          <p className="paper-eyebrow">Dojo / kata</p>
          {failed ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-primary mt-4 mb-6">
                Something went wrong preparing your kata.
              </h1>
              <p className="paper-body">Return to your daily practice, or choose an optional kata.</p>
              <div className="flex max-md:flex-col md:items-center gap-2 md:gap-6 mt-6">
                <Button variant="primary" size="lg" onClick={onBack}>
                  Back to dashboard
                </Button>
                <Link to="/katas" className={`${buttonClasses({ variant: 'link', size: 'lg' })} max-md:w-full`}>
                  Start a new kata
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-primary mt-4 mb-6">Preparing your kata</h1>
              <p className="paper-body" role="status">{message}</p>
              <div className="grid gap-4 my-8 max-w-110" aria-hidden>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-3 w-full" />
              </div>
              {slow && (
                <>
                  <p className="paper-body mt-6">
                    This is taking a bit longer than usual. Hang on — if it doesn't resolve soon you can go back and retry.
                  </p>
                  <Button variant="ghost" size="lg" className="mt-6 max-md:w-full" onClick={onBack}>
                    Back to dashboard
                  </Button>
                </>
              )}
              <p className="paper-note mt-6">The clock appears when the kata is ready.</p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function ProblemContent({ session }: Readonly<{ session: SessionWithKata }>) {
  const { kata } = session
  return (
    <>
      <div className="mb-4">
        <span className="inline-block font-mono text-xs tracking-[0.08em] uppercase text-secondary border border-border bg-elevated px-2 py-1 rounded-sm mb-3">
          [{session.ownerRole.toUpperCase()}]
        </span>
        <h1 className="text-primary font-bold leading-tight tracking-tight mb-3 text-2xl">
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

function PointProblem({ session }: Readonly<{ session: SessionWithKata }>) {
  const { kata } = session
  return (
    <>
      <p className="paper-eyebrow">Active kata · {kata.duration} min</p>
      <h1 className="text-primary text-2xl font-bold tracking-tight mt-3 mb-3">{kata.title}</h1>
      <p className="font-mono text-xs text-secondary mb-4 md:mb-6">
        {kata.type} · {kata.difficulty} · {languageLabel(resolveLanguage(kata.language))}
      </p>
      <KataBody body={session.body} />
    </>
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
  submitting,
  expired,
}: Readonly<{
  kata: SessionWithKata['kata']
  pointedLine: number | null
  onPoint: (line: number) => void
  why: string
  onWhy: (v: string) => void
  onSubmit: () => void
  submitting: boolean
  expired: boolean
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
      <div className="min-h-11 shrink-0 border-b border-border bg-surface flex items-center justify-between gap-4 px-4 md:px-6 font-mono text-xs text-secondary">
        <span>solution.{fileExtension(language)}</span>
        <span>Read only</span>
      </div>
      <div role="group" aria-label="Code lines">
        {toCodeLines(kata.starterCode ?? '').map((code, i) => (
          <CodeLine
            key={i}
            number={i + 1}
            code={code}
            selected={pointedLine === i + 1}
            onSelect={() => onPoint(i + 1)}
            disabled={submitting || expired}
          />
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-2 p-4 md:p-6 bg-surface border-t border-border">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <label htmlFor="point-why" className="font-mono text-xs tracking-[0.08em] uppercase text-primary">
            Why is it wrong?
          </label>
          <span className="paper-note">{pointedLine === null ? 'No line selected' : `Line ${pointedLine}`}</span>
        </div>
        <textarea
          id="point-why"
          value={why}
          onChange={(e) => onWhy(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Think out loud. The sensei reads everything."
          rows={4}
          disabled={submitting}
          readOnly={expired}
          aria-describedby={ANSWER_HINT_ID}
          className="flex-1 min-h-36 bg-page text-primary font-sans text-[16px] leading-relaxed border border-border rounded-sm px-3 py-2.5 resize-y placeholder:text-muted disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <p className="paper-note">Two or three sentences. Explain your reasoning.</p>
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
