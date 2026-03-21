# ADR-001: WebSocket over Server-Sent Events for evaluation streaming

**Status:** Accepted
**Date:** 2026-03-21
**Deciders:** Tomás Ríos (realtime architecture)

---

## Context

The sensei evaluation streams tokens back to the client as the LLM generates them. Two approaches were considered for this streaming mechanism:

1. **Server-Sent Events (SSE)** — unidirectional, HTTP-based, browser-native
2. **WebSocket** — bidirectional, persistent connection, protocol upgrade

The evaluation flow requires more than one-way streaming:
- Client sends `{type: "submit", attemptId}` to start the evaluation
- Server streams tokens back
- Client can send follow-up responses (up to 2 exchanges)
- Client can send `{type: "reconnect", attemptId}` if the connection drops

---

## Decision

**Use WebSocket (`WS /ws/sessions/:id`).**

---

## Rationale

SSE is the right choice for unidirectional streaming (server → client). But the evaluation flow is bidirectional: the client submits a response, the server streams back, and the client may send a follow-up response that triggers another stream. With SSE, this would require:
- One SSE connection for the stream
- Separate HTTP POST requests for each submission/follow-up
- Server-side state to correlate the two channels

WebSocket handles all of this in one connection with a typed message protocol. The bidirectionality is not incidental — it is the interaction model: a conversation between developer and sensei.

---

## Consequences

- **Positive:** Single connection, bidirectional, typed message protocol, clean reconnection model
- **Positive:** Hono supports WebSocket natively — no additional library required
- **Negative:** WebSocket requires explicit auth on upgrade (not automatic like cookies on HTTP)
- **Negative:** WebSocket connections count against server resources — enforce 1 active stream per user
- **Trade-off accepted:** If the product ever becomes read-only streaming (no follow-ups), SSE would be simpler. For now, the conversation model requires bidirectionality.
