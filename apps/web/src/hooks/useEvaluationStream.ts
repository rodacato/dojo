import { useEffect, useRef, useState, useCallback } from 'react'
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
  | { status: 'error'; code: string; message: string; tokens: string }

interface WsMessage {
  type: 'ready' | 'executing' | 'execution_result' | 'token' | 'evaluation' | 'complete' | 'error'
  content?: string
  result?: EvaluationResult | ExecutionResult
  code?: string
  message?: string
  isFinal?: boolean
}

function partialTokens(state: EvalStreamState): string {
  return 'tokens' in state ? state.tokens : ''
}

export function useEvaluationStream(sessionId: string) {
  const [state, setState] = useState<EvalStreamState>({ status: 'idle' })
  const wsRef = useRef<WebSocket | null>(null)
  const latestResult = useRef<EvaluationResult | null>(null)
  const latestExecResult = useRef<ExecutionResult | undefined>(undefined)

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
            tokens: (prev.status === 'streaming' ? prev.tokens : '') + (msg.content ?? ''),
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
            return {
              status: 'complete',
              result,
              tokens: 'tokens' in prev ? prev.tokens : '',
              executionResult: latestExecResult.current,
            }
          })
          break

        case 'error':
          setState((prev) => ({
            status: 'error',
            code: msg.code ?? 'UNKNOWN',
            message: msg.message ?? msg.code ?? 'Error',
            tokens: partialTokens(prev),
          }))
          break
      }
    }

    ws.onerror = () =>
      setState((prev) => ({
        status: 'error',
        code: 'WS_ERROR',
        message: 'Connection error',
        tokens: partialTokens(prev),
      }))
    ws.onclose = (e) => {
      if (e.code === 4001) {
        clearToken()
        globalThis.location.href = '/?error=session_expired'
        return
      }
      // 1000 is a clean close initiated by either peer after we're done (complete/error).
      // Anything else while we still expected tokens is an unexpected drop — surface it.
      if (e.code === 1000) return
      setState((prev) => {
        if (prev.status === 'complete' || prev.status === 'error') return prev
        return {
          status: 'error',
          code: `WS_CLOSED_${e.code}`,
          message: 'Connection lost before the evaluation finished. You can reconnect.',
          tokens: partialTokens(prev),
        }
      })
    }
  }, [sessionId])

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
    return () => {
      wsRef.current?.close()
    }
  }, [])

  return { state, connect, submit, reconnect }
}
