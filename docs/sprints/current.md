# Sprint 030 — Scrolls presentation reshape + the full-set smoke gate

> **Status:** Open 2026-06-19 · **re-scoped 2026-06-19** from "Go crash scroll" to the scrolls presentation reshape. Go authoring moves to **S031** — only its curriculum (`curricula/go.md`) + a scratch draft exist, nothing is built/seeded/live, so deferring it costs nothing built. Authoring a full scroll *and* the reshape in one sprint is overload.
> **Direction:** [`docs/courses/README.md`](../courses/README.md) §4.5/§4.6 (catalog + landing) · design work staged in [`.kwik-e/tmp/scrolls-reshape/`](../../.kwik-e/tmp/scrolls-reshape/) (prompts, prototype review, action plan) · [ADR 022](../adr/022-crash-course-pivot.md) · [ADR 023](../adr/023-progressive-hint-reveal.md)
> **Predecessor:** [Sprint 029 — Scroll format revision + publish all four](archive/sprint-029-scroll-format-revision.md)

## Sprint thesis

The scroll *format* (Piston exercises, broken→fix), *progress* (anonymous→login merge), and *playground* (Engawa) already exist and four scrolls are live. What does **not** match the bar is the **presentation** — the catalog shows no progress, there's no orientation surface, and the entry doesn't read as the Rustlings-style "clear, free, I-can-start-anything" experience Adrian endorsed after the 2026-06-19 design review. A Claude Design prototype validated the direction (terminal-forward, state-aware, no streak/%/badges).

This is a **presentation reshape on a working engine** — restyle, don't rewrite. Reuse the site's tokens (`apps/web/src/styles/main.css @theme`) and existing components; the prototype's `_ds/` token export is reference only, discarded at implementation.

The full-set real-Piston smoke stays in this sprint. It was always due — S029 flipped the four scrolls to `published` + `isPublic: true` *before* the gate ran, on Adrian's call, so a broken kata is broken *in production* at the next reseed. And it's now the **safety net for the reshape**: we restyle the player that serves live Ruby/Python/Rust/TS, so the smoke guards that content while we work around it.

## Mandatory (sprint blockers if not done)

- **Phase 0 — backend prereqs (do first, the UI lies without them).**
  - `estimatedMinutes` on the Scroll schema + `ScrollDTO` + per-scroll seed values (framework's real time targets, not derived `2 min/step`). The `~95 MIN` card contract (§4.5) is fake until this lands.
  - Batch progress endpoint `GET /scrolls/progress` → `{scrollId, completedStepCount}[]` for the current owner/session; the catalog computes binary state client-side against `stepCount`. **`ScrollDTO` stays pure content** — progress is the Learning context, not Content (no per-owner state on the cacheable catalog DTO).
- **Catalog reshape (`ScrollsPage.tsx`).** State chips (`Not started`/`In progress`/`Completed`, glyph+word), state-aware CTA (`Start`/`Continue`/`Review`), filters, Languages/Topics grouping (Topics as deliberate `upcoming` gap), the metadata row with time. No streak, no %-hero, no badges.
- **Scroll orientation landing (new route).** `/scrolls/:slug` = landing, player moves to `/scrolls/:slug/:stepId`. Lesson list as free `jump-to` (not a gate), per-lesson state, an inside-scroll `N / M steps` progress panel. Per §4.6.
- **THE full-set real-Piston smoke — guarding live content, now also the reshape's safety net.** Walk all four live scrolls against real Piston (`FF_CODE_EXECUTION_ENABLED=true`): every kata's starter + solution, the predicts, playgrounds, read+inline interactions, figures, capstones. Ruby especially — its S029 broken→fix conversions were validated by logic, never executed. Fix what surfaces.
- **TS Piston deploy-config — DONE (verify, don't re-do).** `config/deploy.api.yml` runs the Piston accessory with `PISTON_RUN_TIMEOUT=8000` + `PISTON_OUTPUT_MAX_SIZE=65536`. The `piston-execute-smoke` CI job (`/cron/piston-smoke`, every 30 min, production-scoped) is the live verifier. Confirm green after deploy.
- **Sprint admin discipline.** Close with retro, archive, CHANGELOG, S031 open. Two commits.

## Stretch (ship if the reshape core closes cleanly)

- **Step player consistency pass** (Phase 3) — terminal `scroll/` header, step-type rail tags, `THE CONTRACT` box + **the completion moment** (`ScrollCompleteBanner`) + **error/empty/runner-offline/rate-limit states**. May fold into S031 next to Go if it doesn't fit.
- **Engawa consistency pass** (Phase 4).
- **Render-test infra** (jsdom + @testing-library) — flagged every sprint since S027; land it or defer with a reason.

## Out of scope (deferred, with explicit triggers)

- **Go crash scroll → S031.** Only `curricula/go.md` + the scratch draft at `.kwik-e/tmp/curricula-drafts/go/` exist. Full scope block + authoring + Piston Go 1.16.2 smoke + publish flip all move to S031. The Go scope-block decisions (lens, sandbox honesty, broken→fix policy, capstone) are preserved in [S031's open file] when it opens.
- **Completed-scroll share surface + anonymous→sign-in / save-progress nudge** (framework open Q #8) — Phase 5; real surfaces, not blocking the core eval.
- **Sumi-e migration** — separate sprint. The reshape ships in Slate Indigo; do not entangle.
- **Admin scrolls UI, Belts/milestones, Dashboard** — out of scope (brand contract / separate effort).
- **Streak on scrolls** — parked (README §10). If ever adopted, it's a brand-stance change → ADR.

## Working order (hypothesis, not contract)

| Block | Work |
|---|---|
| W1 | Phase 0: `estimatedMinutes` schema + migration + DTO + seed; batch progress endpoint. Confirm `piston-execute-smoke` green. Start the full-set content smoke of the four live scrolls — they guard production, do them first. |
| W2 | Catalog reshape (`ScrollsPage.tsx`) against the prototype. Reuse site tokens + existing components. |
| W3 | Scroll landing (new route + routing split). |
| W4 | Finish full-set smoke incl. fixes. Step-player consistency pass if it fits (else S031). Sprint admin close. |

## Reading order if you're picking this up cold

1. [`.kwik-e/tmp/scrolls-reshape/action-plan.md`](../../.kwik-e/tmp/scrolls-reshape/action-plan.md) — the plan, prototype verdict, constraints.
2. [`.kwik-e/tmp/scrolls-reshape/claude-design-prompts.md`](../../.kwik-e/tmp/scrolls-reshape/claude-design-prompts.md) — the four screen prompts + the on-brand content palette.
3. [`docs/courses/README.md`](../courses/README.md) §4.5/§4.6 — catalog + landing canon.
4. [`docs/DESIGN.md`](../DESIGN.md) — tokens (Slate Indigo), the "what we don't do" list.
5. The prototype export at [`.kwik-e/tmp/scrolls-reshape/Dojo - scrolls/`](../../.kwik-e/tmp/scrolls-reshape/) — visual reference only (its `_ds/` tokens are a copy; reuse the site's).

## Out of scope, parked

- Kumite feature (still the `/kumite` placeholder).
- Per-track belt marks, rust indicator (PRD-031 v1.1).
- LLM telemetry table (backlog carry).
- Aggressive sensei voice rewrite (calibration-gated).
