import { useCases, executionQueue } from '../../container'
import { pendingAttempts } from './pending-attempts'
import { SessionId } from '../../../domain/shared/types'
import type { EvaluationResult } from '../../../domain/practice/values'
import type { ExecutionResult } from '../../../domain/practice/ports'
import { db } from '../../persistence/drizzle/client'
import { attempts as attemptsTable } from '../../persistence/drizzle/schema'

// ── Minimal WebSocket interface used by handlers ──────────────────────────────
export interface WSInstance {
  send: (data: string) => void
  close: (code?: number, reason?: string) => void
}

// ── Message types ─────────────────────────────────────────────────────────────
export type ClientMessage = { type: 'submit'; attemptId: string } | { type: 'reconnect'; attemptId: string }

export type ServerMessage =
  | { type: 'ready' }
  | { type: 'executing' }
  | { type: 'execution_result'; result: ExecutionResult }
  | { type: 'token'; content: string }
  | { type: 'evaluation'; result: EvaluationResult }
  | { type: 'complete'; isFinal: boolean }
  | { type: 'error'; code: string }

// ── Reconnect cache ───────────────────────────────────────────────────────────
export interface StreamCache {
  tokens: string[]
  result: EvaluationResult | null
  complete: boolean
  isFinal: boolean
}
export const streamCache = new Map<string, StreamCache>()

// ── Concurrent connection limit ───────────────────────────────────────────────
export const activeConnections = new Map<string, WSInstance>()

// ── Helpers ───────────────────────────────────────────────────────────────────
export function send(ws: WSInstance, msg: ServerMessage): void {
  ws.send(JSON.stringify(msg))
}

// ── Handle submit ─────────────────────────────────────────────────────────────
export async function handleSubmit(ws: WSInstance, attemptId: string, sessionId: string, _userId: string) {
  const pending = pendingAttempts.get(attemptId)
  if (!pending) {
    send(ws, { type: 'error', code: 'ATTEMPT_NOT_FOUND' })
    return
  }

  // Refresh session to get current attempt count
  const currentSession = await useCases.getSession.execute(SessionId(sessionId))
  if (!currentSession) {
    send(ws, { type: 'error', code: 'SESSION_NOT_FOUND' })
    return
  }
  if (currentSession.attempts.length >= 2) {
    send(ws, { type: 'error', code: 'ATTEMPT_LIMIT_REACHED' })
    return
  }

  // Get ownerRole/ownerContext from the exercise variation
  const exercise = await useCases.getExerciseById.execute(currentSession.exerciseId)
  const variation = exercise?.variations.find((v) => v.id === currentSession.variationId)

  // Initialize stream cache for reconnect support (ADR-009)
  const cache: StreamCache = { tokens: [], result: null, complete: false, isFinal: false }
  streamCache.set(attemptId, cache)

  pendingAttempts.delete(attemptId)

  // ── Code execution (if exercise has testCode) ──────────────────────────────
  let executionContext: string | undefined
  const testCode = exercise?.testCode
  if (testCode && pending.userResponse.trim()) {
    send(ws, { type: 'executing' })
    try {
      const execResult = await executionQueue.enqueue({
        language: exercise?.languages?.[0] ?? 'javascript',
        code: pending.userResponse,
        testCode,
      })
      send(ws, { type: 'execution_result', result: execResult })

      // Build context string for the sensei
      if (execResult.exitCode === 0) {
        executionContext = `## Test Results\nAll tests passed.\nExit code: 0 | Execution time: ${execResult.executionTimeMs}ms\n\nFocus your evaluation on code quality, not correctness.`
      } else if (execResult.timedOut) {
        executionContext = `## Test Results\nExecution timed out.\n\nEvaluate the attempt and consider why it might hang or loop infinitely.`
      } else if (execResult.stderr && !execResult.stdout) {
        executionContext = `## Test Results\nCode did not compile or crashed.\nError: ${execResult.stderr.slice(0, 500)}\n\nEvaluate the attempt and the error.`
      } else {
        executionContext = `## Test Results\nSome tests failed.\nstdout: ${execResult.stdout.slice(0, 500)}\nstderr: ${execResult.stderr.slice(0, 300)}\nExit code: ${execResult.exitCode} | Execution time: ${execResult.executionTimeMs}ms\n\nFocus on WHY the failing tests fail.`
      }
    } catch (err) {
      console.warn('Code execution failed, continuing without results:', err)
    }
  }

  try {
    for await (const token of useCases.submitAttempt.execute({
      sessionId: SessionId(pending.sessionId),
      userResponse: pending.userResponse,
      ownerRole: variation?.ownerRole ?? '',
      ownerContext: variation?.ownerContext ?? '',
      executionContext,
      category: exercise?.category,
    })) {
      if (token.chunk) {
        send(ws, { type: 'token', content: token.chunk })
        cache.tokens.push(token.chunk)
      }

      if (token.isFinal && token.result) {
        cache.result = token.result
        cache.complete = true
        cache.isFinal = token.result.isFinalEvaluation

        send(ws, { type: 'evaluation', result: token.result })
        send(ws, { type: 'complete', isFinal: cache.isFinal })

        if (cache.isFinal) ws.close(1000, 'Evaluation complete')
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown LLM error'
    const partialTokens = cache.tokens.join('')
    console.error('LLM stream error for session', pending.sessionId, ':', errorMsg)

    // Persist the attempt with partial stream so retry can find it
    await db
      .insert(attemptsTable)
      .values({
        id: attemptId,
        sessionId: pending.sessionId,
        userResponse: pending.userResponse,
        llmResponse: partialTokens || JSON.stringify({ error: errorMsg }),
        isFinalEvaluation: false,
        submittedAt: new Date(),
      })
      .onConflictDoNothing()
    send(ws, { type: 'error', code: 'LLM_STREAM_ERROR' })
    cache.complete = true
  } finally {
    setTimeout(() => streamCache.delete(attemptId), 60_000)
  }
}

// ── Handle reconnect ──────────────────────────────────────────────────────────
export function handleReconnect(ws: WSInstance, attemptId: string) {
  const cache = streamCache.get(attemptId)
  if (!cache) {
    send(ws, { type: 'error', code: 'ATTEMPT_NOT_FOUND' })
    return
  }

  for (const token of cache.tokens) {
    send(ws, { type: 'token', content: token })
  }

  if (cache.complete && cache.result) {
    send(ws, { type: 'evaluation', result: cache.result })
    send(ws, { type: 'complete', isFinal: cache.isFinal })
    if (cache.isFinal) ws.close(1000, 'Evaluation complete')
  }
}
