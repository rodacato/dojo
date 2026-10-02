# ADR-025: External embedded scrolls

**Status:** accepted
**Date:** 2026-10-02
**Supersedes:** ADR 015, ADR 016, ADR 022 (and partially ADR 020, ADR 023)
**Related:** epic [#116](https://github.com/rodacato/dojo/issues/116), [ADR 024](024-self-hosted-hub-pivot.md)

## Context

Scrolls were authored, rendered and executed inside Dojo: a Scroll > Lesson > Step model, a player, an admin editor and their own execution paths. That makes Dojo opine on what is learned and how it is taught, which a self-hosted hub (ADR 024) should not do. Only the maintainer ever used them, so removing them costs no other user anything.

## Decision

1. A scroll becomes an **external app**, in any stack and hosted anywhere, embedded in Dojo by iframe and talking to it over a versioned `postMessage` protocol. The word "scroll" stays.
2. Dojo, as host, offers **progress**, **session** and **code execution**. An `llm` capability may come later, optional and behind the instance's configuration.
3. The native scroll system is removed from `master`. Its implementation stays reachable at the git tag `archive/scrolls-final`.
4. No redirects for old `/scrolls/...` and `/share/scroll/...` links.

The protocol, manifest and security model are specified in follow-up work under #116; until two real scrolls use it, the contract stays experimental.

## Alternatives considered

- **Keep native scrolls.** Rejected: Dojo keeps owning content authoring, rendering and pedagogy, for a single user.
- **Importable content packs** (issue #75). Rejected: Dojo would still render and prescribe the lesson format. Superseded by this decision.
- **Locally served scroll builds instead of remote URLs.** Deferred: the first version uses remote URLs; the manifest entry stays abstract enough to point at a local build later.

## Consequences

- Dojo's surface shrinks: no lesson renderer, authoring editor or scroll-specific execution path to maintain.
- Scroll authors integrate against a protocol instead of a content schema, and an embedded app is untrusted: completion is self-reported and does not feed belts.
- Old scroll links return 404, and the five native scroll tables are dropped.
- Recovery path if this proves wrong: the tag `archive/scrolls-final` holds the full native implementation.
