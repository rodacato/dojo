import { useCases, executionQueue } from '../../container'
import { pendingAttempts } from './pending-attempts'
import { SessionId } from '../../../domain/shared/types'
import type { EvaluationResult, EvaluationToken } from '../../../domain/practice/values'
import type { ExecutionResult } from '../../../domain/practice/ports'
import { db } from '../../persistence/drizzle/client'
import { attempts as attemptsTable } from '../../persistence/drizzle/schema'
import { recordSenseiEvaluation } from '../../observability/prometheus'

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

  // Get ownerRole/ownerContext from the kata variation
  const kata = await useCases.getKataById.execute(currentSession.kataId)
  const variation = kata?.variations.find((v) => v.id === currentSession.variationId)

  // Initialize stream cache for reconnect support (ADR-009)
  const cache: StreamCache = { tokens: [], result: null, complete: false, isFinal: false }
  streamCache.set(attemptId, cache)

  pendingAttempts.delete(attemptId)

  const executionContext = await runTestCode(ws, kata, pending.userResponse)

  try {
    for await (const token of useCases.submitAttempt.execute({
      sessionId: SessionId(pending.sessionId),
      userResponse: pending.userResponse,
      ownerRole: variation?.ownerRole ?? '',
      ownerContext: variation?.ownerContext ?? '',
      kataTitle: kata?.title ?? '',
      executionContext,
      category: kata?.category,
      rubric: kata?.type === 'review' ? kata.rubric ?? undefined : undefined,
    })) {
      streamToken(ws, cache, token)
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown LLM error'
    console.error('LLM stream error for session', pending.sessionId, ':', errorMsg)
    await persistPartialAttempt(attemptId, pending, cache.tokens.join('') || JSON.stringify({ error: errorMsg }))
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

// Runs the kata's testCode (if any) through the execution queue, emitting
// `executing` + `execution_result`, and returns the sensei context string.
// Returns undefined when there's no testCode, an empty response, or a failure.
async function runTestCode(
  ws: WSInstance,
  kata: { testCode?: string | null; languages?: string[] | null } | null | undefined,
  userResponse: string,
): Promise<string | undefined> {
  const testCode = kata?.testCode
  if (!testCode || !userResponse.trim()) return undefined

  send(ws, { type: 'executing' })
  try {
    const execResult = await executionQueue.enqueue({
      language: kata?.languages?.[0] ?? 'javascript',
      code: userResponse,
      testCode,
    })
    send(ws, { type: 'execution_result', result: execResult })
    return buildExecutionContext(execResult)
  } catch (err) {
    console.warn('Code execution failed, continuing without results:', err)
    return undefined
  }
}

function buildExecutionContext(r: ExecutionResult): string {
  if (r.exitCode === 0) {
    return `## Test Results\nAll tests passed.\nExit code: 0 | Execution time: ${r.executionTimeMs}ms\n\nFocus your evaluation on code quality, not correctness.`
  }
  if (r.timedOut) {
    return `## Test Results\nExecution timed out.\n\nEvaluate the attempt and consider why it might hang or loop infinitely.`
  }
  if (r.stderr && !r.stdout) {
    return `## Test Results\nCode did not compile or crashed.\nError: ${r.stderr.slice(0, 500)}\n\nEvaluate the attempt and the error.`
  }
  return `## Test Results\nSome tests failed.\nstdout: ${r.stdout.slice(0, 500)}\nstderr: ${r.stderr.slice(0, 300)}\nExit code: ${r.exitCode} | Execution time: ${r.executionTimeMs}ms\n\nFocus on WHY the failing tests fail.`
}

function streamToken(ws: WSInstance, cache: StreamCache, token: EvaluationToken): void {
  if (token.chunk) {
    send(ws, { type: 'token', content: token.chunk })
    cache.tokens.push(token.chunk)
  }

  if (token.isFinal && token.result) {
    cache.result = token.result
    cache.complete = true
    cache.isFinal = token.result.isFinalEvaluation
    recordSenseiEvaluation(token.result.verdict)

    send(ws, { type: 'evaluation', result: token.result })
    send(ws, { type: 'complete', isFinal: cache.isFinal })

    if (cache.isFinal) ws.close(1000, 'Evaluation complete')
  }
}

async function persistPartialAttempt(
  attemptId: string,
  pending: { sessionId: string; userResponse: string },
  llmResponse: string,
): Promise<void> {
  await db
    .insert(attemptsTable)
    .values({
      id: attemptId,
      sessionId: pending.sessionId,
      userResponse: pending.userResponse,
      llmResponse,
      isFinalEvaluation: false,
      submittedAt: new Date(),
    })
    .onConflictDoNothing()
}
