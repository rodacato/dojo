# ADR-007: `<evaluation>` XML block for structured LLM output

**Status:** Accepted
**Date:** 2026-03-21
**Deciders:** Yemi Okafor (LLM architecture), Tomás Ríos (WebSocket)

---

## Context

The sensei evaluation must do two things simultaneously:
1. Stream prose feedback tokens to the client in real time
2. Deliver a structured `EvaluationResult` (verdict, topicsToReview, followUpQuestion, isFinalEvaluation) at the end

Three approaches were considered:

1. **Anthropic structured output API** — force the LLM to return JSON only, no prose stream
2. **Separate calls** — one streaming call for prose, one non-streaming call for the structured result
3. **Embedded XML block** — stream prose freely, have the LLM append a `<evaluation>{...}</evaluation>` block at the end; the adapter strips and parses it

---

## Decision

**Use an embedded `<evaluation>` XML block at the end of the stream.**

The adapter (`AnthropicStreamAdapter`) accumulates the full stream. Tokens before the `<evaluation>` opening tag are forwarded to the client as prose. The block itself is stripped, parsed as JSON, and emitted as the final `EvaluationToken` with `isFinal: true`.

---

## Rationale

**Option 1 (structured output)** is incompatible with streaming. Anthropic's structured output API returns a complete JSON object — there is no way to stream it token by token. Eliminating the streaming prose would degrade the experience: the developer sees a loading spinner for 20–30 seconds, then gets the full evaluation at once. This contradicts the "sensei speaking" interaction model.

**Option 2 (separate calls)** would work but introduces latency and complexity: the prose stream ends, the client waits for the second call to complete, the structured result arrives. Two calls also mean two LLM invocations with duplicated context — cost doubles and the second response may diverge from the first.

**Option 3 (embedded block)** lets the LLM produce everything in one pass:
- Prose tokens arrive in real time — the client shows streaming text immediately
- The adapter buffers only the portion after `<evaluation>` (typically < 500 tokens)
- JSON is parsed once, at the end of the stream
- One LLM call, one connection, zero duplication

The XML tag format (`<evaluation>...</evaluation>`) was chosen over a delimiter like `---JSON---` or `\n\n{` because:
- XML tags are unambiguous and easily detectable in a character-by-character stream
- The LLM rarely produces `<evaluation>` in prose naturally (unlike `{` or `---`)
- The tag name is self-documenting in the prompt

---

## Consequences

- **Positive:** Single LLM call — minimum latency, minimum cost
- **Positive:** Streaming prose visible immediately — no waiting for structure
- **Positive:** `EvaluationStreamParser` is the single point of parsing — testable in isolation
- **Negative:** If the LLM produces `<evaluation>` in the middle of prose (rare), the parser will incorrectly treat everything before it as prose and attempt to parse the remainder as JSON
- **Negative:** Malformed JSON in the `<evaluation>` block requires graceful fallback — `LLMParseError` is thrown, the WebSocket sends an error frame
- **Trade-off accepted:** The XML tag collision risk is low enough (monitored via verdict distribution) that it does not justify the latency of separate calls. If it proves problematic in production, the tag can be made more unique (e.g., `<dojo_evaluation_v1>`) with a prompt update and no code change.

---

## Failure mode

If `finalize()` returns a parse error, the adapter throws `LLMParseError`. The WebSocket handler catches this and sends `{type:"error", code:"LLM_STREAM_ERROR"}` to the client. The attempt is not persisted. The developer can retry (a new `POST /sessions/:id/attempts` generates a new `attemptId`).
