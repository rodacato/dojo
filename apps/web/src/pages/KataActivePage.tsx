import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError, type SessionWithExercise } from '../lib/api'
import { PageLoader } from '../components/PageLoader'
import { TypeBadge, DifficultyBadge } from '../components/ui/Badge'
import { Timer } from '../components/ui/Timer'
import { CodeEditor } from '../components/ui/CodeEditor'
import type { ExerciseType } from '@dojo/shared'

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
  const msgIndex = useRef(0)

  useEffect(() => {
    if (!sessionId) return

    function poll() {
      api.getSession(sessionId!).then((s) => {
        if (s.status === 'preparing') {
          setPreparing(true)
        } else if (s.status === 'active') {
          setPreparing(false)
          setSession(s)
        } else {
          navigate(`/kata/${sessionId}/result`, { replace: true })
        }
      })
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [sessionId, navigate])

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

  return (
    <div className="h-screen bg-base flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <TypeBadge type={exercise.type} />
          <DifficultyBadge difficulty={exercise.difficulty} />
          <span className="text-secondary text-sm">{exercise.title}</span>
        </div>
        <Timer
          durationMinutes={exercise.duration}
          startedAt={session.startedAt}
          onExpired={() => handleSubmit()}
        />
      </div>

      {/* Split view */}
      <div className={`flex flex-1 overflow-hidden ${isCode ? 'flex-row' : 'flex-col'}`}>
        {/* Left/Top: Problem context */}
        <div
          className={`overflow-y-auto p-4 border-border ${isCode ? 'w-1/2 border-r' : 'h-1/2 border-b'}`}
        >
          <pre className="whitespace-pre-wrap font-sans text-sm text-secondary leading-relaxed">
            {session.body}
          </pre>
        </div>

        {/* Right/Bottom: Response area */}
        <div className={`flex flex-col ${isCode ? 'w-1/2' : 'h-1/2'}`}>
          {isCode ? (
            <div className="flex-1">
              <CodeEditor
                value={userResponse}
                onChange={setUserResponse}
                language={resolveLanguage(exercise.language)}
                placeholder="Write your solution..."
              />
            </div>
          ) : (
            <div className="flex flex-col flex-1 p-4 gap-2">
              <textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Write your response..."
                spellCheck={false}
                className="flex-1 bg-surface border border-border rounded-sm p-3 text-primary text-sm font-sans resize-none focus:outline-none focus:border-accent transition-colors"
              />
              <div className="text-muted text-xs font-mono text-right">
                {userResponse.split(/\s+/).filter(Boolean).length} words
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="p-3 border-t border-border shrink-0">
            <button
              onClick={handleSubmit}
              disabled={!userResponse.trim() || submitting}
              className="w-full py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Submit →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function resolveLanguage(
  langs: string[],
): 'javascript' | 'typescript' | 'python' | 'sql' {
  if (langs.includes('typescript')) return 'typescript'
  if (langs.includes('python')) return 'python'
  if (langs.includes('sql')) return 'sql'
  return 'javascript'
}
