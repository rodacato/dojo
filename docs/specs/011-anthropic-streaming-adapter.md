# Spec 011: Anthropic Streaming Adapter

> **Status:** ready-to-implement
> **Depends on:** Spec 009 (HTTP routes), Spec 010 (WebSocket evaluation)
> **Blocks:** Spec 010 implementation (adapter must exist before WS wires LLM)

---

## What this spec covers

1. `EvaluationResult` update — add `isFinalEvaluation` field
2. `LLMPort.evaluate()` update — add `userResponse` to params
3. `apps/api/src/prompts/sensei.ts` — the three prompt templates
4. `apps/api/src/infrastructure/llm/AnthropicStreamAdapter.ts` — LLMPort implementation
5. `apps/api/src/infrastructure/llm/evaluation-parser.ts` — `<evaluation>` tag extractor
6. `scripts/test-llm.ts` — standalone prompt tester (run before wiring WebSocket)
7. Config additions — `ANTHROPIC_API_KEY`, `LLM_ADAPTER`
8. `container.ts` update — swap adapter based on env var

---

## 1. Update `apps/api/src/domain/practice/values.ts`

Add `isFinalEvaluation` to `EvaluationResult`. This field is present in the `<evaluation>` JSON block from the LLM and drives the WebSocket `complete` message.

```typescript
export type SessionStatus = 'active' | 'completed' | 'failed'
export type Verdict = 'passed' | 'passed_with_notes' | 'needs_work'

export interface EvaluationResult {
  readonly verdict: Verdict
  readonly analysis: string
  readonly topicsToReview: string[]
  readonly followUpQuestion: string | null
  readonly isFinalEvaluation: boolean  // ← ADD THIS
}

export interface EvaluationToken {
  readonly chunk: string
  readonly isFinal: boolean
  readonly result: EvaluationResult | null
}
```

---

## 2. Update `apps/api/src/domain/practice/ports.ts`

Add `userResponse` to `evaluate()` params. It's the developer's current submission — separate from `history` (prior turns).

```typescript
import type { DomainEvent } from '../shared/events'
import type { SessionId, UserId } from '../shared/types'
import type { Session } from './session'
import type { EvaluationToken } from './values'

export interface ConversationTurn {
  userResponse: string
  llmResponse: string
}

export interface LLMPort {
  evaluate(params: {
    ownerRole: string
    ownerContext: string
    sessionBody: string
    userResponse: string      // ← ADD THIS — the current submission being evaluated
    history: ConversationTurn[]
  }): AsyncIterable<EvaluationToken>

  generateSessionBody(params: {
    ownerRole: string
    ownerContext: string
    exerciseDescription: string
  }): Promise<string>
}

export interface SessionRepositoryPort {
  save(session: Session): Promise<void>
  findById(id: SessionId): Promise<Session | null>
  findActiveByUserId(userId: UserId): Promise<Session | null>
}

export interface EventBusPort {
  publish(event: DomainEvent): Promise<void>
  subscribe<T extends DomainEvent>(eventType: string, handler: (event: T) => Promise<void>): void
}
```

---

## 3. Update `apps/api/src/application/practice/SubmitAttempt.ts`

Pass `userResponse` to `llm.evaluate()` and carry `isFinalEvaluation` through. Also fix the empty `ownerRole`/`ownerContext` bug (identified in spec 010).

```typescript
import { SessionNotFoundError } from '../../domain/shared/errors'
import type { SessionId } from '../../domain/shared/types'
import { Attempt } from '../../domain/practice/attempt'
import type { ConversationTurn, EventBusPort, LLMPort, SessionRepositoryPort } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'

interface Deps {
  sessionRepo: SessionRepositoryPort
  llm: LLMPort
  eventBus: EventBusPort
}

export class SubmitAttempt {
  constructor(private readonly deps: Deps) {}

  async *execute(params: {
    sessionId: SessionId
    userResponse: string
    ownerRole: string      // ← was '' before — now required
    ownerContext: string   // ← was '' before — now required
  }): AsyncIterable<EvaluationToken> {
    const session = await this.deps.sessionRepo.findById(params.sessionId)
    if (!session) throw new SessionNotFoundError(params.sessionId)

    const history: ConversationTurn[] = session.attempts
      .filter((a) => a.evaluationResult !== null)
      .map((a) => ({
        userResponse: a.userResponse,
        llmResponse: a.evaluationResult?.analysis ?? '',
      }))

    let finalToken: EvaluationToken | null = null

    for await (const token of this.deps.llm.evaluate({
      ownerRole: params.ownerRole,
      ownerContext: params.ownerContext,
      sessionBody: session.body,
      userResponse: params.userResponse,   // ← now passed correctly
      history,
    })) {
      yield token
      if (token.isFinal) {
        finalToken = token
      }
    }

    if (finalToken?.result) {
      const attempt = Attempt.create({
        sessionId: params.sessionId,
        userResponse: params.userResponse,
        evaluationResult: finalToken.result,
        isFinalEvaluation: finalToken.result.isFinalEvaluation,
      })

      session.addAttempt(attempt)
      await this.deps.sessionRepo.save(session)

      for (const event of session.pullEvents()) {
        await this.deps.eventBus.publish(event)
      }
    }
  }
}
```

---

## 4. `apps/api/src/prompts/sensei.ts`

Three variations from PRD-012, plus a follow-up template. The winning variation is committed here after `scripts/test-llm.ts` validates them.

```typescript
export interface PromptParams {
  ownerRole: string
  ownerContext: string
  exerciseTitle: string
  exerciseDescription: string
  userResponse: string
}

export interface FollowUpParams {
  followUpResponse: string
  originalFollowUpQuestion: string
}

// Variation A — The Principal Engineer (recommended based on pre-test hypothesis)
// Run scripts/test-llm.ts to validate before treating this as the canonical prompt.
export function buildPromptA(p: PromptParams): string {
  return `You are ${p.ownerRole}.

${p.ownerContext}

---

You are evaluating a developer's response to the following exercise:

EXERCISE:
${p.exerciseTitle}

${p.exerciseDescription}

---

The developer's response:

${p.userResponse}

---

Your job is to evaluate this response as ${p.ownerRole} would — from your specific background, with your specific standards. You are not a generic code reviewer. You have opinions shaped by your experience.

EVALUATION PRINCIPLES:
- Be specific. "You missed the N+1 problem" is not feedback. "Your query generates one SELECT per post in the loop — with 1,000 posts, that's 1,001 queries. Use \`includes(:comments, :author)\` to reduce this to 3 queries." is feedback.
- Be honest. A developer who gets vague praise learns nothing. A developer who gets specific critique learns something they can apply tomorrow.
- Be fair. Credit what was done well before what was done poorly. Do not invert this.
- Decide on a verdict. Do not equivocate. \`passed_with_notes\` exists for work that is solid but has one or two specific improvements. Use it.

FOLLOW-UP RULE:
Ask one follow-up question ONLY if: (a) the submission shows partial understanding that one targeted question could clarify, OR (b) a key reasoning step is missing and asking about it would reveal whether the developer understood or got lucky. Do not ask a follow-up if the verdict is clear.

After your evaluation prose, output the structured result:

<evaluation>
{
  "verdict": "passed" | "passed_with_notes" | "needs_work",
  "analysis": "2-4 sentence summary",
  "topicsToReview": ["specific concept", ...],
  "followUpQuestion": "direct question" | null,
  "isFinalEvaluation": true | false
}
</evaluation>`
}

// Variation B — The Dojo Sensei (narrative framing)
export function buildPromptB(p: PromptParams): string {
  return `You are the sensei of a software engineering dojo. You are evaluating a developer's kata.

Your character for this evaluation: ${p.ownerRole}
Your evaluation rubric: ${p.ownerContext}

---

THE KATA:
${p.exerciseTitle}

${p.exerciseDescription}

---

THE DEVELOPER'S RESPONSE:
${p.userResponse}

---

A sensei does not give participation trophies. A sensei does not give cruelty either. The dojo exists to build real skill. Your evaluation must leave the developer knowing exactly what they got right, exactly what they missed, and exactly what to practice next.

WHAT THE SENSEI OBSERVES:
- Does the developer understand the root cause, or did they pattern-match to a solution?
- Does their explanation show reasoning, or just result?
- What would a junior developer watching this evaluation learn from your critique?

SPECIFICITY IS RESPECT:
The sensei is specific because vague feedback is disrespectful to someone who worked hard. Do not say "you should have handled the error better." Say "your catch block logs the error and returns undefined — the caller has no way to distinguish a network error from a missing user. Use a discriminated union or throw a typed error."

FOLLOW-UP:
The sensei asks one follow-up question when the submission is incomplete in a way that one targeted question would resolve. The sensei does not ask follow-ups to be kind or to soften a verdict. If the work is clearly insufficient, say so.

After your prose evaluation, output the structured result:

<evaluation>
{
  "verdict": "passed" | "passed_with_notes" | "needs_work",
  "analysis": "2-4 sentence summary of what was demonstrated and what was missing",
  "topicsToReview": ["specific technical concept", ...],
  "followUpQuestion": "one direct question" | null,
  "isFinalEvaluation": true | false
}
</evaluation>`
}

// Variation C — The Minimal Direct Evaluator (control)
export function buildPromptC(p: PromptParams): string {
  return `Role: ${p.ownerRole}
Rubric: ${p.ownerContext}

Exercise: ${p.exerciseTitle}
${p.exerciseDescription}

Developer response:
${p.userResponse}

---

Evaluate the response as the above role, using the rubric. Requirements:

1. Credit what is correct first. Be specific about what the developer demonstrated.
2. Identify what is missing or wrong. Be specific — cite the actual code or reasoning gap.
3. Assign a verdict: passed (solid work, ready to ship), passed_with_notes (solid with one or two specific improvements), needs_work (missing something fundamental).
4. List the topics the developer should practice — these must be specific technical concepts, not general skill areas. Wrong: "error handling." Right: "HTTP response status code semantics — specifically, the difference between 4xx client errors and 5xx server errors in REST APIs."
5. Ask a follow-up question if and only if: the submission shows partial understanding that one question would resolve. Do not ask a follow-up if the verdict is clear.

Output format:
<evaluation>
{
  "verdict": "passed" | "passed_with_notes" | "needs_work",
  "analysis": "2-4 sentences",
  "topicsToReview": ["specific concept", ...],
  "followUpQuestion": "question" | null,
  "isFinalEvaluation": true | false
}
</evaluation>`
}

// Follow-up prompt — appended to conversation when isFinalEvaluation === false
export function buildFollowUpPrompt(p: FollowUpParams): string {
  return `The developer's follow-up:
${p.followUpResponse}

Continue the evaluation. You asked: "${p.originalFollowUpQuestion}"

Evaluate their answer. This is the final exchange — deliver your verdict now.

<evaluation>
{
  "verdict": "...",
  "analysis": "...",
  "topicsToReview": [...],
  "followUpQuestion": null,
  "isFinalEvaluation": true
}
</evaluation>`
}

// Session body generation prompt
export function buildSessionBodyPrompt(p: {
  ownerRole: string
  ownerContext: string
  exerciseDescription: string
}): string {
  return `You are ${p.ownerRole}.

${p.ownerContext}

---

A developer is about to start the following exercise:

${p.exerciseDescription}

---

Write the kata body that this developer will see — the specific scenario, context, or code they will respond to. Make it concrete and specific to your role. Do not reveal the answer. Do not include evaluation criteria. Output only the kata body, no preamble.`
}

// Canonical export — the winning variation (update after running scripts/test-llm.ts)
export const buildPrompt = buildPromptA
```

---

## 5. `apps/api/src/infrastructure/llm/evaluation-parser.ts`

Responsible for splitting the LLM stream into prose tokens and the final `<evaluation>` block.

```typescript
import type { EvaluationResult, Verdict } from '../../domain/practice/values'

const EVALUATION_OPEN = '<evaluation>'
const EVALUATION_CLOSE = '</evaluation>'

export interface ParsedStream {
  proseChunks: string[]         // text tokens before <evaluation>
  evaluationResult: EvaluationResult | null
  parseError: string | null
}

/**
 * Incrementally accumulates stream chunks and detects the <evaluation> block.
 * Call `push(chunk)` for each streamed token, then `finalize()` when the
 * stream ends to get the parsed result.
 */
export class EvaluationStreamParser {
  private buffer = ''
  private proseBuffer = ''
  private inEvaluation = false
  private evalBuffer = ''
  private done = false

  readonly proseChunks: string[] = []

  /**
   * Push a new chunk from the stream.
   * Returns the prose fragment to forward to the client (if any).
   */
  push(chunk: string): string {
    if (this.done) return ''

    this.buffer += chunk

    if (!this.inEvaluation) {
      const openIdx = this.buffer.indexOf(EVALUATION_OPEN)
      if (openIdx === -1) {
        // No evaluation block yet — everything is prose
        const prose = this.buffer
        this.buffer = ''
        this.proseChunks.push(prose)
        return prose
      } else {
        // Prose up to the opening tag
        const prose = this.buffer.slice(0, openIdx)
        if (prose) {
          this.proseChunks.push(prose)
        }
        this.buffer = this.buffer.slice(openIdx + EVALUATION_OPEN.length)
        this.inEvaluation = true
        this.evalBuffer = this.buffer
        this.buffer = ''
        return prose
      }
    } else {
      // Accumulate evaluation block — don't forward to client
      this.evalBuffer += chunk
      return ''
    }
  }

  /**
   * Call when the stream ends. Returns the parsed EvaluationResult.
   */
  finalize(): { result: EvaluationResult | null; error: string | null } {
    this.done = true

    if (!this.inEvaluation) {
      return { result: null, error: 'Stream ended without <evaluation> block' }
    }

    const closeIdx = this.evalBuffer.indexOf(EVALUATION_CLOSE)
    if (closeIdx === -1) {
      return { result: null, error: 'Stream ended before </evaluation> closing tag' }
    }

    const jsonStr = this.evalBuffer.slice(0, closeIdx).trim()

    try {
      const raw = JSON.parse(jsonStr) as Record<string, unknown>
      const result = validateEvaluationResult(raw)
      return { result, error: null }
    } catch (e) {
      return {
        result: null,
        error: `Failed to parse <evaluation> JSON: ${e instanceof Error ? e.message : String(e)}`,
      }
    }
  }
}

const VALID_VERDICTS: Verdict[] = ['passed', 'passed_with_notes', 'needs_work']

function validateEvaluationResult(raw: Record<string, unknown>): EvaluationResult {
  const verdict = raw['verdict']
  if (!VALID_VERDICTS.includes(verdict as Verdict)) {
    throw new Error(`Invalid verdict: ${String(verdict)}`)
  }

  const analysis = raw['analysis']
  if (typeof analysis !== 'string' || !analysis.trim()) {
    throw new Error('Missing or empty analysis')
  }

  const topicsToReview = raw['topicsToReview']
  if (!Array.isArray(topicsToReview)) {
    throw new Error('topicsToReview must be an array')
  }

  const followUpQuestion = raw['followUpQuestion']
  if (followUpQuestion !== null && typeof followUpQuestion !== 'string') {
    throw new Error('followUpQuestion must be a string or null')
  }

  const isFinalEvaluation = raw['isFinalEvaluation']
  if (typeof isFinalEvaluation !== 'boolean') {
    throw new Error('isFinalEvaluation must be a boolean')
  }

  return {
    verdict: verdict as Verdict,
    analysis,
    topicsToReview: topicsToReview.filter((t): t is string => typeof t === 'string'),
    followUpQuestion: typeof followUpQuestion === 'string' ? followUpQuestion : null,
    isFinalEvaluation,
  }
}
```

---

## 6. `apps/api/src/infrastructure/llm/AnthropicStreamAdapter.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { LLMPort, ConversationTurn } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'
import { EvaluationStreamParser } from './evaluation-parser'
import { buildPrompt, buildFollowUpPrompt, buildSessionBodyPrompt } from '../../prompts/sensei'

export class AnthropicStreamAdapter implements LLMPort {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async *evaluate(params: {
    ownerRole: string
    ownerContext: string
    sessionBody: string
    userResponse: string
    history: ConversationTurn[]
  }): AsyncIterable<EvaluationToken> {
    const messages = buildMessages(params)
    const parser = new EvaluationStreamParser()

    const stream = await this.client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages,
    })

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        const prose = parser.push(event.delta.text)
        if (prose) {
          yield { chunk: prose, isFinal: false, result: null }
        }
      }
    }

    const { result, error } = parser.finalize()

    if (error || !result) {
      // Yield an error token — the WebSocket handler will catch and send error frame
      throw new LLMParseError(error ?? 'Unknown parse error')
    }

    yield {
      chunk: '',
      isFinal: true,
      result,
    }
  }

  async generateSessionBody(params: {
    ownerRole: string
    ownerContext: string
    exerciseDescription: string
  }): Promise<string> {
    const prompt = buildSessionBodyPrompt(params)

    const response = await this.client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = response.content[0]
    if (block.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic')
    }

    return block.text
  }
}

export class LLMParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LLMParseError'
  }
}

// Build the messages array for the Anthropic API.
// First turn: the evaluation prompt with the current userResponse.
// Subsequent turns (follow-up): append the developer's follow-up using the follow-up template.
function buildMessages(params: {
  ownerRole: string
  ownerContext: string
  sessionBody: string
  userResponse: string
  history: ConversationTurn[]
}): Anthropic.Messages.MessageParam[] {
  const messages: Anthropic.Messages.MessageParam[] = []

  if (params.history.length === 0) {
    // First evaluation — single user message with the full prompt
    messages.push({
      role: 'user',
      content: buildPrompt({
        ownerRole: params.ownerRole,
        ownerContext: params.ownerContext,
        exerciseTitle: '',    // TODO: pass exerciseTitle through params in Phase 1
        exerciseDescription: params.sessionBody,
        userResponse: params.userResponse,
      }),
    })
  } else {
    // Follow-up exchange — reconstruct the conversation
    // First turn: original prompt (from history[0])
    const firstTurn = params.history[0]
    messages.push({
      role: 'user',
      content: buildPrompt({
        ownerRole: params.ownerRole,
        ownerContext: params.ownerContext,
        exerciseTitle: '',
        exerciseDescription: params.sessionBody,
        userResponse: firstTurn.userResponse,
      }),
    })
    messages.push({
      role: 'assistant',
      content: firstTurn.llmResponse,
    })

    // Current follow-up (only 2-exchange limit enforced by HTTP layer)
    messages.push({
      role: 'user',
      content: buildFollowUpPrompt({
        followUpResponse: params.userResponse,
        originalFollowUpQuestion: extractFollowUpQuestion(firstTurn.llmResponse),
      }),
    })
  }

  return messages
}

// Extract the follow-up question from the previous LLM response.
// The question is in the <evaluation> JSON block — but since we only store `analysis`
// in ConversationTurn.llmResponse, we include the full response text there.
// The follow-up template embeds the original question directly, so this is a best-effort
// extraction. In Phase 1, store the full EvaluationResult on Attempt.
function extractFollowUpQuestion(llmResponse: string): string {
  try {
    const match = llmResponse.match(/"followUpQuestion"\s*:\s*"([^"]+)"/)
    return match?.[1] ?? 'Can you elaborate on your approach?'
  } catch {
    return 'Can you elaborate on your approach?'
  }
}
```

---

## 7. Update `apps/api/src/infrastructure/llm/MockLLMAdapter.ts`

Update to match the new `LLMPort` signature (adds `userResponse` and `isFinalEvaluation`). Configurable via env vars as specified in spec 010.

```typescript
import type { LLMPort } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'

const DELAY_MS = Number(process.env['MOCK_LLM_STREAM_DELAY_MS'] ?? 50)
const VERDICT = (process.env['MOCK_LLM_VERDICT'] ?? 'passed') as
  | 'passed'
  | 'passed_with_notes'
  | 'needs_work'
const TOKENS = Number(process.env['MOCK_LLM_RESPONSE_TOKENS'] ?? 5)
const FOLLOW_UP = process.env['MOCK_LLM_FOLLOW_UP'] === 'true'

export class MockLLMAdapter implements LLMPort {
  async generateSessionBody(_params: unknown): Promise<string> {
    return 'Mock session body for testing purposes.'
  }

  async *evaluate(_params: unknown): AsyncIterable<EvaluationToken> {
    const fragments = buildMockFragments(TOKENS)

    for (const fragment of fragments) {
      if (DELAY_MS > 0) await sleep(DELAY_MS)
      yield { chunk: fragment, isFinal: false, result: null }
    }

    if (DELAY_MS > 0) await sleep(DELAY_MS)

    yield {
      chunk: '',
      isFinal: true,
      result: {
        verdict: VERDICT,
        analysis: 'Mock analysis: demonstrated solid understanding of the core concept.',
        topicsToReview: VERDICT === 'needs_work' ? ['Mock concept A', 'Mock concept B'] : [],
        followUpQuestion: FOLLOW_UP ? 'Can you explain why you chose this approach?' : null,
        isFinalEvaluation: !FOLLOW_UP,
      },
    }
  }
}

function buildMockFragments(count: number): string[] {
  const words = ['Mock', 'evaluation', 'response.', 'Good', 'reasoning.', 'Well', 'done.']
  return Array.from({ length: count }, (_, i) => (words[i % words.length] ?? 'word') + ' ')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
```

---

## 8. Config additions

### `apps/api/src/config.ts` — add new fields

```typescript
// Add to the existing config object:
ANTHROPIC_API_KEY: process.env['ANTHROPIC_API_KEY'] ?? '',
LLM_ADAPTER: (process.env['LLM_ADAPTER'] ?? 'mock') as 'mock' | 'anthropic',
```

### `.env.example` additions

```bash
# LLM adapter ('mock' | 'anthropic')
LLM_ADAPTER=mock

# Required when LLM_ADAPTER=anthropic
ANTHROPIC_API_KEY=

# Mock LLM tuning (only used when LLM_ADAPTER=mock)
MOCK_LLM_STREAM_DELAY_MS=50
MOCK_LLM_VERDICT=passed
MOCK_LLM_RESPONSE_TOKENS=5
MOCK_LLM_FOLLOW_UP=false
```

---

## 9. Update `apps/api/src/infrastructure/container.ts`

```typescript
// Replace the MockLLMAdapter import block with:
import { MockLLMAdapter } from './llm/MockLLMAdapter'
import { AnthropicStreamAdapter } from './llm/AnthropicStreamAdapter'
import { config } from '../config'

// Replace the llm line in the container with:
const llm =
  config.LLM_ADAPTER === 'anthropic'
    ? new AnthropicStreamAdapter(config.ANTHROPIC_API_KEY)
    : new MockLLMAdapter()
```

---

## 10. `scripts/test-llm.ts`

Standalone script — run with `npx tsx scripts/test-llm.ts` before wiring the WebSocket.

```typescript
#!/usr/bin/env npx tsx
/**
 * Standalone LLM prompt tester.
 *
 * Usage:
 *   npx tsx scripts/test-llm.ts --variation A --case strong
 *   npx tsx scripts/test-llm.ts --variation B --case wrong
 *   npx tsx scripts/test-llm.ts --variation C --case partial
 *
 * Test cases: strong | partial | pattern | wrong | brief | excellent
 * Variations: A | B | C
 */

import Anthropic from '@anthropic-ai/sdk'
import { buildPromptA, buildPromptB, buildPromptC } from '../apps/api/src/prompts/sensei'
import { EvaluationStreamParser } from '../apps/api/src/infrastructure/llm/evaluation-parser'

const args = process.argv.slice(2)
const variation = getArg(args, '--variation') ?? 'A'
const testCase = getArg(args, '--case') ?? 'strong'

const OWNER_ROLE = 'a senior backend engineer with 10 years of experience in Node.js and distributed systems'
const OWNER_CONTEXT = `You have strong opinions about error handling, observability, and API design. You have been burned by N+1 queries and unhandled promise rejections in production. You expect developers to think about the failure modes of their solutions, not just the happy path.`

const EXERCISE_TITLE = 'Handle Async Errors in Express'
const EXERCISE_DESCRIPTION = `You have an Express.js route that fetches a user from the database and returns their profile. The current implementation crashes the server when the database is unavailable.

Write a version of this route that:
1. Handles the database error without crashing the server
2. Returns an appropriate HTTP status code to the client
3. Logs the error with enough context to debug it

\`\`\`javascript
app.get('/users/:id', async (req, res) => {
  const user = await db.findUser(req.params.id)
  res.json(user)
})
\`\`\``

const TEST_CASES: Record<string, string> = {
  strong: `app.get('/users/:id', async (req, res) => {
  try {
    const user = await db.findUser(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  } catch (err) {
    logger.error({ err, userId: req.params.id }, 'Failed to fetch user')
    res.status(503).json({ error: 'Service temporarily unavailable' })
  }
})`,

  partial: `app.get('/users/:id', async (req, res) => {
  try {
    const user = await db.findUser(req.params.id)
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' })
  }
})`,

  pattern: `app.get('/users/:id', async (req, res, next) => {
  db.findUser(req.params.id)
    .then(user => res.json(user))
    .catch(next)
})`,

  wrong: `app.get('/users/:id', async (req, res) => {
  const user = await db.findUser(req.params.id).catch(() => null)
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json(user)
})`,

  brief: `Wrap it in a try/catch and return 500.`,

  excellent: `app.get('/users/:id', async (req, res) => {
  try {
    const user = await db.findUser(req.params.id)
    if (!user) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: \`No user with id \${req.params.id}\`
      })
    }
    res.json(user)
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      logger.error({ err, userId: req.params.id, query: 'findUser' }, 'Database unavailable')
      return res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        retryAfter: 30
      })
    }
    logger.error({ err, userId: req.params.id }, 'Unexpected error fetching user')
    res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})`,
}

const PROMPT_BUILDERS: Record<string, typeof buildPromptA> = {
  A: buildPromptA,
  B: buildPromptB,
  C: buildPromptC,
}

async function main() {
  const apiKey = process.env['ANTHROPIC_API_KEY']
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is required')
    process.exit(1)
  }

  const userResponse = TEST_CASES[testCase]
  if (!userResponse) {
    console.error(`Unknown test case: ${testCase}. Valid: ${Object.keys(TEST_CASES).join(', ')}`)
    process.exit(1)
  }

  const buildPromptFn = PROMPT_BUILDERS[variation]
  if (!buildPromptFn) {
    console.error(`Unknown variation: ${variation}. Valid: A, B, C`)
    process.exit(1)
  }

  const prompt = buildPromptFn({
    ownerRole: OWNER_ROLE,
    ownerContext: OWNER_CONTEXT,
    exerciseTitle: EXERCISE_TITLE,
    exerciseDescription: EXERCISE_DESCRIPTION,
    userResponse,
  })

  console.log(`\n=== VARIATION ${variation} — TEST CASE: ${testCase} ===\n`)

  const client = new Anthropic({ apiKey })
  const parser = new EvaluationStreamParser()

  process.stdout.write('[PROSE] ')

  const stream = await client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      const prose = parser.push(event.delta.text)
      if (prose) process.stdout.write(prose)
    }
  }

  const { result, error } = parser.finalize()

  console.log('\n\n[EVALUATION RESULT]')
  if (error) {
    console.error('Parse error:', error)
  } else {
    console.log(JSON.stringify(result, null, 2))
  }
}

function getArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag)
  return idx !== -1 ? args[idx + 1] : undefined
}

main().catch(console.error)
```

---

## 11. Install dependency

```bash
pnpm add @anthropic-ai/sdk --filter=api
```

---

## 12. Test matrix

| Test | What to verify |
|---|---|
| Parser: prose only | `push()` returns all text, `finalize()` returns error |
| Parser: evaluation block | Prose before tag returned correctly, JSON parsed |
| Parser: split tag across chunks | `push('<eval')` then `push('uation>')` — both cases handled |
| Parser: malformed JSON | `finalize()` returns error with descriptive message |
| Parser: missing closing tag | `finalize()` returns error |
| MockLLMAdapter: default | Yields N prose tokens then final token with `passed` verdict |
| MockLLMAdapter: `MOCK_LLM_FOLLOW_UP=true` | `followUpQuestion` non-null, `isFinalEvaluation: false` |
| MockLLMAdapter: `MOCK_LLM_VERDICT=needs_work` | `topicsToReview` non-empty |
| AnthropicStreamAdapter: first call | Builds single-turn message, streams prose, returns result |
| AnthropicStreamAdapter: follow-up | Reconstructs conversation history, second-turn message |
| AnthropicStreamAdapter: LLM omits eval block | Throws `LLMParseError` |
| `scripts/test-llm.ts` | Run all 3 variations × 6 cases = 18 calls before committing |

---

## 13. Pre-implementation checklist

Before wiring this to the WebSocket:

- [ ] Run `pnpm add @anthropic-ai/sdk --filter=api`
- [ ] Add `ANTHROPIC_API_KEY` to `.env.local`
- [ ] Run `npx tsx scripts/test-llm.ts --variation A --case strong`
- [ ] Run `npx tsx scripts/test-llm.ts --variation B --case strong`
- [ ] Run `npx tsx scripts/test-llm.ts --variation C --case strong`
- [ ] Run all 6 test cases for the leading variation
- [ ] Update `buildPrompt` export in `sensei.ts` to point to the winner
- [ ] Commit `sensei.ts` with comment: `// Winning variation: X — validated YYYY-MM-DD`

---

## 14. Known limitation — `exerciseTitle` not in `sessionBody`

The current `Session` aggregate stores `body` (the generated kata text) but not `exerciseTitle`. The prompt template has a `{{exerciseTitle}}` slot.

**Phase 0 workaround:** Pass `exerciseDescription` (the full exercise description) as `exerciseTitle` + `exerciseDescription` combined. The LLM receives enough context without the title being separate.

**Phase 1:** Add `exerciseTitle` to `Session` and pass it through `LLMPort.evaluate()`.

The `TODO` comment in `AnthropicStreamAdapter.buildMessages()` tracks this.
