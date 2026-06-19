# Sprint 030 — Scrolls presentation reshape

> **Status:** Closed 2026-06-19. Re-scoped mid-flight from the Go scroll to the scrolls catalog/landing/player presentation reshape; Go moved to S031.
> **Phase:** 1 — Alpha
> **Direction:** [`docs/courses/README.md`](../../courses/README.md) §4.5/§4.6 · design work staged in `.kwik-e/tmp/scrolls-reshape/` (prompts, prototype review, action plan).

## What triggered it

Adrian found Rustfinity/Rustlings and recognized the shape he'd wanted for the scrolls but couldn't name. The honest finding on inspection: **the engine already was that** — Piston exercises, broken→fix, anonymous→login progress merge, the Engawa playground all existed, and four scrolls were live. What didn't match the bar was the **presentation**: the catalog showed no progress at all, there was no orientation surface between catalog and player, and the entry didn't read as "clear, free, start-anything." Not a re-plan — a presentation reshape on a working engine.

A Claude Design prototype validated the direction (terminal-forward, state-aware, no streak / no %-hero / no badges). Re-scoped S030 to ship it; Go deferred to S031 (only its curriculum existed, nothing built/live, so deferral cost nothing).

## What shipped

- **Phase 0 — backend prereqs.** `estimatedMinutes` on the scroll schema (migration 0024) + per-scroll seed (anchored to §4.2 targets — Rust 120, the ceiling, not the prototype's invented 150) + DTO threading. `GET /scrolls/progress` batch endpoint returning a completed-step count per scroll; the catalog derives binary state client-side. `ScrollDTO` kept pure Content — progress (Learning) never coupled onto the cacheable catalog DTO.
- **Catalog reshape** (`ScrollsPage`). Binary state chips + filter tabs + state-aware CTA + Languages/Topics grouping on the closed 5-language set + `~min` per card. Anonymous learners get an offer to sign in and save progress — not a gate.
- **Scroll orientation landing** (`/scrolls/:slug`, new route). Contract + time, state-aware CTA, lesson list as free jump-to, inside-scroll N/M rail. Player moved to `/scrolls/:slug/:stepId`; step nav converted from hash to path param (back/forward exact for free).
- **Completion moment for anonymous finishers** — was login-gated (share card keyed by user); now shown to anon with the share replaced by a sign-in offer.
- **Tooling fix.** `db:migrate`/`db:push`/`db:studio` now load the workspace `.env` via `node --env-file` (they didn't before; the seeds did).

## Key decisions (and the honest ones)

- **Auth-everything was considered and rejected.** Gating scrolls behind login to stop API abuse reverses the free/anonymous thesis (ADR 022, README §1), and identity doesn't stop automated abuse anyway — rate-limit + captcha + sandbox quotas do (Marta C5). Anonymous stays first-class. Turnstile on `/scrolls/execute` is a precautionary backlog item, not done (no real abuse observed).
- **Streak stayed parked.** The reference's streak + per-card % were the parts Adrian liked most and the parts the brand rejected on purpose (§2, §4.5). Built without them; recorded as README §10 open question — an ADR if ever adopted.
- **`ScrollDTO` stayed pure Content** rather than folding progress in (the easy one-call option) — keeps the catalog cacheable and the Content/Learning contexts un-coupled.
- **Honest scope shrink on the player.** Went in expecting a consistency pass; found the rail already shows step-type tags and the output panel already handles runner-offline/timeout/rate-limit gracefully. The only real gap was anon completion. Didn't invent the rest.

## The mistake to carry forward

Closed S030 with the **full-set Piston smoke not run** — a mandatory item carried to S031. Mitigating truth: this sprint's changes were presentation-only and didn't touch executable kata content, so the smoke's risk didn't grow over S029's. But it's owed since S029 (the four scrolls were published ahead of the gate), and "carry the mandatory smoke again" is exactly the kind of debt that bites at the next reseed. Run it first thing in S031.

## Verification

- typecheck 5/5 + lint 4/4 green across every commit.
- The reported blank page was traced to a crypto-wallet browser extension (SES lockdown breaking GSAP on the landing), not our code.
- The `vite build` OOM was devcontainer memory contention (multiple devcontainers sharing the host), not a code or deploy issue — prod builds in Docker and deploys work.
- **Not run (carried):** the full-set Piston smoke; a full manual UI walkthrough of the new catalog→landing→player flow.

## Carry-forward to S031

- **Run the full-set Piston smoke first** (before any Go DB work).
- **Go crash scroll** — the original S030 scope (Kenji S6 lens, Go 1.16.2 sandbox honesty, pure-delta format, manual `_t`/`_eq` harness, capstone + gesture audit, broken→fix decision). See current.md.
- **Stretch:** player visual polish (terminal `scroll/` header, contract box), Engawa consistency pass, render-test infra.
- **Follow-ups:** `lessons.outcome` field (§4.4 line the landing can't yet show), completed-scroll share reshape, `estimatedMinutes` tuning to real numbers, revisit `javascript-dom` grouping (landed under Topics).
