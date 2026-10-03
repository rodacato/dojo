# ADR-026: Scroll protocol v0 and manifest
**Status:** accepted
**Date:** 2026-10-02

## Context
Scrolls become external web apps embedded in Dojo (epic #116), in any stack and hosted anywhere. Host and scroll need a contract that does not depend on a language or framework, can be audited from a message trace, and can change while only one real scroll exists.

## Decision
A versioned `postMessage` protocol, specified in [`docs/scrolls/PROTOCOL.md`](../scrolls/PROTOCOL.md), with the Zod schemas in `packages/shared/src/scroll-protocol.ts` as the machine-readable source and JSON Schemas generated from them into `docs/scrolls/schema/` (a test fails if the committed files drift).

- Envelope `{dojo: "scroll", v: 0, type, ...}`. Scroll to host: `hello`, `progress`, `complete`, `resize`, `error`. Host to scroll: `init`, `setLocale`, `setTheme`.
- Handshake with a scroll-generated nonce that `init` echoes; `init` issues a session id that every later message carries.
- Capabilities (`progress`, and the reserved `run` and `llm`) are declared in the manifest `scroll.json` and granted by the host in `init`. Reserved message types are not implemented.
- Opaque `state` is capped at 64 KiB. The host sees locale, theme, the scroll's own progress and an opaque per-scroll `userRef`.
- A hand-written shim (`/scroll-kit/v0.js`) is a convenience that also works standalone; the spec is the contract.
- The protocol stays `v: 0`, experimental, until Pattern Circuit and Domain Wall both use it.

## Alternatives Considered
- **Spec derived from the shim:** the shim's behaviour becomes the contract and locks scrolls to one language. Rejected.
- **No session id, only the nonce:** the nonce is secret to the handshake; a session id lets the host drop stale or cross-frame messages cheaply. Kept both.
- **Capabilities implied by the message used:** the host could not refuse or audit them. Rejected for explicit declaration plus grant.
- **JSON Schema as source instead of Zod:** the host is TypeScript and already validates with Zod; generating the other direction avoids two sources.

## Consequences
Any stack can integrate by following one document, and conformance can later be checked from traces. Zod refinements (unique ids, locale coverage, state size) are not representable in JSON Schema, so the spec states them and hosts enforce them. While `v: 0`, breaking changes are allowed, so early scrolls must expect churn; the repayment path is the planned freeze review (phase 9).

## Open questions
- Is `progress` a capability or baseline? It is declared and granted here so a stateless scroll gets no `userRef`.
- ~~`userRef` for anonymous users~~ Resolved in phase 4: anonymous visitors get a per-browser opaque value, `HMAC-SHA256(SESSION_SECRET, "scroll:<scrollId>:<owner>")` in base64url, where the owner is `user:<id>` or `anon:<browser id>`. It changes when the visitor signs in, so scrolls must not rely on it across login.
- Message rate limits and a maximum payload for the whole message, not just `state`.
- ~~Should `complete` without `unitId` mean the whole scroll, and should it imply every unit?~~ Resolved in phase 4: it marks the whole scroll complete and does not imply any unit is.
- Timeout defaults (10 s for `hello`, 3 s for `init`) are guesses.
- Manifest `entry` as absolute or relative URL, and how a locally served build fits later.
