# PRD 034 — Self-hosted hub pivot (program plan)

> **Status:** Program plan · **Date:** 2026-09-13 · **Decision:** [ADR 024](../adr/024-self-hosted-hub-pivot.md) · **Tracking:** GitHub Project "Dojo" (private) + milestones M1/M2/M3

This PRD is the *thinking* artifact; execution lives in GitHub Issues. It maps the pivot into milestones and epics, and records the sequencing rationale and open questions. Task-level breakdown happens in the linked epic issues, not here.

## What we want to know after this

Whether a self-hosted, sensei-core hub — with a low-friction consumption layer that no longer forces the practice loop on visitors — is something the creator uses daily and that a friend will voluntarily open, without dojo becoming a generic learning platform.

## Non-goals (hard boundaries)

- **No multi-tenancy.** Others self-host with their own resources.
- **No imposed access/network model** (public/private/VPN/allowlist) — the host decides per instance.
- **No offline PWA** initially — installable only.
- **No enterprise/admin-per-instance machinery.**
- **No softening of the sensei.** Practice becomes opt-in, not gentler.

## Milestones

Milestones = sprints in the GitHub model. A closed milestone is the shipped record (replacing the sprint-doc-as-planning).

### S034 — Wire the web gate + architecture debt *(in flight, migrated)*
The debt sprint, now tracked as issues. Not part of the pivot, but the pilot that validates the new GitHub PM flow.
- #54 wire web+shared coverage gates · #55 rate limiters · #56 TelemetrySinkPort · #57 knip · #64 web code-quality tail (P-1/P-2/P-3/P-6).

### M1 — Reposition + PM/design-first foundation
The foundation: set up *how we work* before building the big new feature *with* that way of working.
- **#61** Adopt GitHub as the sole PM surface *(largely done via this migration)*.
- **#58** Reposition dojo as a self-hosted OSS hub (README/positioning/self-host story).
- **#59** Make Practice opt-in (Scrolls as the low-friction door; sensei intact).
- **#60** PWA installable + mobile-first consumption surfaces.
- Design-first adopted as a **principle** here; the Pencil tooling bootstrap is M3.

### M2 — Knowledge/Library hub *(post-consolidation)*
The concrete pain, built after the foundation is consolidated.
- **#62** Knowledge/Library bounded context — guides (reuse Learning renderer) + bookmarks/curation (new thin context); migrate the Astro blog content.

### M3 — Pencil design-system bootstrap *(hands-on / offline)*
Deferred because it needs the creator at his machine (opening/closing `.pen` files with the desktop app).
- **#63** Bootstrap `design/` with a ui-kit mirrored 1:1 from the 35 existing UI primitives; switch dojo from prompt-based to Pencil-first.

### Backlog (unscheduled)
- **#65** Update dependencies + migrate to Node 24 LTS — orthogonal maintenance; kept off the pivot critical path (a Node major mid-pivot is risky to interleave).

## Sequencing rationale

1. **Foundation before the prize.** The Knowledge hub (M2) is the creator's most concrete pain, but it is deferred so it is built *with* the new method (GitHub PM + design-first), not before it. The foundation (M1) is mostly workflow + positioning, low-risk and additive.
2. **Pencil last.** It is the only workstream that would make the creator a blocker in a remote session, so it goes to M3 when he is at his machine.
3. **Debt first, as the pilot.** S034's residual is real work that validates the `Closes #N` flow without inventing anything.

## Open questions

- **Secrets UI** (rotate LLM key without redeploy, `pgcrypto` at-rest, audit log). The *access* model was dropped (host's call); does the *secrets* piece enter M1, or stay the standalone backlog item it already is? **Needs a decision.**
- **Knowledge/Library shape** — guides-reuse-Learning vs fully separate context; the bookmark data model. Resolved in M2's own design pass.
- **Do read-only visitors need a login?** If everything sits behind GitHub OAuth, the "friend who just wants to read" is still gated. Whether the consumption layer allows anonymous/public read is a per-host choice, but the *default* shipped behavior needs a call in M1 (#59).
