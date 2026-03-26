import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { WS_URL } from '../lib/config'
import { getToken, clearToken } from '../lib/auth-token'

export interface EvaluationResult {
  verdict: 'passed' | 'passed_with_notes' | 'needs_work'
  analysis: string
  topicsToReview: string[]
  followUpQuestion: string | null
  isFinalEvaluation: boolean
}

export interface ExecutionResult {
  stdout: string
  stderr: string
  exitCode: number
  timedOut: boolean
  executionTimeMs: number
}

export type EvalStreamState =
  | { status: 'idle' }
  | { status: 'connecting' }
  | { status: 'ready' }
  | { status: 'executing' }
  | { status: 'execution_done'; executionResult: ExecutionResult }
  | { status: 'streaming'; tokens: string; executionResult?: ExecutionResult }
  | { status: 'evaluation'; result: EvaluationResult; tokens: string; executionResult?: ExecutionResult }
  | { status: 'complete'; result: EvaluationResult; tokens: string; executionResult?: ExecutionResult }
  | { status: 'error'; code: string; message: string }

interface WsMessage {
  type: 'ready' | 'executing' | 'execution_result' | 'token' | 'evaluation' | 'complete' | 'error'
  chunk?: string
  result?: EvaluationResult | ExecutionResult
  code?: string
  message?: string
  isFinal?: boolean
}

export function useEvaluationStream(sessionId: string) {
  const [state, setState] = useState<EvalStreamState>({ status: 'idle' })
  const wsRef = useRef<WebSocket | null>(null)
  const latestResult = useRef<EvaluationResult | null>(null)
  const latestExecResult = useRef<ExecutionResult | undefined>(undefined)
  const navigate = useNavigate()

  const connect = useCallback(() => {
    setState({ status: 'connecting' })

    const token = getToken()
    const ws = new WebSocket(`${WS_URL}/ws/sessions/${sessionId}?token=${token}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string) as WsMessage

      switch (msg.type) {
        case 'ready':
          setState({ status: 'ready' })
          break

        case 'executing':
          setState({ status: 'executing' })
          break

        case 'execution_result':
          latestExecResult.current = msg.result as ExecutionResult
          setState({ status: 'execution_done', executionResult: msg.result as ExecutionResult })
          break

        case 'token':
          setState((prev) => ({
            status: 'streaming',
            tokens: (prev.status === 'streaming' ? prev.tokens : '') + (msg.chunk ?? ''),
            executionResult: latestExecResult.current,
          }))
          break

        case 'evaluation':
          // Store result for complete handler — React may batch these updates
          latestResult.current = msg.result as EvaluationResult
          setState((prev) => ({
            status: 'evaluation',
            result: msg.result as EvaluationResult,
            tokens: 'tokens' in prev ? prev.tokens : '',
            executionResult: latestExecResult.current,
          }))
          break

        case 'complete':
          setState((prev) => {
            const result = prev.status === 'evaluation' ? prev.result : latestResult.current
            if (!result) return prev
            const next: EvalStreamState = {
              status: 'complete',
              result,
              tokens: 'tokens' in prev ? prev.tokens : '',
              executionResult: latestExecResult.current,
            }
            if (result.isFinalEvaluation) {
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
        clearToken()
        window.location.href = '/?error=session_expired'
      }
    }
  }, [sessionId, navigate])

  const submit = useCallback((attemptId: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'submit', attemptId }))
    latestExecResult.current = undefined
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
