# ADR 024 — Self-hosted hub pivot & realignment

> **Status:** Proposed (awaiting acceptance) · **Date:** 2026-09-13 · **Supersedes:** none · **Related:** [VISION.md](../VISION.md), [ARCHITECTURE.md](../ARCHITECTURE.md), [ROADMAP.md](../ROADMAP.md), ADR 015 (Courses bounded context), ADR 022 (Crash-course pivot)

## Context

Three signals converged:

1. **The invited friends want to think *less*, not more.** They are not the target user. VISION.md already anticipated this ("success is a small group who come back", not a large base) — so this is not a failure of the vision, it is evidence that these particular people are not who the dojo is for.
2. **The sensei's cost and operational complexity** are a real drag for a single operator paying for every evaluation.
3. **The creator's knowledge is scattered** across an overgrown Astro blog that is the wrong home for it. He wants one private place he controls for learning + practice + curation.

The instinct was to broaden into a generic, multi-tenant, enterprise-ready learning platform. That was rejected during design as speculative generality (building for hosts who do not exist — the project's own anti-pattern #2). What survives is an audience + positioning realignment realized as an **additive reframe** over the existing single-tenant app, not a rewrite.

**The vision does not change.** Intentional friction, process-over-correctness, and the sensei's honesty are untouched.

## Decision

1. **Reposition dojo as a self-hosted OSS learning + practice hub.** Anyone can run their own for themselves, their friends, or their team. It is already self-hosted (Kamal + Docker Compose + Cloudflare Tunnel); this is primarily README/positioning + a clean one-command self-host story.
2. **No multi-tenancy. No imposed access model.** Interested parties self-host with their own effort and resources. Whether an instance is public, private, VPN-gated, or allowlisted is the host's decision — dojo neither builds nor prescribes it.
3. **The sensei remains the core domain, unchanged.** Practice becomes **opt-in**: it is no longer the forced front door, so a visitor who only wants to read/learn is never blocked by the evaluation loop. This is an IA / navigation change — the sensei is **not** softened or gamified.
4. **New Knowledge/Library bounded context** (deferred to M2): long-form guides (reusing the Learning markdown renderer) + bookmarks/curation (a new thin context). This is where the blog content lands.
5. **PWA, installable, mobile-first on consumption surfaces**; desktop-primary on production surfaces (kata editor, playground). **No offline / service worker initially** — installable only (avoids the known chunk-reload-vs-SW deploy conflict).
6. **Design-first via Pencil** adopted as the standing method (principle now; tooling bootstrap deferred to M3, which requires hands-on desktop work).
7. **Project management moves entirely to GitHub** — Issues + a private Project board + Milestones. Canonical thinking/decision docs (VISION, ARCHITECTURE, ROADMAP, DESIGN, ADRs, PRDs) stay in `docs/`.

## Consequences

**Architecture.** Practice stays the core in code; only its entry/IA changes. One new bounded context (Library) arrives later. No tenant scoping is introduced anywhere — the single-tenant model is preserved.

**Cost.** Self-host + bring-your-own-LLM-key makes evaluation cost the *host's*, not the creator's. This resolves the sensei cost pain **without killing the sensei** — the differentiator survives.

**Vision.** Intact. The hub adds a low-friction consumption layer *alongside* the high-friction practice layer — two modes under one roof. The practice layer stays uncompromised; the risk is the hub diluting the dojo's opinion, mitigated by keeping Practice opt-in-but-never-softened.

**Rollback.** Everything is additive (a new context, existing auth unchanged, feature-gated surfaces). If the pivot does not land, the single-user dojo remains fully intact — nothing is destroyed.

## Alternatives considered

- **Generic multi-tenant enterprise hub** — rejected. Speculative generality for hosts who do not exist (anti-pattern #2); triples the product for a hypothetical user.
- **Kill the sensei to cut cost** — rejected. It is the differentiator; without it the hub is a commodity wiki + course player. Self-hosting solves the cost instead.
- **Keep invite-only exclusive positioning** — rejected. The friends are not the user, and the creator wants consolidation + a private group he controls, which self-hosted OSS serves better.

## Open questions (resolved in PRD 034)

- Whether the **secrets UI** (rotate LLM key without redeploy, encrypted at rest) enters this program or stays a standalone backlog item.
- The exact shape of the Knowledge/Library context (guides-reuse-Learning vs fully separate; bookmark model).
