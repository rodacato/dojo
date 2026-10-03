# Scroll protocol v0

> **Status:** experimental. Breaking changes are allowed until two real scrolls use it. Decisions: [ADR 026](../adr/026-scroll-protocol.md), [ADR 027](../adr/027-scroll-iframe-security.md).

A **scroll** is a web app, built in any stack and hosted anywhere, that Dojo (the **host**) embeds in an iframe. The two sides talk with `postMessage`. This document is the contract; any implementation that follows it integrates, with or without the optional shim. The machine-readable parts are in [`schema/`](schema/), generated from the reference schemas in the Dojo repository (`packages/shared/src/scroll-protocol.ts`).

Words MUST, SHOULD and MAY are used in the RFC 2119 sense.

## 1. Model

The host offers progress, session and (later) code execution. It prescribes nothing about a scroll's UI or pedagogy. A scroll is an **untrusted client**: everything it reports (completion, state) is self-reported and never feeds belts or any other host decision.

## 2. Envelope

Every message is a JSON-serialisable object:

```json
{ "dojo": "scroll", "v": 0, "type": "<type>", "...": "..." }
```

- `dojo` MUST be `"scroll"` and `v` the protocol version (integer). A receiver ignores anything else.
- Unknown fields are ignored. A message that fails validation against the schemas is ignored; it is not answered, except for the `error` cases in section 8.
- After `init`, every message in both directions carries `session`.

## 3. Origins and windows

Both sides check where a message came from, and neither ever uses `*` as a target origin.

- **Host to scroll:** the host sends with `targetOrigin` set to the scroll's registered origin.
- **Scroll to host:** the scroll learns the host origin from the query parameter `host=<origin>` of its own URL (the host appends it). It sends with `targetOrigin` set to that origin.
- **Host receiving:** accepts a message only if `event.origin` is in the registry of scrolls AND `event.source` is the embedded frame's window.
- **Scroll receiving:** accepts a message only if `event.origin` equals the host origin it was given AND `event.source` is its parent window.
- Without a `host` parameter, or when not framed, a scroll MUST NOT post anything (standalone mode, section 9).
- The host never injects code or markup into a scroll.

## 4. Handshake

```
scroll                                   host
  | -- hello {scroll, nonce, caps} -->     |  validate origin/source/schema
  | <-- init {nonce, session, ...} ---     |
  | -- progress/complete/resize ... -->    |  every message carries session
```

1. When loaded, the scroll generates a random `nonce` (at least 16 characters, unguessable) and sends `hello`.
2. The host answers with `init`, echoing `nonce`. The scroll accepts `init` only if the nonce equals the one it sent; otherwise it ignores it.
3. From then on the scroll uses the `session` from `init`; the host ignores any message whose `session` is not the one it issued for that frame.

A second `init` after the first is ignored.

**Timeouts.** The host SHOULD show an error state if no valid `hello` arrives within 10 seconds of the frame loading. The scroll MUST fall back to standalone mode if no valid `init` arrives within 3 seconds of sending `hello`. These are defaults; implementations MAY use longer values.

## 5. Scroll to host messages

| type | fields | meaning |
|---|---|---|
| `hello` | `scroll: {id, version}`, `nonce`, `capabilities[]` | Starts the handshake. `capabilities` lists what the scroll wants; it should match the manifest. |
| `progress` | `session`, `unitId`, `completed?`, `state?` | Reports progress on a unit. `state` is opaque JSON; its serialised size MUST NOT exceed 65,536 bytes. |
| `complete` | `session`, `unitId?` | With `unitId`, that unit is finished. Without it, the whole scroll is finished; this does not imply that every unit is. A `unitId` that is not in the manifest is rejected. |
| `resize` | `session`, `height` | Desired content height in CSS pixels, integer from 0 to 100,000. The host MAY clamp it. |
| `error` | `session?`, `code`, `message` | The scroll reports a failure. `code` is lowercase kebab-case; `message` at most 1,000 characters. |

## 6. Host to scroll messages

| type | fields | meaning |
|---|---|---|
| `init` | `nonce`, `session`, `locale`, `theme`, `progress`, `capabilities[]`, `userRef`, `authenticated` | Answers `hello`. `locale` is a BCP 47 tag. `theme` maps token names to values. `progress` maps `unitId` to `{completed, state?}` from earlier visits. `capabilities` is what the host **granted**. `userRef` is an opaque per-scroll reference, or `null` when `progress` was not granted; it is stable for one owner and one scroll, and differs between scrolls and owners. An anonymous visitor gets one too, tied to their browser, and `authenticated` tells the scroll which case it is. It changes when an anonymous visitor signs in, so a scroll MUST NOT treat it as stable across login. `authenticated` is a boolean. |
| `setLocale` | `session`, `locale` | The user changed language. |
| `setTheme` | `session`, `theme` | The user changed theme. |

A scroll sees nothing else about the user.

## 7. Capabilities

A scroll declares the capabilities it needs in its manifest and lists them in `hello`. The host decides what to grant and reports it in `init`. A scroll MUST NOT use a capability that was not granted.

| capability | status in v0 |
|---|---|
| `progress` | defined: enables `progress` and `complete` persistence and a non-null `userRef` |
| `run` | defined: enables the `run` and `result` messages, see section 13. Granted only to a signed-in user, on a host with code execution enabled, for a scroll whose manifest declares it |
| `llm` | **reserved**, not implemented. Message type `llm` is reserved. The host MUST NOT grant it. |

A receiver ignores reserved message types.

## 8. Errors

The host reports a problem to the user in its own UI; the protocol only defines what a scroll may send. Suggested `code` values: `invalid-state`, `unsupported-version`, `capability-denied`, `internal`. The host MAY log them and MUST treat them as untrusted text (never render as HTML).

## 9. Standalone mode

A scroll that is not framed, has no `host` parameter, or gets no `init` in time keeps working on its own: it keeps progress in local browser storage and sends nothing. This is what makes a scroll usable outside Dojo.

## 10. Versioning

`v` is an integer. While it is `0` the protocol is experimental and may change incompatibly. After the freeze, `v` changes only for incompatible changes; additive changes keep `v` and add optional fields. A host that does not support a scroll's `protocol` (manifest) or `v` (message) refuses to embed it.

## 11. Manifest

Each scroll publishes a `scroll.json` that validates against [`schema/scroll.schema.json`](schema/scroll.schema.json):

| field | meaning |
|---|---|
| `id` | stable identifier, lowercase letters, digits and hyphens |
| `version` | semantic version of the scroll |
| `protocol` | protocol version it speaks (`0`) |
| `entry` | where the app starts; a URL, absolute or relative to the manifest |
| `locales` | supported BCP 47 tags |
| `title`, `description` | text per locale; every supported locale MUST be present |
| `programmingLanguages` | languages the scroll teaches or uses (lowercase identifiers) |
| `units` | list of `{id, title?}`; ids are stable across versions and unique |
| `capabilities` | what it needs from the host; empty by default |

The JSON Schema cannot express three rules, which the host MUST also enforce: unit ids are unique, locales are unique, and `title` and `description` cover every locale. It also cannot express the 64 KiB cap on `state`.

## 12. Conformance

A scroll conforms if its message trace, against a conforming host, satisfies sections 2 to 7 and 9. A trace-based suite is planned (see the epic) and is not part of v0.

## 13. Code execution (`run` and `result`)

The host runs code for a scroll in its sandbox, on the signed-in user's session. The scroll never holds a credential. Decision: [ADR 028](../adr/028-scroll-code-execution.md).

**Granting.** The host grants `run` only if all three hold: the manifest declares it, the host has code execution enabled, and the user is signed in. Anonymous visitors never get it. `init.capabilities` reports the outcome, and a scroll MUST degrade when `run` is absent.

**`run`** (scroll to host):

| field | meaning |
|---|---|
| `session`, `id` | the session, and a request id the scroll chooses (1 to 128 characters) |
| `language` | lowercase identifier; it MUST be in the manifest's `programmingLanguages` |
| `files` | 1 to 8 `{name, content}`; `name` is flat (letters, digits, `.`, `_`, `-`, no `/`) and unique; the first file is the entry point; total content at most 65,536 bytes |
| `stdin` | optional string, at most 65,536 characters |

**`result`** (host to scroll), always with the same `id` as the request:

| field | meaning |
|---|---|
| `session`, `id` | as above |
| `kind` | `ok`, `compile`, `runtime`, `timeout`, `output-limit` or `unavailable` |
| `exitCode` | integer, or `null` for `unavailable` |
| `stdout`, `stderr` | raw output, each cut to 65,536 characters |
| `durationMs` | wall-clock time in milliseconds |

The host does not interpret the output: how to read it is the scroll's business. `unavailable` means the sandbox could not run the code (it is down, busy, or the host's rate limit was hit); the scroll can retry later. The result is self-reported by a sandbox the scroll controls the input of, so it never feeds belts or any other host decision.

**Errors.** A `run` sent without the capability is answered with a host to scroll `error` message `{session, id, code: "capability-denied", message}`, carrying the request's `id`. The same `error` shape (`id` optional) is how the host may report other problems to a scroll.

**Limits.** The host runs a few executions at once for all scrolls together and limits each user per minute (deployment variables `SCROLL_EXEC_MAX_CONCURRENT` and `SCROLL_EXEC_USER_PER_MINUTE`, defaults 2 and 10). A scroll SHOULD stop waiting for a `result` after a minute. The JSON Schema cannot express the byte cap or the unique file names; the host enforces both.
