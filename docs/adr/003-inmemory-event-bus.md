# ADR-003: In-process event bus over Redis/BullMQ

**Status:** Accepted
**Date:** 2026-03-21
**Deciders:** Darius Osei (architecture)

---

## Context

The domain uses events to communicate across bounded contexts (e.g., `SessionCompleted` → triggers badge check in Recognition context). An event bus is needed to dispatch and handle these events. Options considered:

1. **In-process event bus** — a simple `EventEmitter` or typed pub/sub within the same process
2. **Redis/BullMQ** — a persistent, distributed message queue with worker processes

---

## Decision

**Use `InMemoryEventBus` (in-process) for Phase 0.**

---

## Rationale

A distributed event bus introduces:
- A new operational dependency (Redis instance)
- Network overhead for every event dispatch
- Consumer process lifecycle management
- At-least-once delivery semantics to handle

In Phase 0, the entire application runs in a single process. All domain event handlers (badge checks, streak updates, session completion logging) are lightweight and synchronous. There is no cross-process event consumer. The `InMemoryEventBus` is sufficient, simpler, and eliminates an external dependency.

The upgrade trigger has been defined explicitly: **introduce Redis/BullMQ when the first cross-process event is needed** — e.g., when background jobs (email, heavy analytics) need to run outside the HTTP request lifecycle. This has not happened in Phase 0.

---

## Consequences

- **Positive:** Zero additional infrastructure — no Redis, no worker process
- **Positive:** Events are processed synchronously in the same request — no eventual consistency lag
- **Positive:** Simple to test — no mock queue infrastructure needed
- **Negative:** Events do not survive process crashes — if the server restarts mid-event, handlers are not retried
- **Negative:** Long-running handlers block the event loop — enforce that all handlers are fast and async
- **Negative:** Cannot fan out to multiple consumer processes
- **Trade-off accepted:** The failure modes (process restart during event) are acceptable in Phase 0 where a single server handles all requests. The consequences of a missed badge event or a missed streak update are low — not a payment or data integrity concern.

---

## When to revisit

Replace `InMemoryEventBus` with Redis/BullMQ when:
1. An event handler takes >100ms (e.g., LLM-based analysis) and blocking the event loop becomes measurable
2. A background job needs to run outside the web server process (email, image generation)
3. Cross-process state is needed (multiple API instances competing to handle the same event)
