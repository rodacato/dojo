# Sprint 025 — Crash-course pivot + `predict` step type

> **Status:** Done. Code + docs in master, both commits local pending Adrian's push.
> **Started as:** "rescope the Ruby curriculum" — Lesson 1 of the old long-fundamentals POC was working but the format felt off.
> **Turned into:** a product-direction call documented in [ADR 022](../../adr/022-crash-course-pivot.md).
> **ADR:** [022-crash-course-pivot](../../adr/022-crash-course-pivot.md)
> **Affected docs:** [`docs/courses/README.md`](../../courses/README.md), [`docs/courses/INTERACTIVITY-PATTERNS.md`](../../courses/INTERACTIVITY-PATTERNS.md), [`docs/courses/curricula/ruby.md`](../../courses/curricula/ruby.md), [`docs/courses/curricula/ruby/ruby.md`](../../courses/curricula/ruby/ruby.md), [`docs/courses/authoring-spec-template.md`](../../courses/authoring-spec-template.md)
> **Branch:** `master` (worked on directly; two local commits pending push at sprint close)

## How this sprint was different

This sprint had no plan going in. It started exploratory — the previous evaluation of the Ruby Fundamentals POC surfaced that the long-curriculum model wasn't the right shape. The panel consultation (Priya, Amara, Soren, Elif, Valentina, Maya, Rhea) converged in one round, the pivot got ADR-022'd, and the rest of the session was the implementation. Closes the Sprint 023 + Sprint 024 archive gap by reactivating sprint admin discipline (Sprint 023 was archived only at this sprint's close, never properly retired when Sprint 024 opened).

## Done (this sprint)

### Architecture & direction

- **ADR 022 pivot decision.** Five language scrolls (Ruby, Go, Python, Rust, TypeScript) as the anchored closed set. 90 min target, up to 120 when warranted. Audience contract: developer who already programs in another language. Deep-dive scrolls (SQL, future Ruby metaprogramming, etc.) as a separate shape, deferred. "Scroll" remains the single product noun; "crash course" lives in copy.
- **Course Authoring Profile** (new §8.1 in `docs/courses/README.md`) — every language file declares voice/density/interactivity-menu/pedagogical-bets explicitly. Forces the per-language tradeoffs to be visible, not buried in author judgement.
- **Sub-course Authoring Spec template** ([`authoring-spec-template.md`](../../courses/authoring-spec-template.md)) — the executable brief for an author to write content without inventing pedagogy on the fly. Dense per-step content per `step.type`.
- **Motion runtime policy on `/scrolls/*` codified** in INTERACTIVITY-PATTERNS.md: Rive + CSS only; **GSAP excluded from scroll routes**. Simplifies the prior two-library model. Rive returns when a real designer or a 5+ state machine arrives.

### Content

- **Ruby curriculum re-scoped** (`curricula/ruby.md`) from 8 sub-courses to 1 language scroll + 7 flagged deep-dive candidates.
- **Ruby crash spec written** (`curricula/ruby/ruby.md`): 5 lessons, ~16-20 steps, ~90 min. Lesson 1 spec-complete (read + predict + 2 katas with full prose/starter/tests/hints/solutions); Lessons 2-5 stubbed with shape decisions made.
- **Other 4 language curricula flagged** as pre-pivot drafts in their headers (`go.md`, `python.md`, `rust.md`, `typescript.md`). Each gets its own re-scope sprint, specialist-led (S6 Kenji / S7 Nadia / S8 Björn / S9 Leo).

### Code

- **`predict` step type shipped end-to-end:**
  - Drizzle migration `0022_typical_slipstream.sql` adds `data jsonb` to `steps` (variant-shaped Tier 2 payload; extensible to future `trace` / `read+inline` without further migration).
  - `StepType` extended in `@dojo/shared` (Zod + TS), `domain/learning/values.ts`, `StepSeed`. `PredictData` + `PredictOption` interfaces. `predictDataSchema` validator.
  - `Step.data` field added in domain `Scroll`; `PostgresScrollRepository.toStep()` maps it; `GET /scrolls/:slug` returns it; `seedOneScroll` persists it via upsert.
  - `ScrollPlayerPage.PredictStep` component (~140 lines): CSS state machine `unanswered → revealed`, 4-option radiogroup, per-option feedback voice, correct/wrong styling + hint outline on unselected correct answer. Disabled after pick. Continue button gated.
- **Ruby scroll seeded** with the new shape: slug `ruby` (was `ruby-fundamentals`), 4 steps including the predict on `nil.class` with full per-distractor feedback voice (each distractor names the cross-language reflex it encodes — Python sentinel, JS/Java null-method, JS ancestor confusion).
- **CSS motion polish** on `ScrollPlayerPage` — 5 keyframes (`step-fade-in`, `status-reveal`, `test-row-fade-in` with stagger, `editor-focus-ring`, Run button `active:scale-95`). All honor `prefers-reduced-motion`.

### Cleanup at sprint close

- **TypeScript scroll UUID drift bug fixed.** `pnpm db:seed:scrolls` had been crashing on the TS scroll for weeks (id-vs-slug drift between DB and `seedUuid()`). Fix: `seedOneScroll` now `.returning({ id })`s the actual scroll id post-upsert and re-maps lesson `scrollId` to it. Five scrolls now seed clean end-to-end. Sprint 026 inherits a working seeder.
- **Devcontainer drift fix.** `post-install.sh` hand-rolled a 5-package Piston loop with `version: "*"`; delegated to canonical `scripts/piston-reprovision.sh` (7 pinned runtimes). Dev = prod in runtime list.
- **Ruby anon access reverted.** During POC eval, Ruby was briefly `isPublic: true` + added to `PUBLIC_LANGUAGE_WHITELIST` for ease of review. Restored to authed-only at sprint close per Marta's security posture (anonymous Ruby execution widens the playground attack surface; the brief opening was a deliberate POC concession, not a permanent shift).
- **Sprint 023 archived** (overdue from when Sprint 024 opened; the `current.md` was never cleared during the Sprint 024 → archive transition). Workflow discipline restored.
- **CHANGELOG.md entry added.**

### Verification

- `pnpm typecheck` green across all 5 workspaces
- `pnpm lint` green
- `pnpm test --filter=api` — 146 passing (3 fixtures patched for the new `data: null` field on Step)
- `pnpm db:seed:scrolls` — all 5 scrolls seed clean end-to-end (post-fix)
- Migration 0022 applied
- Ruby scroll renders end-to-end in dev including the new predict step

## Retro — what's worth carrying forward

- **The Course Authoring Profile + Spec template architecture survived the pivot intact.** Designed before the pivot decision; the architecture-vs-direction separation paid off — the format works for crash and for deep-dive equally.
- **Brutal honesty pushed through the pivot.** Panel consultations + ADR-format synthesis turned "let me think about this for a week" into a one-session decision. The five-language anchored set (not "open to additions") is the kind of constraint that's only useful if it's codified before the next "hey what about Elixir?" lands.
- **Cleanup-at-close discipline matters.** This sprint inherited two stale workflow items (Sprint 023 not archived, TS UUID drift bug) that should have been fixed at their original sprint's close. Made a point of closing every loose thread before opening Sprint 026 — the next sprint starts from a clean working tree, a clean migration history, a clean seeder, a clean docs state.

## What's deferred (carried forward, not blocking close)

- **Lessons 2-5 of the Ruby crash scroll** are stubs — Sprint 026 authors them as part of "ship the Ruby crash scroll content end-to-end."
- **Other 4 language scrolls** (Go, Python, Rust, TS) — each is its own re-scope sprint; order TBD by panel consultation (likely Python next per ADR 022 §"What stays open").
- **Real Rive integration on `predict`.** The contract is built for the swap (same three states, same `onComplete`), but the `.riv` asset itself needs a Rive editor session. Capa D of the ADR 022 work; deferred until a designer-iteration loop is real or a 5+ state machine arrives.
- **Unit tests for PredictStep** + smoke test for `data` field in `GET /scrolls/:slug` for predict steps. POC ships without; Sprint 026 should add as the content authoring proves out.
- **Playwright snapshot for the CSS motion** with `prefers-reduced-motion` toggled. Same rationale.
- **`.env.example` modification** — pre-existing in working tree at session start (FF flags for S022 Parts 5/6); not part of this sprint. Adrian handles separately.

## Out of scope, parked

- Push (Adrian's call — two commits sit local at sprint close).
- ROADMAP.md update — no roadmap item explicitly tracked the courses surface as in-flight; nothing to mark "done".
- Sprint 026 detailed planning — outline in `current.md`; specifics emerge as the first scrolls get authored.
