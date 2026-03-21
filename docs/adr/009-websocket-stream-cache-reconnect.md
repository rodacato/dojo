# ADR-009: In-memory `streamCache` for WebSocket reconnection support

**Status:** Accepted (Phase 0)
**Date:** 2026-03-21
**Deciders:** Tomás Ríos (WebSocket architecture), Hiroshi Tanaka (reliability)

---

## Context

LLM evaluation streaming can take 15–30 seconds. During this time, the client's WebSocket connection can drop (mobile network switch, browser refresh, brief connectivity loss). Three approaches were considered:

1. **No reconnection support** — connection drops, evaluation is lost; user must resubmit
2. **Client-side retry without server cache** — reconnect to the same WebSocket URL; server re-evaluates from scratch
3. **Server-side stream cache** — server caches the accumulated tokens for `attemptId` for a short window; reconnecting client receives the cached tokens and then continues live

---

## Decision

**Cache streamed tokens in-memory for 60 seconds per `attemptId`.**

```typescript
interface StreamCache {
  tokens: string[]  // all prose tokens emitted so far
  result: EvaluationResult | null
  cachedAt: number  // timestamp for TTL cleanup
}

const streamCache = new Map<string, StreamCache>()
```

On reconnect (`{type:"reconnect", attemptId}`), the server replays cached tokens to the client, then resumes or completes the stream.

---

## Rationale

**Option 1 (no reconnect)** means that a brief network hiccup during a 30-minute kata evaluation loses all evaluation work. The developer must resubmit, which triggers a second LLM call (cost + latency) and may receive a different evaluation. This is a poor experience.

**Option 2 (re-evaluate on reconnect)** avoids the cache but re-runs the LLM. Problems:
- Second LLM call costs tokens and time
- The second response will be different from the first — the developer gets a different evaluation for the same submission, which undermines trust in the system
- If the LLM already finished by the time the client reconnects, there is nothing to stream anyway — the result is in the DB, but the streaming experience is gone

**Option 3 (stream cache)** handles reconnection correctly:
- If the stream is still in progress: replay cached tokens immediately, then continue live streaming
- If the stream already finished: replay all cached tokens + final result; client transitions directly to the results screen
- The 60-second window covers the majority of real reconnection scenarios (network switch, brief loss) without requiring large memory or complex cleanup

The `streamCache` is separate from the `pendingAttempts` map (ADR-008). Pending attempts live in the pre-evaluation phase (HTTP → WS handoff). The stream cache lives during and after evaluation.

---

## Consequences

- **Positive:** Brief connection drops (< 60 seconds) are transparent to the user
- **Positive:** Re-evaluation on reconnect is avoided — same tokens, same result
- **Positive:** No DB reads required for reconnect — cache is in-memory
- **Negative:** In-memory — server restart clears the cache. A restart during an active evaluation means the user must resubmit
- **Negative:** Memory usage: a 2048-token evaluation response is ~8–12 KB. With 100 concurrent evaluations, that's ~1 MB. Negligible for Phase 0 but worth monitoring
- **Negative:** 60-second window is a hard limit. Reconnections after 60 seconds (e.g., extended connectivity loss) fall back to "no reconnect" behavior
- **Trade-off accepted:** Phase 0 has low concurrent user count. The 60-second window covers the realistic reconnection scenario. The memory cost is trivial. The alternative (persist to DB) adds latency on the hot path for a rare event.

---

## Cleanup

The cache is cleaned via `setTimeout` on insertion:

```typescript
streamCache.set(attemptId, cache)
setTimeout(() => streamCache.delete(attemptId), 60_000)
```

No background process needed. The entry is also deleted immediately if the client successfully receives the final token (`type:"complete"`, `isFinal:true`).
