# PRD-027: "Code Review" kata format

> **Status:** draft
> **Date:** 2026-04-20
> **Author:** Priya Menon (C1) — pending: Hiroshi Nakamura (S1) evaluation design, Darius Osei (C2) domain model impact, Soren Bachmann (C6) UI

---

## Idea in one sentence

A new kata format where the learner reviews a PR diff containing intentional bugs, smells, or design issues — then the sensei evaluates the completeness and quality of the review (which issues they caught, which they missed, how well they articulated the fix).

---

## Why now

- Differentiator. No competitor (Exercism, Execute Program, Codility, HackerRank) offers a "review this PR" format. All are "write code to pass tests".
- Skill gap. Most devs spend more time reviewing code than writing net-new code. We don't practice review.
- Content cheap. A Code Review kata is a static diff + hidden rubric. No execution environment, no iframe sandbox, no Piston call. Infrastructure cost per kata is near zero.
- Evaluation depth. The sensei is already good at grading prose (the existing kata evaluation is free-text). This format leans into what the sensei is already strong at.

---

## Perspectives

### As a learner picking a Code Review kata

I see "Code Review — payment bug". I click. I get a file diff (split view). I read it. I write my review in a text box. I submit. The sensei tells me what I caught, what I missed, and how well I explained the fixes.

That's a new kind of practice. Satisfying if the sensei evaluation is sharp. Useless if vague.

### As the dojo administrator (Kira)

_Fill in: does this add a new exercise type? New schema column? Or does it fit `exercise` with `testCode = null`?_

### As the sensei (evaluation logic)

_Fill in: the rubric is hidden from the learner. The sensei needs it to evaluate. How is the rubric structured — list of expected issues + severity? How do we prevent false negatives where the learner catches an issue the rubric didn't anticipate?_

### As a content contributor (Phase 3+)

_Fill in: writing a Code Review kata is harder than writing a code-to-pass-tests kata. The rubric is subtle. Do we need a template? QA gate?_

### As the product

_Fill in: does this fit the core loop (kata → evaluation → analysis)? Yes — it's a kata with evaluation. The analysis surface (weak areas) might need extension to capture "review skills" as a dimension._

---

## Tensions

- **Evaluation rigor.** Free-text review vs. expected-issues checklist. If the rubric is strict checklist, the sensei can be fooled by surface matches. If it's holistic, evaluation is inconsistent.
- **Content authoring cost.** Authoring a good Code Review kata requires curating a realistic diff *with* subtle bugs. That's harder than writing a coding exercise.
- **Skill dimension.** Code review touches design, security, performance, readability. One rubric must grade across axes.
- **Sensei voice.** The sensei currently evaluates code. Evaluating *a review of code* is meta — does the sensei's tone translate?
- **Format discovery.** How do learners find this? New tab? New category? Mixed with existing katas?

---

## Options

_To fill during PRD authoring. Placeholders:_

### Option A: 1 proof-of-concept kata end-to-end (recommended for S020 POC)
### Option B: Full format — exercise type, UI, rubric schema, 3 katas (S021+)
### Option C: Skip for now — too much design surface

---

## Provisional conclusion

_TBD — Priya to draft. Kira's instinct: Option A for S020 (one kata, hardcoded rubric, reuse existing exercise type if possible). Full format (schema change + content push + UI) is S021+._

---

## Next step

- [ ] Priya fills in "Perspectives", "Tensions", "Options"
- [ ] Hiroshi drafts the evaluation rubric structure
- [ ] Darius confirms whether this fits the existing `exercise` aggregate or needs a new bounded-context concept
- [ ] Soren sketches the review UI (diff viewer + review text box)
- [ ] Decide: ship POC in S020 or defer to S021
