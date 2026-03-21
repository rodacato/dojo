import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export interface EvaluationResult {
  verdict: 'passed' | 'passed_with_notes' | 'needs_work'
  analysis: string
  topicsToReview: string[]
  followUpQuestion: string | null
  isFinalEvaluation: boolean
}

export type EvalStreamState =
  | { status: 'idle' }
  | { status: 'connecting' }
  | { status: 'ready' }
  | { status: 'streaming'; tokens: string }
  | { status: 'evaluation'; result: EvaluationResult; tokens: string }
  | { status: 'complete'; result: EvaluationResult; tokens: string }
  | { status: 'error'; code: string; message: string }

interface WsMessage {
  type: 'ready' | 'token' | 'evaluation' | 'complete' | 'error'
  chunk?: string
  result?: EvaluationResult
  code?: string
  message?: string
  isFinal?: boolean
}

export function useEvaluationStream(sessionId: string) {
  const [state, setState] = useState<EvalStreamState>({ status: 'idle' })
  const wsRef = useRef<WebSocket | null>(null)
  const navigate = useNavigate()

  const connect = useCallback(() => {
    setState({ status: 'connecting' })

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/sessions/${sessionId}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string) as WsMessage

      switch (msg.type) {
        case 'ready':
          setState({ status: 'ready' })
          break

        case 'token':
          setState((prev) => ({
            status: 'streaming',
            tokens: (prev.status === 'streaming' ? prev.tokens : '') + (msg.chunk ?? ''),
          }))
          break

        case 'evaluation':
          setState((prev) => ({
            status: 'evaluation',
            result: msg.result!,
            tokens: prev.status === 'streaming' ? prev.tokens : '',
          }))
          break

        case 'complete':
          setState((prev) => {
            if (prev.status !== 'evaluation') return prev
            const next: EvalStreamState = {
              status: 'complete',
              result: prev.result,
              tokens: prev.tokens,
            }
            if (prev.result.isFinalEvaluation) {
              setTimeout(() => navigate(`/kata/${sessionId}/result`), 1500)
            }
            return next
          })
          break

        case 'error':
          setState({ status: 'error', code: msg.code ?? 'UNKNOWN', message: msg.message ?? msg.code ?? 'Error' })
          break
      }
    }

    ws.onerror = () => setState({ status: 'error', code: 'WS_ERROR', message: 'Connection error' })
    ws.onclose = (e) => {
      if (e.code === 4001) {
        window.location.href = '/login'
      }
    }
  }, [sessionId, navigate])

  const submit = useCallback((attemptId: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'submit', attemptId }))
    setState({ status: 'streaming', tokens: '' })
  }, [])

  const reconnect = useCallback(
    (attemptId: string) => {
      wsRef.current?.send(JSON.stringify({ type: 'reconnect', attemptId }))
      setState({ status: 'streaming', tokens: '' })
    },
    [],
  )

  useEffect(() => {
    return () => wsRef.current?.close()
  }, [])

  return { state, connect, submit, reconnect }
}
