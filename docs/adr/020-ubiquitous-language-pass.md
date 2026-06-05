# ADR 020: Ubiquitous language pass — dojo terminology end-to-end

**Status:** Accepted
**Date:** 2026-06-05
**Context:** Sprint 023 — see [PRD-030](../prd/030-dojo-terminology-routes.md), [PRD-031](../prd/031-belt-progression-rubric.md), [PRD-032](../prd/032-sprint-023-planning.md), [Spec 028](../specs/028-dojo-language-pass.md)

## Decision

Rename the product surface and the codebase to a coherent dojo vocabulary, end-to-end:

| Old | New |
|---|---|
| `Exercise` aggregate | `Kata` |
| `Course` aggregate | `Scroll` |
| `Badge` aggregate | `Milestone` (semantics preserved — single-moment recognitions like FIRST_KATA, POLYGLOT) |
| _(new value object)_ | `Belt` — single rank per user, computed on read |
| `/kata`, `/learn`, `/playground`, `/badges`, `/leaderboard` | `/katas`, `/scrolls`, `/engawa`, `/belts`, _(deleted)_ |
| _(new route)_ | `/kumite` — placeholder for the future 1v1 sparring feature |

`/dashboard`, `/start`, `/settings`, `/history` stay as-is — generic terms that already work without translation. `/leaderboard` is deleted, not renamed: rank lives on `/belts` as identity, not ranking.

## Why this was the right window

Phase 0, zero users, no external links to protect, no production share cards in circulation. The migration cost that would normally make this a multi-quarter project was approximately zero. After Phase 1 invites, every rename costs share-card regenerations, 301 chains, and contributor confusion. Doing it before that window closes was the cheapest version of this work that will ever exist.

## What deviates from Spec 028

Spec 028 §4.2 proposed an "alias on import" pattern: keep legacy export names in `drizzle/schema.ts` (`exercises`, `courses`, `userBadges`) and have every caller alias on import (`import { exercises as katas }`). During implementation this turned out to be insufficient — Drizzle's relational query API (`db.query.X`) binds to the *exported* table variable name, so `db.query.katas` only works if `katas` is the actual export name. Aliasing on import would have either forced every relational query to be rewritten with `db.select().from(...)` (a much bigger change) or kept the legacy `db.query.courses` in callers (translation tax).

**Adjusted approach:** schema.ts exports the dojo-native names directly (`katas`, `scrolls`, `userMilestones`, `scrollProgress`) while DB table names stay legacy via `pgTable('exercises', ...)`. Drizzle JS column property names also follow ubiquitous language (`sessions.kataId` maps to DB column `exercise_id`, `userMilestones.milestoneSlug` to `badge_slug`).

This gives:
- One vocabulary end-to-end in the codebase (no translation tax for callers).
- Zero DB migration (column names unchanged on disk).
- The `drizzle/schema.ts` file becomes the *single* place that knows the legacy DB shape.

## Why Badge → Milestone (not Badge → Belt)

The original PRD-030 listed `Badge → Belt` with a TBD note. The rename inventory surfaced the real problem: the existing `Badge` records (`FIRST_KATA`, `POLYGLOT`, `CONSISTENT`, `5_STREAK`, `COURSE_*`) are *single-moment achievements*, not *rank*. Collapsing them into `Belt` would have deleted a useful concept.

Resolved in [Spec 028 Part 0](../specs/028-dojo-language-pass.md#part-0--correction-to-prd-030-badge-mapping):
- `Badge` → `Milestone` — same domain semantics, honest name.
- `Belt` is a new value object computed on read from session history per [PRD-031](../prd/031-belt-progression-rubric.md).
- `/belts` page surfaces both: belt rank as headline + milestones as a section below.

## Why `/leaderboard` was deleted, not renamed to `/kumite`

Kumite means *sparring* — 1v1, paired evaluation, shared kata. A leaderboard is a *ranking*. They are different products. Renaming `/leaderboard` to `/kumite` would have promised a feature that does not exist and corrupted the language for the real kumite feature when it ships. The route is reserved as a placeholder that explains the intent; the implementation is deferred to a separate PRD.

## What stays legacy on purpose

- **DB table names** — `exercises`, `courses`, `user_badges`, `course_progress`, `kata_feedback`. Migration cost without product win.
- **DB column names** — `exercise_id`, `course_id`, `badge_slug`. Same logic.
- **Stored constant strings** — `'FIRST_KATA'`, `'POLYGLOT'`, `'COURSE_TYPESCRIPT_FUNDAMENTALS'`. These are persisted in `user_badges.badge_slug` rows; renaming them is a data migration with no product win.
- **Old ADRs, archived sprints, archived specs** — they are history. Rewriting them is theater.
- **Step type literal `'exercise'`** — a learner-facing step kind inside a Scroll. Orthogonal to the `Exercise` aggregate rename.

## Consequences

- One vocabulary across product, codebase, and docs.
- Future contributors inherit the new vocabulary without a translation layer.
- The kumite feature has a reserved URL and a clear placeholder of intent.
- The belt system is a real product change (not reskinned badges) — advancement is deterministic, factor-based, and explicitly does not consume sensei verdicts (per [PRD-031 hard constraint](../prd/031-belt-progression-rubric.md#the-hard-constraint)).
- Schema.ts is now the canonical mapping point between legacy DB names and ubiquitous code names — touching it requires care, but the rest of the codebase is clean.

## What this enables

- The kumite feature can ship as a real product without renaming pressure.
- Belt rubric v1 (the hardcoded thresholds in `domain/recognition/belt.ts`) is recalculable from existing session/attempt history — v2 will not require migrations.
- Per-track belt marks and rust indicator (PRD-031 v1.1) plug in without further rename work.

## Related

- [PRD-030 — Dojo terminology pass](../prd/030-dojo-terminology-routes.md)
- [PRD-031 — Belt progression rubric](../prd/031-belt-progression-rubric.md)
- [PRD-032 — Sprint 023 plan](../prd/032-sprint-023-planning.md)
- [Spec 028 — Implementation contract](../specs/028-dojo-language-pass.md)
- [ADR 015 — Learning bounded context](015-courses-bounded-context.md) — the bounded context retains the name "Learning" internally; "Scroll" is the aggregate, "Learning" is the context.
