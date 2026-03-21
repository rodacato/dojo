# ADR-008: In-memory `pendingAttempts` map as HTTP↔WebSocket bridge

**Status:** Accepted (Phase 0)
**Date:** 2026-03-21
**Deciders:** Tomás Ríos (architecture), Hiroshi Tanaka (reliability)

---

## Context

The evaluation flow requires two separate concerns to work together:

- **HTTP layer** (`POST /sessions/:id/attempts`): enforces the server-side timer, validates auth, validates the attempt against the session, creates the `attemptId`
- **WebSocket layer** (`WS /ws/sessions/:id`): streams the LLM evaluation tokens to the client

These two layers need to be coordinated: the HTTP layer receives the `userResponse`, the WebSocket layer needs it to call `LLMPort.evaluate()`.

Three coordination approaches were considered:

1. **Pass via WebSocket directly** — remove the HTTP step; client sends `{type:"submit", userResponse}` over the WS connection
2. **Store in database** — HTTP writes the attempt to DB, WebSocket reads it by `attemptId`
3. **In-memory map** — HTTP generates an `attemptId`, stores `{sessionId, userResponse}` in a `Map<attemptId, ...>` with a TTL; WebSocket reads and deletes the entry

---

## Decision

**Use an in-memory `pendingAttempts: Map<string, {sessionId, userResponse}>` with a 5-minute TTL.**

HTTP returns `{attemptId}` to the client. The client sends `{type:"submit", attemptId}` over the WebSocket. The WebSocket handler reads `pendingAttempts.get(attemptId)` and deletes the entry.

---

## Rationale

**Option 1 (pass via WebSocket)** would eliminate the HTTP step and simplify the flow. However:
- Timer enforcement (`submittedAt > startedAt + duration * 1.1 → 408`) belongs in the HTTP layer, not the WebSocket. The HTTP layer already has the session data, the start time, and the request timestamp. Moving this logic to the WebSocket handler would require the WS handler to know about time and session state, making it stateful and harder to test.
- The WebSocket's role is streaming — it is a read channel from the client's perspective. Making it also the write channel for attempt submission couples two concerns.
- The ADR-001 decision (HTTP commands, WebSocket streams) established this separation explicitly.

**Option 2 (store in DB)** is the most durable option but:
- Adds a DB write in the hot path (the user is waiting for the evaluation to start)
- Requires a `pending_attempts` table or a column on `attempts` to mark attempts as "submitted but not yet evaluated"
- Adds a DB read in the WebSocket path
- Introduces a new failure mode: DB write succeeds but WebSocket read fails
- The durability benefit is negligible: if the server restarts between `POST` and `WS submit`, the user simply retries

**Option 3 (in-memory map)** is the right trade-off for Phase 0:
- Zero additional latency — no DB round-trip before the stream starts
- Simple: one `Map.set` on HTTP, one `Map.get` + `Map.delete` on WebSocket
- TTL (5 minutes via `setTimeout`) prevents unbounded memory growth
- Single-process (Phase 0 runs on one VPS) — no distributed coordination needed

---

## Consequences

- **Positive:** Minimal latency between HTTP submission and WebSocket stream start
- **Positive:** No schema change required
- **Positive:** Clear ownership: HTTP validates, WebSocket streams
- **Negative:** In-memory — server restart loses pending attempts. The client would need to retry (submit again via HTTP, then reconnect)
- **Negative:** Does not scale horizontally. If two VPS instances run the API, a client submitting to instance A could connect to instance B's WebSocket and miss the pending entry
- **Trade-off accepted:** Phase 0 runs on a single VPS. Horizontal scaling is not a Phase 0 requirement. When Phase 1 requires multiple instances, this is replaced with a short-lived Redis entry (same TTL, same interface).

---

## Migration path to Phase 1

If horizontal scaling is needed:
1. Replace `new Map()` with a Redis client
2. `pendingAttempts.set(attemptId, data)` → `redis.setex(attemptId, 300, JSON.stringify(data))`
3. `pendingAttempts.get(attemptId)` → `JSON.parse(await redis.get(attemptId))`
4. `pendingAttempts.delete(attemptId)` → `redis.del(attemptId)`

The interface is identical. No other code changes required.
