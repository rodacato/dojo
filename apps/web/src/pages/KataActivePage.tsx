import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { api, ApiError, type SessionWithExercise } from '../lib/api'
import { TypeBadge, DifficultyBadge } from '../components/ui/Badge'
import { Timer } from '../components/ui/Timer'
import { CodeEditor } from '../components/ui/CodeEditor'
import type { ExerciseType } from '@dojo/shared'
const MermaidEditor = lazy(() => import('../components/ui/MermaidEditor').then(m => ({ default: m.MermaidEditor })))

const PREPARING_MESSAGES = [
  'The sensei is reading your brief...',
  'Setting the scene...',
  'Preparing the kata...',
  'The dojo is getting ready...',
  'Sharpening the problem...',
  'Almost there...',
]

export function KataActivePage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionWithExercise | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [preparingMsg, setPreparingMsg] = useState(PREPARING_MESSAGES[0]!)
  const [userResponse, setUserResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const msgIndex = useRef(0)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    async function load() {
      const s = await api.getSession(sessionId!)
      if (cancelled) return

      if (s.status === 'active') {
        setSession(s)
        return
      }
      if (s.status === 'preparing') {
        setPreparing(true)
        setTimeout(load, 2000)
        return
      }
      // completed or failed
      navigate(`/kata/${sessionId}/result`, { replace: true })
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

  if (preparing || !session) {
    return (
      <div className="h-screen bg-base flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-secondary text-sm animate-pulse">{preparingMsg}</p>
      </div>
    )
  }

  const { exercise } = session
  const isCode = exercise.type === 'code'
  const isWhiteboard = exercise.type === 'whiteboard'
  const orientation = isCode || isWhiteboard ? 'horizontal' : 'vertical'

  return (
    <div className="h-screen bg-base flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="grid grid-cols-3 items-center px-4 py-2 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <TypeBadge type={exercise.type as ExerciseType} />
          <DifficultyBadge difficulty={exercise.difficulty} />
          <span className="text-secondary text-sm hidden sm:inline">{exercise.title}</span>
        </div>
        <div className="text-center">
          <Timer
            durationMinutes={exercise.duration}
            startedAt={session.startedAt}
            onExpired={() => { setTimedOut(true); handleSubmit() }}
          />
        </div>
        <div className="text-right">
          <button
            onClick={handleSubmit}
            disabled={submitting || (!userResponse.trim() && !timedOut)}
            className={`px-4 py-1.5 font-mono text-xs rounded-sm transition-colors disabled:opacity-30 ${
              timedOut ? 'bg-danger text-primary' : 'bg-accent text-primary hover:bg-accent/90'
            }`}
          >
            {submitting ? '...' : timedOut ? 'Submit now' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Resizable split */}
      <PanelGroup orientation={orientation} className="flex-1 overflow-hidden">
        {/* Problem panel */}
        <Panel defaultSize={50} minSize={25}>
          <div className="h-full overflow-y-auto p-6 flex flex-col">
            <div className="flex-1">
              <KataBody body={session.body} />
            </div>
            <p className="text-muted/30 text-[10px] font-mono mt-6 pt-4 border-t border-border/20">
              Enter the dojo. Leave the AI outside.
            </p>
          </div>
        </Panel>

        <PanelResizeHandle className={`
          bg-border hover:bg-accent transition-colors duration-150
          ${orientation === 'horizontal' ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize'}
        `} />

        {/* Response panel */}
        <Panel defaultSize={50} minSize={20} className="flex flex-col">
          <div className="flex-1 overflow-hidden">
            {isCode ? (
              <CodeEditor
                value={userResponse}
                onChange={setUserResponse}
                language={resolveLanguage(exercise.language)}
                placeholder="Write your solution..."
              />
            ) : isWhiteboard ? (
              <Suspense fallback={<div className="p-4 text-muted font-mono text-sm">Loading editor...</div>}>
                <MermaidEditor value={userResponse} onChange={setUserResponse} />
              </Suspense>
            ) : (
              <ChatEditor value={userResponse} onChange={setUserResponse} />
            )}
          </div>
          {/* Submit via top bar button */}
        </Panel>
      </PanelGroup>
    </div>
  )
}

function KataBody({ body }: { body: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-primary font-mono text-lg font-semibold mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-primary font-mono text-[1rem] font-semibold mt-6 mb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-secondary font-mono text-sm font-semibold mt-4 mb-2 uppercase tracking-wider">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-secondary text-sm leading-relaxed mb-4">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="text-secondary text-sm leading-relaxed mb-4 space-y-1 list-disc list-inside">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="text-secondary text-sm leading-relaxed mb-4 space-y-1 list-decimal list-inside">{children}</ol>
        ),
        li: ({ children }) => <li className="text-secondary">{children}</li>,
        code: ({ children, className }) => {
          const isBlock = className?.startsWith('language-')
          if (isBlock) {
            return (
              <code className="block bg-elevated border border-border rounded-sm p-4 font-mono text-xs text-primary leading-relaxed overflow-x-auto whitespace-pre mb-4">
                {children}
              </code>
            )
          }
          return (
            <code className="bg-elevated text-accent font-mono text-xs px-1.5 py-0.5 rounded-sm">
              {children}
            </code>
          )
        },
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-accent pl-4 my-4 text-muted text-sm italic">
            {children}
          </blockquote>
        ),
        strong: ({ children }) => (
          <strong className="text-primary font-semibold">{children}</strong>
        ),
        hr: () => <hr className="border-border my-6" />,
      }}
    >
      {body}
    </ReactMarkdown>
  )
}

function ChatEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mono, setMono] = useState(false)
  const wordCount = value.split(/\s+/).filter(Boolean).length

  return (
    <div className="flex flex-col h-full p-4 gap-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start writing. Think out loud. The sensei reads everything."
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
