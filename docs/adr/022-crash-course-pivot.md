# ADR 022: Scrolls pivot — crash courses, not fundamentals

**Status:** Accepted
**Date:** 2026-06-06
**Context:** Sprint 025 — post-POC re-evaluation of the courses surface after the Ruby Fundamentals Lesson 1 prototype landed in the dev environment (see `docs/courses/curricula/ruby/ruby.md`).

## Decision

Reposition the entire courses surface around **crash courses for developers who already program**. Five language scrolls (Ruby, Go, Python, Rust, TypeScript) are the anchored set; deep-dive scrolls on specific topics (SQL window functions, Ruby metaprogramming, Python asyncio, etc.) ship later as a separate shape.

Anchored decisions:

1. **Anchored language set: five.** Ruby, Go, Python, Rust, TypeScript. No more languages unless one of the five gets dropped first. The decision exists *to close the catalog*, not to keep options open.
2. **Time target: 90 minutes average, up to 120 when warranted.** Below 60 the artifact reads as a blog post; above 120 it stops being "crash" and competes with full curricula we are deliberately not building.
3. **Audience contract: developers who already program.** No novice onramp, no syntax for syntax's sake. The first step assumes transferable mental models from another language.
4. **Vocabulary: "scroll" stays as the single product noun.** No new term for the crash shape. The descriptor "crash course" lives in landing copy, not in product nav, schema, or routes. When distinction is needed in copy, "language scroll" vs "topic scroll" / "deep-dive scroll" carries the load.
5. **Deep-dives are a different shape, deferred.** SQL Deep Cuts already ships and stays. Future deep-dives (per-language specifics) get their own authoring spec when bandwidth is real. They are not in scope for this pivot.

What this **deletes from the previous direction**:

- The 8-sub-course-per-language model from `docs/courses/curricula/ruby.md` §3 (Course Tree Overview).
- The "Basic / Intermediate / Advanced / Specific" level taxonomy applied as a ladder — crash courses are not levels, they are a single artifact per language.
- The "9-15 steps over 2-6 hours" sub-course sizing in `docs/courses/README.md` §4.2.
- The framing of catalog discovery as "language → level → sub-course" — collapses to "language → scroll".

## Why this is the right pivot

Five forces stacked in the same direction:

- **The market is saturated below this line, not above it.** Free fundamentals courses for every mainstream language exist in abundance (Codecademy, Boot.dev, freeCodeCamp, Exercism). Dojo competing in that space would be incremental at best. The "I already know N languages, I want N+1 in 90 minutes with idiom and judgement" job is under-served — the closest existing artifacts (O'Reilly *Just Enough X*, *X in Y minutes*) are static reference, not practice.
- **The brand voice already implies this contract.** "Intentional friction, we respect your time, developers who still have something to prove" — every public-facing line of [BRANDING.md](../BRANDING.md) and [VISION.md](../VISION.md) presupposes a sophisticated audience. Long fundamentals contradict that voice; crash courses extend it.
- **The interactive step types earn their cost in this shape.** `predict` (per [INTERACTIVITY-PATTERNS.md](../courses/INTERACTIVITY-PATTERNS.md) §predict) is most valuable when the learner can hold a hypothesis — which requires they already know what a hypothesis looks like in code. A sophisticated audience makes `predict` honest pedagogy; a novice audience would make it guessing.
- **The authoring cost is finite.** Five language scrolls + a small deep-dive set is a catalog the creator can actually finish. Eight sub-courses × five languages = 40 deliverables = never. The previous direction was implicitly committing to multi-year content debt.
- **The kata side stays the focus.** Scrolls are the Learning half of the product; katas are the Practice half. Scrolls being shorter and finishable lets attention return to the kata loop — which is the strategic surface per [ROADMAP.md](../ROADMAP.md).

## Panel input (synthesized)

Consulted: Priya (C1, product), Amara (C7, community), Soren (C6, brand), Elif (S5, learning science), Valentina (S2, content), Maya (S11, interactive learning), Rhea (S10, Ruby).

| Expert | Take | Concern this ADR addresses |
|---|---|---|
| Priya | Sharper JTBD: "dev with a deadline starting a new gig wants confidence by Friday". | "Anchor the languages" — codified as the five-language closed set above. |
| Amara | Crash courses are intrinsically sharable; the format invites recommendation. | "Voice is the moat" — the brand voice clause stays load-bearing. |
| Soren | Brand-fit excellent; UI shell changes (no long progress bars, denser TOC). | "New design surface" — opens a UI follow-up; not blocking on this ADR. |
| Elif | Pedagogically sound *if* compression ≠ superficial; deliberate practice must hold. | "≥55% exercise even at 90 minutes" — codified in [README §4.3 update](../courses/README.md#43-step-type-distribution-guidelines). |
| Valentina | Rubric sharpens — "what transfer can the learner make after this step?" Every step earns an exercise. | "No tour mode" — codified in the same §4.3 update. |
| Maya | Crash + `predict`-heavy is the honest pairing; compression raises the interaction bar, doesn't lower it. | "Every interaction still passes the Maya test" — restated in the [Ruby Authoring Profile](../courses/curricula/ruby.md#2-course-authoring-profile). |
| Rhea | For Ruby specifically, crash fits the language's small surface better than fundamentals did. Blocks still get disproportionate time. | "Blocks get 2-3 of 5 lessons, not 1 of 10" — codified in the [Ruby crash spec](../courses/curricula/ruby/ruby.md). |

No expert opposed the pivot. Conflicts that surfaced (Elif's compression risk vs. Maya's interaction bar vs. Rhea's blocks priority) all resolve in the same direction: hold the pedagogical line at 90 minutes, do not soften the rubric.

## What survives the pivot

The architecture work from the previous direction holds without rework:

- **Course Authoring Profile** (per-language, in `curricula/<lang>.md` §2 — defined in [README §8.1](../courses/README.md#81-course-authoring-profile)). The four fields (voice & angle, step density & rhythm, interactivity menu, pedagogical bets) apply to crash and to deep-dive equally. The crash shape just plugs different values into the same fields.
- **Sub-course Authoring Spec** (per-scroll, in `curricula/<lang>/<slug>.md` — defined in [README §8.2](../courses/README.md#82-per-sub-course-authoring-spec) and templated at [authoring-spec-template.md](../courses/authoring-spec-template.md)). A crash course is a sub-course with a smaller arc; the spec format is unchanged.
- **`INTERACTIVITY-PATTERNS.md` step type catalog.** The Tier 1 (`read`, `code`, `exercise`, `challenge`) and Tier 2 (`predict`, `trace`, `read+inline`) types stand. The crash shape leans harder on `predict` and `read+inline` than long fundamentals would; the catalog supports that without changes.

## What this changes in the docs

| File | Change |
|---|---|
| [`docs/courses/README.md`](../courses/README.md) | §1 reframes "What scrolls ARE / are NOT" around crash-course shape. §4.2 collapses the sub-course sizing table to a single crash-course target (60-120 min, ~12-20 steps). §4.3 updates step distribution to acknowledge `predict` budget. §7.1 sharpens the voice note to make the "developers who already program" contract explicit. |
| [`docs/courses/curricula/ruby.md`](../courses/curricula/ruby.md) | §3 Course Tree collapses to one row (the crash) + a flagged "Future deep-dive candidates" section. §4 Sub-courses rewritten as a single section pointing to the crash spec. §1 Philosophy and §2 Authoring Profile preserved with minor edits (time target updated). §5-§8 unchanged. |
| [`docs/courses/curricula/ruby/ruby.md`](../courses/curricula/ruby/ruby.md) | New file, replacing `ruby-fundamentals.md`. Five lessons, ~16 steps, 90-minute target. Lesson 1 ("Everything is an object") survives content-intact from the previous spec. Lessons 2-5 are new shape: literals, control-flow surprises, methods, blocks-intro. |
| [`apps/api/src/infrastructure/persistence/seed-scrolls-ruby.ts`](../../apps/api/src/infrastructure/persistence/seed-scrolls-ruby.ts) | Slug `ruby-fundamentals` → `ruby`. Title/description updated to crash-course voice. The 3 existing steps survive verbatim — the proof-of-concept content is unchanged; only the framing around it shifts. Future steps are added in subsequent commits. |
| Other 4 language curricula files (`go.md`, `python.md`, `rust.md`, `typescript.md`) | **Not updated in this ADR.** They remain as drafts under the old framing until their respective re-scope sprints. Each language will get its own crash spec when its turn arrives. Flagged in their headers as "Pre-pivot draft, see ADR 022 for current direction." |
| [`apps/api/src/infrastructure/persistence/seed-scrolls.ts`](../../apps/api/src/infrastructure/persistence/seed-scrolls.ts) | No structural change — `RUBY_*` exports still wired into `seedAllScrolls()` configs. |

## What stays open

- **The other four languages.** Each language scroll re-scope is its own work block. Order to be set per panel input from the respective specialist (S6 Kenji for Go, S7 Nadia for Python, S8 Björn for Rust, S9 Leo for TypeScript). Default suggestion: Python next (largest expected audience), then Go (cleanest target for the format), then TypeScript, then Rust (most authoring-expensive due to ownership pedagogy).
- **TypeScript Fundamentals seed UUID drift.** Surfaced during the Ruby POC seed work — the existing TS scroll row in DB has an id that diverges from the seed-computed UUID, causing `seedAllScrolls()` to fail on the lessons FK insert. Worth a separate fix; not in scope here.
- **Catalog grouping in the UI.** Soren flagged that the UI shell should change for crash shape (denser TOC, no long progress bars). Surface decisions deferred to a separate UI sprint; the current `ScrollPlayerPage` renders crash content without modification, just less crisply than it could.
- **Deep-dive spec format.** Likely diverges slightly from the crash spec — different time target, different "what changed in the learner's head" cadence, different prereq surface. Specified when the first deep-dive (probably SQL window functions or Ruby metaprogramming) gets authored.
- **Slug convention going forward.** This ADR establishes: language crash courses use the bare language slug (`ruby`, `go`, `python`, `rust`, `typescript`); deep-dives use `<lang>-<topic>` (e.g. `ruby-metaprogramming`, `python-asyncio`); cross-language topics use a bare topic slug (`sql-deep-cuts` keeps its existing slug). Existing scrolls (`typescript-fundamentals`, `python-for-the-practiced`, `javascript-dom-essentials`) keep their current slugs until their re-scope.

## Consequences

- The catalog has a finishable shape. Five language scrolls + a small deep-dive set is content debt the creator can actually retire.
- The product voice and the curriculum voice converge — both presuppose the sophisticated developer. Previously the brand voice and the long-curriculum format were in mild tension.
- The interactive step types (`predict`, `read+inline`) have a natural home. They were always going to feel forced inside hour-long lessons aimed at novices; in 18-minute crash lessons aimed at polyglot devs they earn their authoring cost.
- The architecture investment in Authoring Profile + Sub-course Spec pays double — the same architecture serves crash courses and (eventually) deep-dives.
- The kata loop returns to being the strategic focus. Scrolls become a top-of-funnel artifact you can finish in a sitting; the practice surface remains the long-term retention engine.

## Related

- [ADR 015 — Learning bounded context](015-courses-bounded-context.md) — bounded context unchanged; "Scroll" remains the aggregate.
- [ADR 020 — Ubiquitous language pass](020-ubiquitous-language-pass.md) — vocabulary stays as it landed (no new term added).
- [docs/courses/README.md](../courses/README.md) — design framework updated alongside this ADR.
- [docs/courses/curricula/ruby.md](../courses/curricula/ruby.md) — first language curriculum re-scoped under the new direction.
- [docs/courses/INTERACTIVITY-PATTERNS.md](../courses/INTERACTIVITY-PATTERNS.md) — step type catalog; no changes required.
