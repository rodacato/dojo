# ADR-037: Session tokens hashed at rest and kept out of URLs
**Status:** accepted
**Date:** 2026-11-06

## Context
[ADR 007](007-bearer-token-over-cookies.md) moved sessions from a cookie to a bearer token in `localStorage` and accepted the XSS exposure for a single-user Phase 0. The token was the `user_sessions` row id, and it travelled in two URLs: the OAuth redirect (`/auth/callback?token=`) and the evaluation WebSocket (`/ws/sessions/:id?token=`). The instance is now invite-only with other users, so three exposures matter beyond XSS:
- A copy of the database, from a backup or a leak, held every live session.
- Proxies and access logs kept 30-day tokens from the WebSocket URL.
- The callback URL held the token in browser history and in any server log on the way.

## Decision
- **Tokens are hashed at rest.** Sign-in issues 32 random bytes (base64url) and stores only their SHA-256 in `user_sessions.token_hash`. The row id is no longer a credential. The migration hashes existing ids the same way, so the deploy signs nobody out.
- **The WebSocket takes a one-time ticket.** `POST /sessions/:id/ws-ticket` (bearer auth, session ownership) returns a ticket bound to user and session, valid for 30 seconds and spent on its first redemption. The socket accepts nothing else. Tickets live in process memory, like pending attempts ([ADR 008](008-pending-attempts-memory-bridge.md)).
- **The OAuth redirect puts the token in the fragment** (`/auth/callback#token=`), which browsers never send to a server. The page reads it and replaces the history entry.

## Alternatives Considered
- **Back to an `HttpOnly` cookie:** closes XSS theft as well, but the web and the API are on different origins, so it needs `SameSite=None` and CSRF protection on every mutating route. That is a larger change than the leaks here call for, and it stays open.
- **The bearer token in a WebSocket subprotocol header:** keeps it out of the URL, but a 30-day credential still crosses on every connect and lands wherever the handshake is logged.
- **Sign everyone out instead of backfilling:** simpler migration, but it costs every user a sign-in for no security gain, since the old ids become hashes too.

## Consequences
- `localStorage` and the XSS trade-off of ADR 007 are unchanged.
- A ticket store per process means a second API instance would need a shared store, the same constraint as pending attempts.
- Opening a socket costs one extra HTTP request.
- The socket refuses a missing or bad ticket with close code 4401, not 4001: the API deploys before the web, and a tab still running an older bundle treats 4001 as an expired sign-in and drops its token. On 4401 it reports a lost connection instead.
- During the deploy, sign-ins can fail for a minute: the old API inserts sessions without a hash until its container is replaced, and the old web cannot read a token from the fragment. A retry after the deploy works.
