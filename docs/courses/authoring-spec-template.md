# Sub-course Authoring Spec — Template

> Canonical template for the **per-sub-course executable brief**.
>
> Authors copy this file to `curricula/<lang>/<slug>.md` (e.g. `curricula/ruby/ruby-fundamentals.md`) and fill it in.
>
> The spec is **complete** when an author — human or AI agent — can sit down with this file alone and write the actual course content (prose, starter code, tests, hints, solutions, interactive step data) without inventing pedagogy decisions on the fly. If a field requires invention, the spec is a draft.
>
> Companion documents:
> - [`README.md`](README.md) — design framework; §8.1 defines the language-level Course Authoring Profile this spec inherits from.
> - [`INTERACTIVITY-PATTERNS.md`](INTERACTIVITY-PATTERNS.md) — step type schema and authoring contracts.
> - [`testcode-pattern.md`](testcode-pattern.md) — iframe testCode contract for browser-side (`javascript-dom`) sub-courses only.

---

## How to use this template

1. Copy the file to `docs/courses/curricula/<lang>/<slug>.md`.
2. Fill the **Header** and **§1 Learning Outcomes** first. If you cannot, the sub-course isn't ready.
3. Fill **§2 Authoring Notes** only where this sub-course **deviates** from the language-level Course Authoring Profile. If everything matches, write "no deviations" — do not pad.
4. Fill **§3 Retrieval & Cross-references** before drafting lessons. Knowing what to interleave shapes the lesson order.
5. Draft **§4 Lessons** lesson-by-lesson. For each step, fill the fields required by its `step.type` (see §4.X templates). Do not stub fields; if a step's content isn't decided, mark the step as `status: drafting` and revisit before declaring the spec complete.
6. Fill **§5 Sandbox notes**, **§6 References**, **§7 Open questions** last.

A spec is allowed to ship in increments: Lesson 1 fully spec'd, others stubbed. The header's `status` field tracks this.

---

## Header

```yaml
slug: <kebab-case-slug>             # e.g. ruby-fundamentals
title: <human readable title>       # e.g. "Ruby Fundamentals"
level: <Basic | Intermediate | Advanced | Specific>
language: <ruby | go | python | rust | typescript | javascript-dom | sql>
sandbox: <piston | iframe>
prereqs: [<slug>, ...]              # empty list if none
learner_time: <e.g. "4-5 hours">
status: <draft | spec-in-progress | spec-complete | content-in-progress | shipped>
maintainers:                        # expert IDs that signed off, per docs/EXPERTS.md
  - <S5 Elif>                       # curriculum architect — required
  - <S2 Valentina>                  # content design — required
  - <S6-S10 language specialist>    # required
  - <S11 Maya>                      # required if any interactive step type (predict / trace / read+inline)
  - <S12 Felix>                     # required if any new animation runtime is introduced
```

---

## 1. Learning Outcomes

After finishing this sub-course, the learner can…

- <verb-led, independently testable outcome>
- <verb-led, independently testable outcome>
- …

Rules:
- Verb-led ("Implement …", "Distinguish …", "Recognise …"). Not "Understand …" — un-testable.
- Each outcome maps to at least one exercise or challenge in §4. If an outcome has no step that tests it, it is aspirational and must be cut or backed by a step.
- 4-7 outcomes is the comfortable range. <3 = the sub-course is too small to stand alone. >8 = it should split.

---

## 2. Sub-course Authoring Notes

Overrides from the language-level Course Authoring Profile (`curricula/<lang>.md` §2). State only what differs. If nothing differs, write **"No deviations — inherits the language profile as-is."**

- **Voice & angle override:** <only if this sub-course has a different angle from the language default — e.g. "this sub-course leans more confrontational; the learner should feel that `method_missing` is a footgun before the first exercise">
- **Step density override:** <only if rhythm differs from the language default — e.g. "more explanation than usual: 4-5 explanation steps out of 12, vs. the language default of 3-4">
- **Interactivity menu override:** <only if this sub-course uses a step type the language excludes, or excludes one the language uses — with reason>
- **Pedagogical bet override:** <only if this sub-course commits to a bet the language profile doesn't make, or skips one the profile does make — with reason>

---

## 3. Retrieval & Cross-references

What identifiers, functions, or concepts from prior sub-courses (or earlier lessons in this one) this sub-course re-surfaces.

- **From prior sub-courses:** <list specific names, e.g. "Lesson 2 of `ruby-blocks-procs-lambdas` introduced `compose(f, g)` — Lesson 4 of this sub-course re-uses it inside a class">
- **Within this sub-course:** <list the cross-lesson hooks, e.g. "Lesson 3 testCode references the `describe(obj)` method from Lesson 1 — the learner must remember the signature">

If there are no retrieval hooks, write "none" — but think hard first. Retrieval practice is one of the framework's load-bearing learning bets ([`README.md`](README.md) §3). A sub-course that never re-surfaces prior material is treating each lesson as a hermetic universe, which the framework rules out.

---

## 4. Lessons

For each lesson, fill in the structure below. Steps within a lesson are numbered `<lesson>.<step>` (1.1, 1.2, …). The step templates in §4.1 govern the fields by `step.type`.

### Lesson N — `<one-line "what changed in the learner's head">`

**Step distribution check:** <e.g. "1 read, 1 predict, 2 exercise, 1 challenge = 5 steps">. Confirm against the language profile's density override (§2) or the framework default ([`README.md`](README.md) §4.3).

#### Step N.1 — `<step.type>` — `<title in imperative voice>`

<step content per §4.1>

#### Step N.2 — `<step.type>` — `<title>`

<...>

---

## 4.1 Step content templates

Use the template matching the step's `step.type`. Field names are normative; the renderer expects them.

### `read` (explanation)

```yaml
title: <one sentence, imperative or declarative>
type: read
why_care: <one sentence — the payoff the learner gets from reading on>
body: |
  <prose body — markdown allowed; max ~400 words per [`README.md`](README.md) §5.1>

  Code blocks use language tags:

      ```ruby
      5.times { |i| puts i }
      ```

  Inline code uses backticks. Headings inside the step body cap at `###`.
forward_prompt: <one sentence that sets up the next step — "in the next step you'll …">
```

### `exercise`

```yaml
title: <imperative, one sentence — "Return the longest string in an array">
type: exercise
instruction: |
  <30-150 words. States the contract: what the function takes, what it returns,
  what edge cases matter. No example output here — the tests carry that.>
starter_code: |
  <real scaffold — signature + imports + a single placeholder comment.
   Must compile / parse as-is. Never an empty file.>
test_code: |
  <deterministic; uses the language's stdlib test harness; test names are
   sentences ("returns the empty string for an empty array"); failure messages
   quote actual values — see [`README.md`](README.md) §5.2.>
hints:                                   # 1-3 entries, concept-level
  - <hint #1 — names the concept the learner is missing, not the line to type>
  - <hint #2 — slightly more specific>
  - <hint #3 — only if 2 was not enough; never gives away the answer>
solution: |
  <reference implementation; hidden in the UI until the learner passes the tests>
```

### `challenge`

```yaml
title: <imperative — "Build a streaming JSON parser">
type: challenge
prompt: |
  <real-problem framing — "Fix this event delegation bug", not "complete the
   function so all tests pass". 1-3 paragraphs allowed.>
time_budget: <e.g. "~2× a normal exercise — about 20 minutes">
starter_code: |
  <as for exercise>
test_code: |
  <as for exercise>
hint: <zero or one high-level hint; no hint laddering on challenges>
solution: |
  <reference implementation; hidden until pass>
```

### `predict`

See [`INTERACTIVITY-PATTERNS.md`](INTERACTIVITY-PATTERNS.md) §`predict` for the schema and voice contract.

```yaml
title: <one sentence>
type: predict
question: <one sentence, ends in "?">
snippet: |
  <the code under question — always visible to the learner during question and reveal>
options:                                 # 3-4 entries
  - id: a
    text: <option text>
  - id: b
    text: <option text>
  - id: c
    text: <option text>
correct: <id of correct option>
feedback:                                # required for every option, including correct
  a: |
    <if the learner picked a, the sensei's specific feedback — names the mental
     model that produces this wrong (or right) answer. Generic feedback is
     auto-reject per INTERACTIVITY-PATTERNS.md §Authoring failure modes.>
  b: |
    <…>
  c: |
    <…>
```

### `trace`

See [`INTERACTIVITY-PATTERNS.md`](INTERACTIVITY-PATTERNS.md) §`trace`. Use only when the language profile (§8.1) includes `trace` in its interactivity menu.

```yaml
title: <one sentence>
type: trace
code: |
  <the snippet being traced>
language: <language for highlighting and renderer routing>
steps:                                   # max 12 per trace; split if more
  - line_index: <1-based source line currently executing>
    state:                               # shape varies by language; see curricula/<lang>/ for guidance
      <variable_or_state_field>: <value>
    hint: <optional; only at gotcha steps>
  - line_index: …
    state: …
```

### `read+inline`

See [`INTERACTIVITY-PATTERNS.md`](INTERACTIVITY-PATTERNS.md) §`read+inline`. Use to break long prose with embedded `reveal` or `micro-quiz` interactions.

```yaml
title: <one sentence>
type: read+inline
why_care: <one sentence>
body: |
  <prose; use `<!-- INTERACT:reveal-1 -->` or `<!-- INTERACT:quiz-1 -->`
   markers where interactions should appear>
interactions:                            # max 4 per step
  - id: reveal-1
    kind: reveal
    prompt: <"before reading on, what do you think happens here?">
    answer: <the revealed answer; self-contained — don't restate in the prose below>
  - id: quiz-1
    kind: micro-quiz
    question: <one sentence; goes AFTER the relevant prose, not before>
    options: [<option text A>, <option text B>]
    correct: <0 or 1>
    feedback:
      - <feedback if learner picked A; specific>
      - <feedback if learner picked B; specific>
forward_prompt: <one sentence>
```

---

## 5. Sandbox notes

Specifics this sub-course needs from its sandbox (Piston or iframe). Inherits the language defaults; document only what differs or is load-bearing for this sub-course.

- **Stdlib modules required:** <e.g. "`require 'minitest/autorun'` only; no `Forwardable`">
- **Determinism:** <e.g. "no `Time.now`; no `rand`; seed-based randomness only via `Random.new(42)`">
- **I/O:** <e.g. "no STDIN; inputs are passed as method arguments">
- **Concurrency:** <e.g. "asserts on structural outcomes (counts, order), not timings — Piston scheduling is non-deterministic">
- **Known gotchas:** <e.g. "Ractor emits experimental-warning to stderr — testCode asserts stdout only">

---

## 6. References

Specific sources cited inside this sub-course's prose. Real, currently-extant, linked. Avoid duplicating the language file's general reference list.

- <Book — chapter — page if relevant>
- <Docs URL — specific page>
- <Talk — speaker — venue — year>
- <Community reference — name — URL>

---

## 7. Open questions / known gaps

Things deferred during spec writing. Each entry names what's missing and what would unblock it.

- <question 1 — what we don't yet know, what triggers the answer>
- <question 2 — …>

Empty list is acceptable; an honest empty list is better than fabricated questions.
