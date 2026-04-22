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

  // Course-player nudge — a single short hint pointing the learner toward
  // the gap without giving the answer. Returns the full nudge text.
  nudge(params: {
    stepInstruction: string
    testCode: string | null
    userCode: string
    stdout?: string
    stderr?: string
  }): Promise<string>
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
