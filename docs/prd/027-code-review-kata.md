# PRD-027: "Code Review" kata format

> **Status:** advancing to spec
> **Date:** 2026-04-20
> **Author:** Priya Menon (C1) — reviewed: Hiroshi Nakamura (S1) evaluation rubric, Darius Osei (C2) bounded-context fit, Soren Bachmann (C6) UI, Kira Tanaka (CTO) scope/cost

---

## Idea in one sentence

A new kata format where the learner reads a realistic PR diff seeded with intentional issues (bugs, smells, design flaws) and writes a review — then the sensei evaluates the completeness and quality of what the learner caught, missed, and how they explained the fixes.

---

## Why now

- Differentiator. None of our competitors (Exercism, Execute Program, Codility, HackerRank, LeetCode) offer a "review this diff" format. All of them are "write code to pass tests".
- Skill gap. Practiced developers spend more time reviewing code than writing net-new code. There is nowhere to practice this deliberately.
- Content cost is low. A Code Review kata is a static diff plus a hidden rubric — no execution environment, no Piston, no iframe sandbox. Infrastructure cost per kata approaches zero.
- Evaluation depth. The sensei is already strong at grading prose. This format leans into that strength instead of asking the sensei to judge code against hidden tests.

---

## Perspectives

### As a learner picking a Code Review kata

I see "Code Review — inventory drift bug" on the kata selection screen. I click. I get a split-view diff of 3-5 files, maybe 120 lines total. I read for 3-5 minutes. I write my review in a text box — short bullets or paragraphs, whichever fits. I submit. The sensei tells me which issues I caught, which I missed, and how well I explained the fixes.

What makes this satisfying: the rubric surfaces issues I didn't see and explains why they matter. What makes it hollow: the sensei rubber-stamps a mediocre review.

### As the dojo administrator (Kira)

Schema implications: does this fit the existing `exercise` aggregate, or is it a new concept? The `type` column already has `'code' | 'chat' | 'whiteboard' | 'exercise'` (the last for course steps). Adding `'review'` is a small additive change. The `body` field already holds arbitrary markdown — a diff fits there.

What it breaks: the existing `testCode` field does not apply. Evaluation is prose-only. That is actually a simplification, not a complication.

### As the sensei (evaluation logic)

The rubric is hidden from the learner. The sensei needs it to judge. The sensei also needs to avoid false negatives — if the learner catches an issue the rubric did not anticipate, that is a *good* thing, not a wrong answer. The prompt must allow "yes, you also caught this additional valid issue".

### As a content contributor (Phase 3+)

Authoring a good Code Review kata is harder than a coding exercise. You need a realistic diff *with* plausible bugs *and* a defensible rubric explaining why each issue matters. A template matters. So does a QA gate.

### As Darius (architecture)

Fits the existing `Exercise` aggregate. No new bounded context; `Content` already owns exercise types. Adding a new type and a new optional `rubric` field is additive. No domain events to add or remove — `SessionCompleted` still fires at the end of a review kata with a `verdict`.

### As the product

The core loop stays intact: kata → evaluation → analysis. A review kata is a kata. The analysis surface (weak areas, topics to review) might later gain a "review skills" dimension, but that is iteration, not this PRD.

---

## Tensions

- **Rubric rigor vs. holistic judgment.** A checklist-style rubric is easy to grade but can be gamed (learner copies the words without understanding). A holistic rubric is harder to grade consistently but closer to real review. Middle ground: a structured rubric (list of expected issues with severity and a one-line "why this matters") that the sensei treats as *guidance*, not ground truth.
- **False negatives.** If the learner catches a legitimate issue not in the rubric, the sensei must credit them. The prompt must support "if the reviewer's point is valid and not in the list, treat as an additional caught issue".
- **Content authoring cost.** One good Code Review kata probably takes 3-5 hours to author well: write realistic code, seed plausible bugs, write the rubric, test the prompt. That is 3× the cost of a standard `code` kata. Offsetting: far fewer katas needed — quality over volume.
- **Format discovery.** Where do these live? Mixed with existing katas on the selection screen? A dedicated tab? A badge? Over-engineering here risks not shipping; under-engineering risks the format being invisible.
- **Voice drift.** The sensei already has voice discipline for the four existing kata types. Extending that discipline to review feedback is a prompt iteration, not a redesign — but it does need iteration.

---

## Options

### Option A: One proof-of-concept kata, schema additive, no new UI surface

Add `'review'` to the exercise type enum. Store the diff in `body`, the rubric in a new nullable `rubric` JSONB field on `exercises`. Render the diff in a split view. Learner writes a review in a textarea. Sensei prompt extends with the rubric as context. Reuse `/kata/:id` flow end to end. One kata ships. Show up in the standard "3 kata options" filter.

- **Pros:** Minimum viable proof that the format works. Validates sensei evaluation quality on a review rubric. Content effort = 1 kata.
- **Cons:** No dedicated discovery surface yet. Users who love it cannot easily find "more like this".
- **Complexity:** Low-medium (~3-4 days: schema + UI + prompt + 1 kata authored).

### Option B: Full format — type added, dedicated selection filter, 3-5 katas at launch

Same schema work as A. Plus: a "Code Review" filter on the kata selection screen. Three katas seeded (web bug, concurrency bug, refactor smell). Possibly a badge (`CODE_REVIEW_PIONEER`) for completing the first review kata.

- **Pros:** A clear product surface. Real practice volume.
- **Cons:** 3× the authoring cost; dedicated UI work; badge seeding; more churn. Raises the stakes on prompt quality — one bad kata drags the whole format.
- **Complexity:** High (~2 weeks across content + UI + prompt iteration).

### Option C: Skip entirely for now, ship a PRD only

Defer to a later sprint. Use this PRD as the design doc when picked up.

- **Pros:** Keeps S020 focused on acquisition + observability. Buys time to study the prompt problem harder.
- **Cons:** Slips the differentiator. The team loses momentum on "we do novel formats".
- **Complexity:** Zero.

---

## Provisional conclusion

**Option A for Sprint 020 Part 4, conditional on the checkpoint budget.** If the Part 3 review reveals Ask the Sensei + Python skeleton + Code Review POC collectively overrun, defer Code Review to Sprint 021 and take the extra time on rubric + prompt.

Why A over C: one kata is cheap to ship and expensive to *not* ship — every invitee we onboard without this format is a chance to collect real user feedback that never arrives. The prompt will iterate; shipping one gives us the signal.

Why not B: discovery + badges + three katas is the next iteration, not the first. We do not yet know if the format lands.

**What A looks like concretely:**

- **Schema (migration 0018):** `exercises` gets a nullable `rubric JSONB` field. `type` enum accepts `'review'`. Migration is purely additive; rollback is a DROP COLUMN.
- **Rubric shape:**
  ```json
  {
    "expectedIssues": [
      { "title": "N+1 query in render loop", "severity": "high", "why": "turns 1 request into 50" },
      ...
    ],
    "contextNotes": "This is a fix for ticket XYZ-42; production traffic is 5k rpm"
  }
  ```
- **UI:**
  - Selection: appears in the standard 3-kata draw; `TypeBadge` gets a `REVIEW` variant.
  - Active: split view (file list on left, diff on right) in read-only CodeMirror. Review textarea below, `Submit` at the top.
  - Result: rubric revealed side-by-side with the learner's review, marked up with "caught" / "missed" / "you also caught X".
- **Sensei prompt:**
  - System: extends the review variant of the sensei persona (reuse `ownerRole`).
  - Context: include the rubric as structured JSON.
  - Rules: credit caught issues explicitly; flag missed; accept valid-outside-rubric points as "additional caught"; end with a verdict on a 3-point scale (`passed / passed_with_notes / needs_work`) matching existing kata verdicts.
- **Content:** one kata — "Inventory drift bug". A checkout service PR with a race condition + a missing null check + a weak error message + an unused test import. Plausible; graded as high/high/medium/low severity.

---

## Risks

- **Prompt iteration under-budget.** If the sensei keeps grading "too generously" (everyone passes), the format feels hollow. Hiroshi: plan 3 iterations minimum with manually-authored review drafts as fixtures before shipping.
- **One kata = fragile format.** If the single POC has a weak rubric the whole format reads as weak. Mitigation: pick a kata where the bugs are unambiguous (race condition, N+1, SQL injection).
- **Badge over-promise.** Tempting to ship a badge for "first code review" immediately — resist. Ship the format, measure whether people come back for a second (we only have one). Badge can come with Option B.

---

## Next step

- [x] Panel review complete — Priya, Hiroshi, Darius, Soren, Kira
- [ ] Convert Option A to spec: `docs/specs/029-code-review-kata.md`
- [ ] Draft rubric for "Inventory drift bug" kata (Priya + Hiroshi, ~3h)
- [ ] Extend sensei system prompt with the review variant (Yemi C4 — borrow from this PRD, not a new PRD)
- [ ] Migration 0018 when spec lands

---

## Panel recommendation

**Recommended option:** A — 1 POC kata end-to-end, schema additive, no dedicated UI surface yet.
**Key risks:** prompt quality (Hiroshi gate before ship); one-kata fragility; content authoring under-time.
**Fallback / rollback:** the kata stays in `status: 'draft'` until the prompt passes Hiroshi's fixtures. Rolling back the format entirely is a DROP COLUMN migration + revoke the `'review'` enum value; purely additive now means purely reversible later.
