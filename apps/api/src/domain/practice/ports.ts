import type { DomainEvent } from '../shared/events'
import type { SessionId, UserId } from '../shared/types'
import type { Session } from './session'
import type { EvaluationToken } from './values'
import type { Rubric } from '@dojo/shared'

export interface ConversationTurn {
  userResponse: string
  llmResponse: string
}

export interface LLMPort {
  evaluate(params: {
    ownerRole: string
    ownerContext: string
    sessionBody: string
    userResponse: string
    history: ConversationTurn[]
    category?: string
    // Review kata context (PRD 027). When present, adapters MUST switch to
    // the review prompt variant and evaluate the learner's prose against
    // the rubric rather than running a generic code evaluation.
    rubric?: Rubric
  }): AsyncIterable<EvaluationToken>

  generateSessionBody(params: {
    ownerRole: string
    ownerContext: string
    exerciseDescription: string
  }): Promise<string>

  // Streaming variant of generateSessionBody (S022 Part 6). Yields text
  // deltas as the model produces them. Used by the SSE prep endpoint —
  // kept as a separate method so the blocking path stays available as a
  // feature-flag fallback.
  generateSessionBodyStream(params: {
    ownerRole: string
    ownerContext: string
    exerciseDescription: string
  }): AsyncIterable<string>

  // Course-player nudge — a single short hint pointing the learner toward
  // the gap without giving the answer. Returns the full nudge text.
  nudge(params: {
    stepInstruction: string
    testCode: string | null
    userCode: string
    stdout?: string
    stderr?: string
  }): Promise<string>

  // Ask-sensei free-form streaming Q&A (S022 Part 5). Streams the answer
  // token-by-token; the final element of the iterable carries usage
  // metadata so the route can log cost. The text deltas are yielded as
  // strings; the usage record is returned once via the resolved Promise
  // returned alongside the stream.
  askSensei(params: {
    question: string
    code?: string
    language?: string
  }): {
    stream: AsyncIterable<string>
    usage: Promise<{ inputTokens: number | null; outputTokens: number | null }>
  }
}

export interface SessionRepositoryPort {
  save(session: Session): Promise<void>
  updateBody(id: SessionId, body: string): Promise<void>
  delete(id: SessionId): Promise<void>
  findById(id: SessionId): Promise<Session | null>
  findActiveByUserId(userId: UserId): Promise<Session | null>
}

export interface ExecutionResult {
  readonly stdout: string
  readonly stderr: string
  readonly exitCode: number
  readonly timedOut: boolean
  readonly executionTimeMs: number
}

export interface CodeExecutionPort {
  execute(params: {
    language: string
    code: string
    testCode: string
    timeoutMs?: number
  }): Promise<ExecutionResult>

  // Free-form execution for the playground surface (no test combining).
  // Tight timeouts + memory limits are applied inside the adapter —
  // callers don't pick them because the playground is an untrusted
  // input path.
  run(params: {
    language: string
    version: string
    code: string
  }): Promise<ExecutionResult>
}

export interface EventBusPort {
  publish(event: DomainEvent): Promise<void>
  subscribe<T extends DomainEvent>(eventType: string, handler: (event: T) => Promise<void>): void
}
