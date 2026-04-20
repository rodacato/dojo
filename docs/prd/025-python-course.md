# PRD-025: Python course — "Python for the Practiced"

> **Status:** advancing to spec
> **Date:** 2026-04-20
> **Author:** Nadia Petrov (S7) — reviewed: Dr. Elif Yıldız (S5) curriculum lens, Priya Menon (C1) catalog fit, Tomás Ríos (C3) execution infra

---

## Idea in one sentence

A fourth course for working developers who wrote Python five years ago and want to sharpen what modern idiomatic Python actually looks like — types, dataclasses, context managers, comprehensions, generators, and the rough edges of `asyncio`.

---

## Why now

- Python is Tier 2 in the S016 market research. Consistent demand that SQL Deep Cuts has since validated is worth satisfying.
- The course infrastructure is mature as of S019: `step.title`, `step.solution`, semantic slots, external references, alternative approaches, the `validate:courses` CI gate. Adding a fourth course is now almost pure content work.
- Piston already runs Python 3 (the `python` language id resolves to CPython 3.x). Zero new infra.
- Sprint 020 Part 2 (ship `isPublic: true` for TS + JS DOM) triples the public catalog. Python would be the fourth — keeps momentum on "more reasons to visit the dojo" without breaking the "quality > quantity" stance (three courses are already live and solid).

---

## Perspectives

### As a Python developer revisiting the language

I know how `for` and `if` work. I haven't touched `match`. I wrote class-based code five years ago; I know `dataclass` is a thing but I've never felt the difference. I've seen `async def` but never debugged an event loop. I want each step to hit one idiom at a time and *show me why I should care*, not walk me through `print("hello")`.

What I don't want: a beginner course. What I do want: ten steps that each close a gap.

### As the dojo administrator (Kira)

Authoring a full Python course is the single biggest content deliverable left in Phase 1. Three sub-courses × 10 steps = 30 steps. That's more content than Sprint 018 and Sprint 019 combined. I would rather ship a skeleton (one sub-course, 8-10 steps) that validates the shape and take the rest incrementally.

SQL Deep Cuts is the precedent: we shipped ~8 steps in Sprint 017 and iterated. Same model here.

### As the product

The dojo's differentiator is "practice for practiced developers" — the Python course has to respect that. No "hello world", no `if __name__ == "__main__"` walkthrough. The honest test: could a senior Python dev finish a step and still say "that was useful"? If no, cut the step.

### As a content contributor (Phase 3+)

If the framework holds, a later contributor should be able to propose a new Python sub-course (testing, packaging, CLIs, data) without asking us to redesign the skeleton. The design must be extensible by copy-paste, not special-cased to these three topics.

---

## Tensions

- **Scope vs. shipping now.** Full curriculum is ~3 sub-courses × 10-12 steps — 2+ sprints. A mini-course is 8-10 steps and ships in 1 sprint. The mini-course risks being forgettable; the full version risks being delayed forever.
- **Python version.** 3.11 ships `tomllib`, improved typing; 3.12 ships f-string improvements and `type` statement. Piston's python id likely targets a specific minor. Pinning too new breaks execution; pinning too old teaches yesterday's idioms.
- **Typing depth.** Modern Python leans hard on `typing` — `TypeAlias`, `Protocol`, `Self`, `Unpack`. Covering it well is a sub-course by itself. Leaving it out makes "modern Python" ring hollow.
- **`asyncio` trap.** It is the thing people most want to learn and the thing most likely to overwhelm a practiced-but-rusty dev. Including it doubles the support surface; excluding it disappoints.
- **Content authoring cost.** Each step needs: instruction, starter code, test code, solution, hint, alternative approach. Authoring quality at the level of the three live courses is ~1-2h per step — 15-20h for a mini-course.

---

## Options

### Option A: Mini-course in one sub-course, 8-10 steps

Pick one narrow axis (likely "Modern Python idioms") and ship end-to-end. L1 introduces `dataclass` + `match`; L2 comprehensions + generators; L3 `contextmanager` + `pathlib`. No typing depth, no async.

- **Pros:** Ships in S020-21; validates the course shape; cheap. Keeps the quality bar where it is.
- **Cons:** "Python for the Practiced" without typing or async feels incomplete. Some learners will bounce.
- **Complexity:** Low (~15-20h authoring).

### Option B: Two sub-courses, ~20 steps total

Sub-course A: Modern Idioms (as Option A). Sub-course B: Typing (Protocols, Generics, TypedDict, Self).

- **Pros:** Feels like a real course. Typing is the single biggest "what changed in the last five years" story.
- **Cons:** Doubles the authoring cost; also doubles the review burden (both for the panel and the `validate:courses` gate). One bad step blocks the sub-course.
- **Complexity:** Medium-high (~30-40h authoring).

### Option C: Three sub-courses covering A + B + a light async pass

Adds a mini-sub-course on async/await that stays on the "here's the minimum not to shoot yourself" side, rather than "here's everything".

- **Pros:** Closest to the "full Python course" learners expect.
- **Cons:** 2+ sprints; async is a tax on authoring and testing (Piston's async support needs verification); delays other sprints.
- **Complexity:** High (~50h authoring + infra verification for async).

---

## Provisional conclusion

**Option A for Sprint 020 Part 4, Option B deferred to Sprint 021+.**

Why A now: the sprint plan already flags this as "skeleton to validate the format". We know the course infrastructure handles a third course (SQL) well; a fourth should confirm the assumption or surface a real gap (e.g., Piston Python version drift, hint UX when types are in play). Shipping ~8-10 steps of Modern Idioms is a defensible first foot in the Python catalog.

Why B deferred: typing as a sub-course is worth doing, but it's a spec unto itself — Protocols and TypedDict need their own pedagogical scaffolding (`Why this matters` vs `Your task` vs `Examples` work differently when the code compiles clean but the meaning is wrong). Rushing it risks shipping the weakest of our courses.

Async (Option C) is Sprint 022+ or a separate ask. Not this block.

**Curriculum sketch for the mini-course (Option A):**

| Lesson | Steps | Topics |
|---|---|---|
| L1 | 3 | `dataclass` (vs hand-rolled `__init__`), `match` (vs `if/elif` chain), `Enum` |
| L2 | 3 | list/dict comprehensions (vs `for` + `append`), generators (vs materialising), `itertools` essentials |
| L3 | 2-4 | `contextmanager` / `with` as a pattern, `pathlib` over `os.path`, `TypedDict` for "this dict has a shape", one small stretch (e.g., `functools.cache`) |

Framework §3 allows ≤15 steps per sub-course; this lands at 8-10.

---

## Next step

- [x] Panel review complete — Nadia, Dr. Elif, Priya, Tomás
- [ ] Convert Option A to spec: `docs/specs/027-python-mini-course.md`
- [ ] Confirm Piston's `python` language id and minor version in prod — Tomás (5 min task)
- [ ] Author L1 (3 steps) in Sprint 020 Part 4 if checkpoint allows; otherwise carry forward to S021

---

## Panel recommendation

**Recommended option:** A — mini-course, one sub-course, ~8-10 steps.
**Key risks:** author bandwidth this sprint; Piston Python version drift.
**Fallback / rollback:** hide the course behind `isPublic: false` until the panel review pass is green. Content stays in a branch behind a flag; no migration is needed to unship.
