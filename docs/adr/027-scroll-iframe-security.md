# ADR-027: Security model for embedded scrolls
**Status:** accepted
**Date:** 2026-10-02

## Context
A scroll is third-party code running next to the user's Dojo session. Unlike the course sandbox of ADR 016 (curated content in a `srcdoc` iframe without `allow-same-origin`), a scroll is a full app that needs its own storage and origin-scoped features, and it hosts an untrusted client of the host's API.

## Decision
- **Frame:** `<iframe sandbox="allow-scripts allow-same-origin">` with an empty `allow`, only because every scroll runs on an origin different from Dojo's. Same-origin hosting of a scroll is not supported: with `allow-same-origin` it would escape the sandbox.
- **One registry** of scrolls (exact origins, never wildcards such as `*.github.io`) feeds both the CSP `frame-src` and the `event.origin` allowlist, so the two cannot disagree.
- **Messages:** the host accepts a message only if `event.origin` is in the registry and `event.source` is that frame's window; the scroll accepts only the host origin it received in `?host=` and `window.parent`. Every `postMessage` names an explicit `targetOrigin`; `*` is never used. The handshake carries a nonce, and later messages a session id (ADR 026).
- **No code injection:** the host never writes into or evaluates anything in a scroll.
- **No credentials in a scroll.** Execution and `llm`, when they exist, are authorised by the user's session in the host.
- **Untrusted client:** completion and state are self-reported, size-capped, and never feed belts or other trust decisions. Error text from a scroll is displayed as text, never HTML.
- **Minimal disclosure:** a scroll learns locale, theme, its own progress and an opaque per-scroll `userRef`, nothing identifying.

## Alternatives Considered
- **`srcdoc` without `allow-same-origin` (ADR 016):** suits curated snippets; it blocks the storage and origin features real apps need and gives no stable origin to validate messages against.
- **Same origin with a sandbox:** `allow-scripts` plus `allow-same-origin` on the host's own origin lets the scroll remove its sandbox. Rejected.
- **Hosting scrolls only inside Dojo:** removes the origin separation but also the point of independent apps. Rejected.
- **Trusting `event.origin` alone:** another frame of an allowed origin could spoof; the source check closes it.

## Consequences
Strong isolation relies on the registry being exact and admin-controlled, and on scrolls living on separate origins; the host is responsible for refusing anything else at registration. A scroll can still make network requests of its own and can lie about progress, which is why its data is advisory. The shim is loaded from the Dojo host into a scroll's page, so authors should pin it with Subresource Integrity.

## Open questions
- `frame-ancestors` for Dojo itself (epic open decision).
- Whether to restrict `sandbox` further (for example `allow-forms`, `allow-popups`) per scroll, via the manifest.
- Whether the host should require HTTPS origins for every registered scroll except localhost in development.
