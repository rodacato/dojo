import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError, type SessionWithKata } from '../lib/api'

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
const LAST_SECONDS_MS = 30_000

const draftKey = (sessionId: string) => `dojo-draft-${sessionId}`
const pointKey = (sessionId: string) => `dojo-point-${sessionId}`

function readStored(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function useKataSession(sessionId: string | undefined) {
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionWithKata | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [preparingMsg, setPreparingMsg] = useState(PREPARING_MESSAGES[0]!)
  const [prepareSlow, setPrepareSlow] = useState(false)
  const [userResponse, setUserResponse] = useState('')
  const [pointedLine, setPointedLine] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitFailed, setSubmitFailed] = useState(false)
  const [draftKept, setDraftKept] = useState(true)
  const [lastSeconds, setLastSeconds] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [prepareError, setPrepareError] = useState(false)
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
    setDraftKept(writeStored(draftKey(session.id), userResponse))
  }, [session, userResponse])

  useEffect(() => {
    if (!session || pointedLine === null) return
    setDraftKept(writeStored(pointKey(session.id), String(pointedLine)))
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

  useEffect(() => {
    if (!session) return
    const deadline = new Date(session.startedAt).getTime() + session.kata.duration * 60_000
    const timeout = setTimeout(() => setLastSeconds(true), deadline - LAST_SECONDS_MS - Date.now())
    return () => clearTimeout(timeout)
  }, [session])

  const isPoint = session?.kata.answerShape === 'point'
  const answerReady = userResponse.trim().length > 0 && (!isPoint || pointedLine !== null)
  const expiredEmpty = timedOut && !answerReady
  const hasDraft = userResponse.trim().length > 0 || pointedLine !== null

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

  function changeResponse(value: string) {
    setSubmitFailed(false)
    setUserResponse(value)
  }

  function pointAtLine(line: number) {
    setSubmitFailed(false)
    setPointedLine(line)
  }

  function expire() {
    setTimedOut(true)
    handleSubmit()
  }

  return {
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
    draftKept,
    lastSeconds,
    timedOut,
    answerReady,
    expiredEmpty,
    hasDraft,
    handleSubmit,
    expire,
  }
}
