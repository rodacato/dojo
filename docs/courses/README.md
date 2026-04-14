# Dojo Courses — Design Framework

> Meta document. Every language course file in this directory (`go.md`, `python.md`, `rust.md`, `typescript.md`, `ruby.md`) follows this framework.
> Maintainer personas: S5 Dr. Elif Yıldız (curriculum architect) + S2 Valentina Cruz (content design) + S6-S10 (language specialists)
> Last updated: 2026-04-14

---

## 1. What Dojo courses are — and what they are not

Dojo Courses are the **Learning** half of the product. Free, public, no timer, no LLM verdict, no streaming sensei. A learner lands on `/learn`, picks a course, opens a step, reads a short explanation, edits some code, hits **Run**, and gets a binary pass/fail back from a sandboxed runner (Piston for server-side languages, an `<iframe sandbox>` for DOM/browser courses). That is the entire loop. It is not a feature tour.

What courses **are**:

- **Inline text → inline exercise → instant pass/fail.** No video. No "click next slide". The code editor is on the same page as the explanation, the test results render under the editor, and the whole interaction lives inside one `CoursePlayer` view.
- **Concept-dense, time-honest.** A sub-course is 2-6 hours of *real* work, not "10 hours of estimated study time" pulled out of a marketing dashboard. We tell you what you'll learn and we don't pad.
- **The on-ramp into Dojo's wider voice.** Same intentional friction, same dry tone, same "we assume you're a literate developer" stance as the Practice (kata) side. Courses are how someone who's never paid us anything finds out whether they want the kata invite.
- **Authoritative, not encyclopedic.** Each course has a strong opinion about what's worth learning first. We will not cover every method on `Array.prototype`. We will cover the ones you actually reach for.
- **Replayable.** Every step is stateless. You can redo Lesson 2 Step 3 in isolation; nothing depends on a hidden REPL state from earlier in the day.

What courses are **not**:

- **Not katas.** Katas are timed, evaluated by an LLM sensei, gated by invite, and deliver a written verdict. Courses are none of those things. If you find yourself wanting to add a timer or a streaming critique to a course step, you have wandered into the Practice context — back away. (See ADR 015.)
- **Not Udemy.** Nobody is recording themselves typing. There is no 14-hour playlist with a quiz tacked on the end. Passive video is explicitly rejected.
- **Not Codecademy circa 2015.** We do not present a 30-line file with one blank that says `# fill me in`. Exercises are functions or short modules with real signatures and real test suites you can read.
- **Not a free trial for the kata product.** Courses stand on their own. They are not a 7-day window that locks. A learner who only ever uses the free courses is a successful learner, full stop.
- **Not certifications.** No badges, no XP bar, no LinkedIn-shareable PDF. Completion is its own reward; if it isn't, the course was bad.
- **Not a content marketing funnel.** We are not optimising step count for SEO. Each step exists because removing it would degrade the learner.

Closest sibling in the existing market: **Exercism**. Closest spiritual ancestor: **Code School** (RIP). The next two sections explain what we take from each and what we leave behind.

---

## 2. References we are (and are not) borrowing from

Every platform below has been reviewed by the curriculum panel. The "borrow / reject" columns are deliberate — they're the framework's stance, not a feature comparison.

| Platform | What we borrow | What we reject |
|---|---|---|
| **Code School** (Pluralsight, shut down 2020) | Tight feedback loop. Distinct course identities ("Rails for Zombies", "Try Git") with strong narrative cohesion. Chapter-and-level pacing. | Screencast-first model. Everything started with a video; the editor was an afterthought. We invert that — text is primary, video is absent. |
| **Codecademy** | Low-friction entry: zero install, browser-native, anonymous-able. The decision that "Run" is a verb and not "Submit". | Over-scaffolded "fill in the blank" steps. Hand-holding to the point of teaching the IDE rather than the language. The "you're 73% complete!" dopamine hooks. |
| **Exercism** | Language-as-muscle-memory philosophy: the same problem shape implemented in 60 languages teaches the *language*, not the algorithm. Open-source, no-paywall stance. Trust in the learner. | Mentorship is out of scope for v1 — we cannot guarantee mentor availability and we will not ship a feature whose quality depends on volunteer SLAs. Local CLI dependency (Exercism downloads exercises to your filesystem) — Dojo is browser-only. |
| **Rustlings** | Compiler-as-teacher: error messages *are* the curriculum. Failure is informative, not punitive. Tiny, focused exercises (one concept per file). | Local-only, no in-browser execution. Almost no prose explanation — assumes you're reading "The Rust Programming Language" alongside it. We provide both. |
| **Scrimba** | The pause-and-edit affordance — the moment a learner can intervene in the example. We achieve the same outcome with editable code blocks adjacent to text, no video required. | Video production cost. Scrimba's "interactive screencast" still requires recording, scripting, re-recording when an API changes. Text-first courses survive a language version bump with a `find/replace`. |
| **Frontend Masters / Pluralsight / Udemy** | Curriculum **depth** and **bundling** — the idea that a serious topic deserves a multi-hour, multi-lesson treatment, not a 5-minute YouTube short. | Passive consumption. Single-author lecture format. Course-shelf inflation (50 nearly-identical "JavaScript Fundamentals" courses competing on thumbnail quality). |
| **Coursera / edX / CS50** | Learning-outcome rigor: every lesson is written against a measurable "after this, the learner can…" statement. CS50's specific gift: making hard things feel achievable through pacing. | The 8-week, drop-everything academic commitment model. Forum-as-support. Long-form video lectures. Certificate paywall. |
| **Boot.dev** | Tight gated progression — you cannot skip ahead, the next step is locked until the previous passes. Strong language focus (Go, Python). Browser-native execution. | XP-as-dopamine. Gamified streaks. The tendency for gamification to substitute for actual difficulty: a learner can grind XP without learning, and we don't want to optimise for that. |
| **Execute Program** (Gary Bernhardt) | Spaced-repetition-based retrieval practice. Type-the-output exercises. Honest acknowledgement that re-encountering material is essential, not optional. | SRS scheduling infrastructure is non-trivial — Phase 4+ at earliest. Subscription-only model. |
| **Type Challenges** | Pattern recognition across many small problems in the same domain. Difficulty progression that goes from "warmup" to "bend reality". | Zero-pedagogy format. The "challenge" *is* the material; you either know it or you Google it. Acceptable for an enthusiast but not for teaching. |
| **Advent of Code** | The narrative through-line across 25 days. Problems that build on yesterday's answer. The community pull of a shared schedule. | Once-a-year, no curriculum, no language guidance, no instruction. Brilliant artefact, terrible teaching format. |
| **Rails Tutorial** (Michael Hartl) | Single-project narrative through-line: build one thing across the whole book and end with something real. The textbook-quality prose standard. | Monolithic all-or-nothing pacing — if you stop at chapter 7 of 14, you have nothing. We split into sub-courses that each ship a complete unit of skill. |
| **The Odin Project** | Free-forever positioning. Curriculum-as-curated-path through external resources. Strong opinions about order. | Heavy reliance on third-party content (MDN, YouTube). We are responsible for our own pages; we don't outsource the pedagogy. |
| **freeCodeCamp** | Massive-scope free education. Project-based capstones. | Step granularity has drifted toward "type this exact line, click run, move on" — closer to a typing tutor than a programming course in places. |
| **LeetCode** | Volume of focused, runnable problems. Fast iteration loop. | Interview-prep monoculture. Algorithmic puzzle bias warps what learners think "good code" means. We avoid LeetCode-genre pattern-grinding. |
| **Egghead.io / Vue Mastery / similar** | Production-quality short-form lessons — the discipline of "one idea per video". We translate "one idea per video" → "one idea per step". | Same video-cost issue as Frontend Masters. Subscription gating. |

**Net positioning:** Dojo Courses sit at the intersection of Exercism's exercise philosophy, Rustlings' minimalism, and Code School's lost-art of distinct course identities — without the local-CLI requirement, without mentorship as a load-bearing feature, and without the screencast.

### 2.1 What we explicitly do not aim to be

A few platforms we are sometimes compared to but are not modelled on:

- **HackerRank / CodeSignal.** Hiring-funnel platforms. Their content shape (timed, anti-cheat, leaderboarded) is the opposite of what a course should feel like. We ship katas for time-pressure work — and even there, the design intent is "training", not "screening".
- **Replit Learn.** The product is the IDE; the lessons are an afterthought. We are the inverse: lessons are the product, the editor is in service of them.
- **Khan Academy programming.** Brilliant for K-12 / first-exposure learners. Wrong audience for Dojo — we assume literacy, they cultivate it.
- **Stack Overflow / dev.to articles.** Adjacent territory. Articles are reference material; courses are sequenced practice. They complement each other; courses do not replace blog posts and blog posts do not replace courses.

---

## 3. Learning science foundations we apply

We are pragmatic, not academic. The framework leans on six well-established findings. Each maps directly into how Course → Lesson → Step is shaped.

**Deliberate practice** (K. Anders Ericsson). Skill grows from repeated effort at the **edge** of current ability with **immediate, specific feedback**. Mindless repetition does not count. This shapes the entire step model: each exercise step is one new behavior, the test suite is the feedback channel, and Piston returns results in under a second so the loop stays tight. If a step's tests are the same as the previous step's tests with one variable renamed, that step is filler — cut it.

**Cognitive load theory** (John Sweller). Working memory has three competing loads: **intrinsic** (the inherent difficulty of the material), **extraneous** (overhead introduced by the presentation), and **germane** (effort spent building the mental model we want). Our explanation steps strip extraneous load: no clever metaphors, no setup ceremonies, no UI tutorials inside the lesson body. The exercise step's starter code is pre-imported, pre-typed, and signature-complete so the learner spends working memory on the *concept*, not on remembering Go's import syntax.

**Worked example effect** (Sweller, Cooper, Renkl). Novices learn faster from studying a *fully worked* example than from solving an unaided problem. Our explanation steps almost always show a complete, runnable example before the exercise step asks the learner to vary it. The pattern is: *here is a working `slice.Sort()` call → now write one that sorts in reverse*. We do not present "here's the empty function — figure it out".

**Retrieval practice and spaced repetition** (Roediger & Karpicke; later Bjork). Recalling information *strengthens* the memory of it more than re-reading does. We apply this lightly today by **interleaving**: the test for a Lesson 3 exercise will use a function from Lesson 1, forcing the learner to retrieve, not just recognise. A full SRS revisit-card system is a Phase 4+ consideration — we will not ship Anki-in-a-browser as part of v1.

**Desirable difficulty** (Robert and Elizabeth Bjork). Learning that *feels* harder is often more durable than learning that feels smooth. This maps directly to Dojo's intentional-friction brand. We resist the temptation to make every step "click → pass". A learner who never struggled has not learned. The challenge step at the end of each lesson is the explicit place we honor this.

**Feedback specificity** (Hattie & Timperley; Shute). Generic feedback ("wrong!") is essentially useless. Useful feedback identifies *what* was wrong and *why*. Our test cases are written to fail with clear messages — `expected "Hello, Ada" but got "hello, ada"` — and the test runner output is shown verbatim, not summarised. Hints (1-3 per step, optional) explain the *concept* the learner is missing, not the *line* they should type. Hints never give away the answer.

What we deliberately **do not** apply:

- **Learning styles** ("visual learners" / "auditory learners"). Repeatedly debunked — there's no robust evidence that matching modality to preference improves outcomes.
- **Bloom's taxonomy** as a prescriptive ladder. We respect that "apply" is harder than "remember", but we do not annotate every step with a Bloom level. It would be theatre.
- **Gamification literature.** Most published gamification "wins" measure engagement, not retention. Dojo optimises retention.
- **Personalised learning paths driven by an LLM.** Tempting in 2026; deferred. The framework's conviction is that a well-designed linear path beats an algorithmically-shuffled one for someone who hasn't mastered the topic yet. A learner who has mastered it doesn't need our path; they go to the docs.

### 3.1 How the principles map to the schema

A compact reference for the ports between learning science and the existing data model:

| Principle | Concretely shows up as | Anti-pattern this rules out |
|---|---|---|
| Deliberate practice | Each `step` of `type: 'exercise'` tests exactly one new behavior | "Mega-step" exercises that test six things at once |
| Cognitive load (intrinsic) | Lesson ordering — concepts taught before they're used | Exercises that depend on un-introduced syntax |
| Cognitive load (extraneous) | Starter code includes imports, signatures, fixtures | "Set up your environment" steps inside a course |
| Cognitive load (germane) | Hint copy explains the *concept*, not the code | Hints that paste the answer |
| Worked example | `type: 'explanation'` always precedes `type: 'exercise'` for any new concept | "Write a parser" with no parser shown first |
| Retrieval practice | Lesson N tests reference identifiers introduced in lesson N-1 | Each lesson lives in its own hermetic universe |
| Desirable difficulty | The last `exercise` and the `challenge` of each lesson | Every step rated easy — no friction surface |
| Feedback specificity | Test names are sentences; failure messages quote actual values | `assertion failed` with no context |

---

## 4. Course structure taxonomy

### 4.1 Levels

Every course (and every sub-course within it) is tagged with one of four levels.

| Level | Audience | Prerequisites | Typical content |
|---|---|---|---|
| **Basic** | Has programmed before in *some* language. New to this language. | Variables, functions, conditionals, loops in any language. | Syntax, type system basics, the standard library's most-used 20%, idiomatic equivalents of constructs they already know. |
| **Intermediate** | Comfortable in the language. Can ship a small project unsupervised. | Completed Basic or has 6+ months of working experience in the language. | Iterators / generators / streams, error handling idioms, module / package structure, common stdlib pitfalls, test idioms. |
| **Advanced** | Production user. Wants to deepen, not broaden. | Completed Intermediate or 1+ year of working experience. | Concurrency model, performance edges, metaprogramming, the corner cases that bite at 2am. |
| **Specific** | Any level — the topic stands alone. | Stated explicitly per sub-course. | Focused deep-dives that don't slot into a linear progression: "Ruby Metaprogramming", "Go Generics", "Python `asyncio` from scratch", "TypeScript template literal types", "SQL window functions". |

The Specific level exists because not every valuable thing fits a ladder. A learner who knows Go well does not need to repeat Basic to learn Generics — they need a clean, focused, three-lesson sub-course on generics specifically. We don't pretend that's "Advanced".

### 4.2 Sub-course sizing

A **sub-course** is the unit a learner commits to. It's what shows up as a single card on `/learn`.

- **Typical shape:** 3 lessons × 3-5 steps = **9-15 steps** total.
- **Time target:** **2-6 hours** of real practice time. Not "estimated study time". Not "3 weekends". The number we publish is what an attentive intermediate-level reader actually spends, editor open, doing the work.
- **When to split a sub-course in two:** any of (a) more than 18 steps, (b) more than 6 hours of real time, (c) more than one "big idea" — e.g. iterators *and* error handling don't belong together; ship them as two sub-courses.
- **When to merge two ideas into one sub-course:** any of (a) under 6 steps total, (b) under 90 minutes of real time, (c) the topic only makes sense bundled — e.g. `async / await` and `Promise` in TypeScript are conceptually inseparable for a learner; one sub-course.
- **When to kill a sub-course outright:** if you cannot state a one-sentence "after finishing this, the learner can do X" — and X is something they could not do before — the sub-course doesn't exist yet. Refine or drop.

### 4.3 Step type distribution guidelines

For a typical 12-step sub-course we aim for roughly:

| Step type | Share | Count (out of 12) | Purpose |
|---|---|---|---|
| `explanation` | ~30% | 3-4 | Concept introduction with worked examples |
| `exercise` | ~55% | 6-7 | Pass/fail Piston (or iframe) — the load-bearing learning surface |
| `challenge` | ~15% | 1-2 | Optional stretch at the end of a lesson; harder, longer time budget |

These ratios are **starting heuristics, not laws**. Conceptually dense material (e.g. Rust ownership, SQL window functions) leans more on explanation — 40-50% explanation is acceptable. Pattern-practice material (e.g. "iterate, filter, fold across 8 small arrays") leans more on exercises — 70%+ exercise is fine.

What we never accept:

- A sub-course with **zero challenges**. That signals nothing was hard enough to mark.
- A sub-course with **more challenges than exercises**. That is no longer a course; it's a problem set.
- An **explanation step longer than ~400 words** of prose. If you need more, split the concept across two explanation steps with an exercise between them.
- Two consecutive explanation steps with no exercise in between. The learner's hands have to be on the keyboard within ~5 minutes or the format collapses into reading a textbook.

### 4.4 Lesson ordering heuristics

A lesson is a *coherent sequence* of steps inside a sub-course. Ordering matters as much as content.

- **Each lesson visibly builds on the previous.** The new lesson's exercise prereq code or test fixtures should reference the previous lesson's primitives. If you can shuffle the lessons without anything breaking, the curriculum is a list, not a sequence.
- **Each lesson has a "what changed in the learner's head" one-liner.** If the maintainer can't write this in one sentence, the lesson isn't ready.
- **First exercise of a lesson is 80% confidence.** Anyone who actually read the explanation should pass on the first try. This is the trust handshake.
- **Last exercise of a lesson (excluding challenges) is 40% confidence.** Stretch, not wall. Failure here is expected and not punished — there's no progress regression for failing an exercise; you simply re-run.
- **Challenges are *terrain markers*, not progression gates.** A learner who skips a challenge moves on. A learner who beats one knows they've learnt the lesson.
- **Avoid recall-without-warning.** If Lesson 3 expects you to remember a function name from Lesson 1, the explanation step in Lesson 3 must re-surface that name explicitly — never assume the learner remembers something we didn't help them rehearse.

### 4.5 Catalog and discovery

The catalog page (`/learn`) is part of the curriculum, not a UI afterthought. Three rules apply:

- **Cards state level and time on the front.** A learner picks a course in seconds; they need "Intermediate · 3-4 hours" before they need a marketing tagline.
- **Group by language, then by level.** Not by "popularity", not by "newest". Linear progression is part of the pedagogy.
- **Don't show progress as a percentage on the catalog.** A learner who's done 1 of 12 steps does not need a `8% complete` bar shaming them on the home page. Show "in progress" as a binary state. Surface granular progress *inside* the course, not in the catalog.

The catalog page also has a job the framework cares about: it's the only place a learner sees the full shape of a language's curriculum at once. That visibility is what makes intentional gaps (a deferred sub-course, a missing Advanced level) read as deliberate rather than as a content backlog.

---

## 5. Step design rules

These are the rules that govern individual step authoring. Every language file inherits them.

### 5.1 Explanation steps

- **Hard ceiling: ~400 words of prose.** Code blocks don't count toward the budget. If the prose exceeds this, the explanation is doing too much; split it.
- **Show, don't summarise.** Every concept introduced in prose has a runnable code example next to it. "Tuples are immutable" by itself is not allowed; it ships with the two lines that demonstrate immutability.
- **Open with the "why care" in one sentence.** Then the "how". Learners reading on a tired Tuesday evening need the payoff up front.
- **End with a forward prompt.** The last sentence of an explanation step should explicitly set up the next exercise: *"In the next step you'll write a function that does exactly this."*
- **No "we'll see why later" hedges.** If the concept isn't justified now, cut it. Forward references are debt.
- **Markdown depth: `###` is the deepest heading inside a step.** Anything deeper means the step has become a chapter.
- **No invented mnemonics.** No "remember the SOLID principles of ducks". Real names for real concepts.

### 5.2 Exercise steps

- **One behavior per exercise.** The test suite verifies *exactly* that behavior. If you find yourself writing a fifth assertion that checks something orthogonal, you have two exercises.
- **Tests are the feedback channel.** Test names are written as user-facing sentences (`"returns 0 for an empty list"`, not `"test_empty"`). Failure messages are specific (`expected 0, got undefined`, not `assertion failed`).
- **Starter code is a real scaffold.** Function signature present. Imports present. A single well-placed `// Your code here` comment. Never an empty file. Never `// TODO: implement everything`.
- **Hints (1-3 per step) explain *why* the learner is stuck, not *what* to type.** Acceptable: *"`map` returns a new array — it doesn't mutate the original. Are you using its return value?"*. Not acceptable: *"Try writing `return arr.map(x => x * 2)`."*.
- **No hidden tests.** If a test exists, the learner can read it. We don't punish learners for failing assertions they couldn't see.
- **Tests must be deterministic.** No `Math.random()` without a seeded source. No wall-clock dependencies. No network. A test that flakes once teaches the wrong lesson — that the system is unreliable, not the code.
- **Reasonable variable names.** `user`, `tokens`, `events`, `orders`. Not `foo`, `bar`, `baz`. Realistic naming carries a small but real pedagogical signal: the code we're learning to write looks like the code we'll write tomorrow.
- **No quiz-format trivia.** "Which of these is a string method?" is not an exercise. Exercises write code.

### 5.3 Challenge steps

- **Assume the learner just passed everything before.** A challenge can lean on every concept in the sub-course up to that point.
- **Time budget: ~2× a normal exercise.** A 10-minute exercise has a 20-minute challenge sibling. We tell the learner the budget so they don't feel ambushed.
- **Hints: zero, OR exactly one high-level hint.** No hint-laddering on challenges. If the hint isn't enough, the learner is *meant* to go look something up — that's part of the design.
- **Failure is fine.** Challenges are not gates. Skipping or failing them does not block the next lesson. They mark terrain; they don't fence it.
- **Phrase the prompt as a real problem, not a contrived puzzle.** "Fix this event delegation bug" beats "complete the function so all tests pass".

### 5.4 Anatomy of a well-formed exercise step

Every exercise step has six fields. Authors hit all six, in this order, before the step is reviewable:

| Field | Constraint | Failure mode if skipped |
|---|---|---|
| **Title** | One sentence, imperative voice ("Return the number of items in a list"). Becomes the side-bar entry. | Side-bar reads like a syllabus instead of a checklist. |
| **Instruction** | 30-150 words. States the contract: what the function takes, what it returns, what edge cases matter. | Learner spends working memory inferring the spec from tests. |
| **Starter code** | Compiling scaffold. Signature + imports + a single placeholder comment. | Empty file → instant cognitive overload, the "blank page" problem. |
| **Test code** | Deterministic. Uses the language's standard test harness. Test names are user-facing sentences. | Vague pass/fail. Learner can't tell what failed. |
| **Hints** (optional) | 1-3 entries. Concept-level, not implementation-level. Each hint reveals progressively more. | One mega-hint that gives away the answer. |
| **Solution** (optional, hidden until pass) | The reference implementation. Shown only after the learner passes — never as a way out of the work. | Learner submits the solution as their first attempt; learning short-circuits. |

A reviewer who can't fill all six fields without inventing context is reviewing a draft, not an exercise.

### 5.5 Worked example: a single exercise step (TypeScript)

```yaml
title: "Return the longest string in an array"
type: exercise
instruction: |
  Write `longest(words: string[]): string` that returns the longest string
  in the array. If multiple strings tie for longest, return the first one.
  If the array is empty, return an empty string.
starter_code: |
  export function longest(words: string[]): string {
    // Your code here
  }
test_code: |
  import { longest } from './solution'
  import { strict as assert } from 'node:assert'

  test('returns the longest of three distinct lengths', () => {
    assert.equal(longest(['cat', 'fish', 'a']), 'fish')
  })
  test('returns the first on a tie', () => {
    assert.equal(longest(['abc', 'xyz']), 'abc')
  })
  test('returns empty string for an empty array', () => {
    assert.equal(longest([]), '')
  })
hints:
  - "`reduce` lets you carry a 'best so far' through the array."
  - "Compare lengths, not the strings themselves — string comparison is alphabetical, not by size."
```

The shape of this YAML is illustrative — the actual seed format is whatever the language file's author finds clearest. The fields and their constraints are what matter.

---

## 6. Piston integration patterns

Piston is the server-side execution backbone. ADR 014 covers the operational decision; this section covers the *pedagogical* implications — what fits, what doesn't, and how to route around the gaps.

### 6.1 What works well in Piston

- **Pure functions with deterministic input/output.** The 80% case. `add(a, b)`, `parse(...)`, `formatDate(...)`. Trivial to test, trivial to scaffold.
- **Small state machines.** Build a finite-state object, drive it with inputs, assert on the state. Works in every language Piston supports.
- **Parsing and formatting exercises.** Take a string, return a structured value, or vice versa. A goldmine of meaningful, testable, real-world-shaped exercises.
- **Algorithm implementation exercises.** Sort, search, traverse, transform. Bounded inputs make for fast tests.
- **In-process HTTP via stdlib test doubles.** Languages with a `httptest`-style stdlib (Go) or a fake client (Python's `unittest.mock`) can teach HTTP semantics inside Piston. No real network — that's deliberate.
- **Single-file class definitions.** Define a class, instantiate it, exercise its methods. Works across all 6 languages.

### 6.2 What doesn't work in Piston (and how we route around it)

| Limitation | Why | Workaround |
|---|---|---|
| Real network / external APIs | nsjail blocks egress (correctly) | Stdlib test doubles. Mock HTTP clients. Fixture strings instead of live calls. |
| Long-running processes | 15-30s timeouts; not designed for daemons | Restructure to a single-shot, synchronous step. Teach the *concept* of the long-running process; don't try to host one. |
| External package fetching (npm, pip, gem, cargo, go get) | Sandbox is offline; no module download | Stdlib-only exercises. If a library is genuinely essential to the topic, flag the sub-course as deferred until we ship a pre-baked image with the library bundled (Phase 3+). |
| Real concurrency determinism | OS scheduling is non-deterministic; tests would flake | Teach the *shape* of concurrent code (Goroutines, async/await syntax, channel patterns) without asserting on throughput or interleaving order. |
| Filesystem persistence across steps | Each Piston run is a fresh container — nothing carries over | Every step is stateless. Use `testCode` to set up any required fixtures inside that single execution. |
| Browser / DOM APIs | Linux process, no `window`, no `document` | Use the iframe sandbox path. See §6.4 and ADR 016. |
| GUI / graphics output | No display server, no canvas | Same — iframe path for Canvas / WebGL. Native GUIs are out of scope entirely. |
| Real database connections | No Postgres, no MySQL, no Redis available | SQL exercises use SQLite in-query. Other "database" exercises model the data as in-memory structures. |
| Reading user input at runtime (`stdin`) | Piston supports stdin but it complicates step authoring; learners shouldn't be writing CLI prompts | Pass inputs as function arguments. If a CLI is genuinely the topic, structure as "given this input string, what does your parser return?". |
| Heavy memory / CPU exercises | Per-execution limits | Keep input sizes small. Teach algorithmic complexity by *reasoning*, not by benchmarking inside the runner. |

### 6.3 Piston language support matrix

| Language | Version (target) | Test harness | Notes for course design |
|---|---|---|---|
| **TypeScript** | 5.x via `ts-node` | Custom mini-runner + `assert` (stdlib) | Node runtime only — no DOM, no React. DOM courses use `javascript-dom` + iframe. |
| **JavaScript** | Node 20+ | Custom mini-runner + `assert` (stdlib) | Same constraints as TS minus the type system. |
| **JavaScript-DOM** | n/a (browser) | Mini-runner + `postMessage` | Iframe sandbox path — see ADR 016 and Spec 021. Not a Piston language. |
| **Python** | 3.11+ | `unittest` (stdlib) | `pytest` only if the image bundles it; default to `unittest` to stay portable. No external packages. |
| **Ruby** | 3.x | `Minitest` (stdlib) | No Rails, no Sinatra, no gem fetches. Stdlib idioms only. |
| **Go** | 1.21+ | `go test` | Stdlib only. No `go get`. The `testing` package, `httptest`, and `iotest` carry a lot of weight. |
| **Rust** | 1.75+ | `cargo test` (or single-file `#[test]` with `rustc --test`) | `std` only. No `tokio`, no `serde`, no `anyhow`. Async runtimes are out of scope until we bundle an image. |
| **SQL** | SQLite | In-query assertions (`SELECT CASE WHEN ...`) | Not 1:1 with Postgres. Window functions, CTEs, basic aggregates work. Postgres-specific features (`LATERAL`, `JSONB` operators, `DISTINCT ON`) require a future Postgres-backed runner. |

When a language file proposes a sub-course that depends on a missing capability (e.g. a Python sub-course needing `numpy`), the sub-course is labelled **deferred** in that language's file and listed in §10's open questions until a bundled-image plan exists.

### 6.4 When iframe-sandbox is the right target instead

Piston cannot host a browser. Anything DOM-, Canvas-, `window`-, `document`-, `requestAnimationFrame`-, `localStorage`-, or browser-event-shaped runs in an `<iframe sandbox="allow-scripts">` instead — see **ADR 016** and the implementation in **Spec 021**.

The routing rule:

- `course.language === 'javascript-dom'` → frontend `IframeSandboxRunner`, no API call.
- Anything else → `POST /learn/execute` → Piston.

Course authors do not pick the path manually. The frontend `StepEditor` reads `course.language` and routes. Test code for iframe steps follows the `postMessage` contract documented in `docs/wip/IFRAME-TESTCODE-PATTERN.md`. The contract is structurally identical to the Piston test harness; the difference is the transport.

Future browser-native runtimes (Pyodide for Python in browser, Ruby.wasm, etc.) will reuse the iframe pattern. None are committed in v1.

### 6.5 Routing decision flow

When a course author plans a sub-course, the runtime is decided early — it constrains everything else. The flow:

```
Is the topic browser-shaped? (DOM / window / Canvas / browser events)
├── yes → iframe sandbox path
│         language tag: 'javascript-dom'
│         test harness: postMessage mini-runner
│         no API call from frontend
└── no → Piston path
        ├── Does it need an external package? (npm/pip/gem/cargo)
        │   ├── yes → defer the sub-course; flag in §10 of the language file
        │   └── no → pick stdlib test harness for the language (§6.3)
        └── Does it need real concurrency / network / persistence?
            ├── yes → restructure to teach shape, not throughput (§6.2)
            └── no → standard Piston exercise; proceed
```

If you reach "defer the sub-course" twice in a row for the same language, that's signal — surface it in the language file's §5 (known pedagogical pitfalls) and in this document's §10.

### 6.6 Performance and quota expectations

Piston runs are not free. Each one is a container spin-up + execution + tear-down. Per ADR 014: 100-500ms latency, `PISTON_MAX_CONCURRENT=3` by default, 15s run timeout. For course-design purposes:

- **Assume one Run click = one Piston call.** No batching across steps.
- **Don't write tests that intentionally stress the runner.** A 10-second sleep "to demonstrate timeouts" is not pedagogy; it's a denial-of-service rehearsal.
- **The rate limiter applies.** Anonymous learners are capped (see Spec 021's rate limiter test). Course design should not require a learner to make 50 runs to complete a step. If it does, the step is broken.
- **Cold-start isn't our problem to design around.** The first Run of the day for a learner may take longer; that's acceptable. Don't try to "warm" the runner from the frontend.

---

## 7. Voice & style guidelines for course content

Course prose is part of the product. It carries the same brand voice as the rest of Dojo — see `docs/BRANDING.md` and `docs/VISION.md` — adapted for a teaching context.

### 7.1 Tone

- **Direct.** Address the learner as "you". Never "the user", never "students", never "we" when "we" means "you and me, learner-and-author, holding hands".
- **Dry wit acceptable.** Dark humour is on-brand. We do not perform enthusiasm.
- **No emoji. No exclamation marks of celebration.** No "Great job!", no "Let's dive in!", no "Awesome!". The pass/fail indicator is feedback enough.
- **Assume intelligence.** The learner knows what a function is. They know what an HTTP request is in concept. We are teaching language, idiom, and judgement — not first programming concepts.
- **Don't assume prior Dojo knowledge.** A new learner may be on `/learn` for the first time and have no idea what a kata is. Course copy explains its own context.
- **When the learner fails: blame the code, not the learner.** "The function returned `undefined` — the test expected `0`." Not "you forgot to return".

### 7.2 Structural conventions

- **Every explanation opens with the "why care" in one sentence, then the "how".** Learners decide in 5 seconds whether to keep reading. Earn the next 5 seconds.
- **Realistic variable names.** `user`, `tokens`, `events`, `orders`, `invoice`, `session`. Never `foo`, `bar`, `baz`, `myVar`, `temp`, `data`.
- **No invented acronyms.** If the broader engineering community doesn't already know a name, don't coin one.
- **Markdown headings inside a step: max `###`.** Step bodies are short; deeper nesting indicates the step is a book chapter in disguise.
- **Code blocks always specify language.** ```` ```typescript ```` not ```` ``` ````. Ensures syntax highlighting renders correctly in `CoursePlayer`.
- **One concept per code block.** A 60-line code block illustrating four ideas teaches none of them. Split.
- **Quoted error messages are real.** If we show a Rust borrow-checker error, it's the actual error string `rustc` produces, not paraphrased.

### 7.3 Prohibited

- **"As we learned earlier…"** If the learner doesn't remember, the curriculum failed. Re-surface the concept (one sentence) and link forward.
- **"It's easy."** It isn't. Don't lie. Don't gaslight learners who are struggling with something we said was trivial.
- **"Simply / just / obviously."** Same family. These words insult anyone who doesn't find it simple.
- **Quiz-format trivia.** "Which of these is a string method? (a) `length` (b) `slice` (c) `pop`" — no. Exercises write code, they don't bubble-fill.
- **Apologising for the language.** "I know JavaScript's `==` is weird, but bear with me…" — no. Teach the rule. The learner can form their own opinions.
- **Marketing the next sub-course inside a step.** No "Loved this? Try our Advanced course!" CTAs inside lesson content. The catalog page does that work.
- **Dated cultural references.** "Like the show *Friends*, this function has six parameters." We are writing for learners we will never meet, in a language version that will outlive the joke.

### 7.4 Accessibility floor

Course content must clear a baseline of accessibility, not as a check-box but because anything less excludes learners we want.

- **Code blocks have language tags** (so syntax highlighting renders, so screen readers can announce language).
- **Test failure messages render as text**, not as colour alone. "Failed" is announced; red is decorative.
- **Keyboard reachability for the editor and the Run button.** The course player must be operable without a mouse.
- **No essential information in images.** If a diagram is necessary, the explanation step's prose must convey the same content. Images are reinforcement, not substitution.
- **Adequate contrast** in custom accent colours per course (`accentColor` in the seed). Don't pick a yellow that fails WCAG AA against the card background just because it's the language's logo colour.

These are constraints on the framework, not on individual authors — the platform enforces most of them. Authors are responsible for the prose-equivalent-of-images rule.

---

## 8. The per-language course file template

Every language file (`go.md`, `python.md`, `rust.md`, `typescript.md`, `ruby.md`) follows this skeleton, in this order, with these section names:

1. **Learning Philosophy for `<Language>`** — a paragraph or two stating the language's idiomatic teaching priorities. Example: "Go's pedagogy is dominated by the standard library, the `testing` package, and the explicit error return. We do not teach Go as a Java with goroutines."
2. **Course Tree Overview** — a table of all sub-courses with columns: Slug · Level · Lessons · Steps · Time · Status (`shipped` / `planned` / `deferred`).
3. **Sub-courses (detailed)** — one section per sub-course (see template below).
4. **Cross-course exercise patterns** — recurring exercise shapes specific to this language (e.g. for Go: "implement-the-interface" exercises; for Rust: "fix-the-borrow-error" exercises).
5. **Known pedagogical pitfalls** — the things this language gets wrong-taught most often, and how this curriculum specifically avoids them. (e.g. Python: the class-vs-instance mutable-default-argument trap; Ruby: teaching `attr_accessor` before `initialize`.)
6. **External references** — books, language docs, talks, community resources that the curriculum draws from. Real, currently-extant sources only. Linked.
7. **Suggested implementation order** — the order in which sub-courses should be authored and shipped. Dependencies between sub-courses (if any) noted explicitly.

### Per-sub-course detail template

For each sub-course in section 3, document:

- **Slug** (URL-safe, e.g. `python-iterators-generators`)
- **Level** (Basic / Intermediate / Advanced / Specific)
- **Prerequisites** (other sub-courses, or "none")
- **Learner time** (real, not aspirational — e.g. "3-4 hours")
- **Learning outcomes** — bulleted list of "after this, the learner can…" statements
- **Lesson → Step breakdown** — every step listed by title and type (`explanation`, `exercise`, `challenge`)
- **Piston (or iframe) considerations** — anything language-specific the runner needs (test harness choice, stdlib modules, fixture quirks)
- **Reference material** — the specific book chapter, doc page, or talk this sub-course draws from

The sub-course detail is the contract between the maintainer (S5/S2) and the language specialist (S6-S10). When a sub-course is approved at this level, implementation is execution.

### 8.1 Worked example: a sub-course detail entry

What a single sub-course block looks like inside a language file:

```markdown
### Sub-course: Iterators & Generators

- **Slug:** `python-iterators-generators`
- **Level:** Intermediate
- **Prerequisites:** `python-fundamentals` (or equivalent working knowledge of Python functions, lists, and `for` loops)
- **Learner time:** 3-4 hours
- **Learning outcomes:** after this sub-course, the learner can…
  - Distinguish iterables from iterators in Python's data model
  - Implement `__iter__` and `__next__` on a custom class
  - Write generator functions using `yield` and `yield from`
  - Recognise when a generator pipeline is more memory-efficient than a list
  - Avoid the most common iterator foot-guns (consuming a generator twice, mutating during iteration)

#### Lesson 1 — The Iterator Protocol (4 steps)
- 1.1 explanation: "What `for x in xs` actually does"
- 1.2 exercise: "Implement `__iter__` and `__next__` on a `Countdown` class"
- 1.3 exercise: "Make a class iterable using a separate iterator object"
- 1.4 challenge: "Build a `Cycle` iterator that loops forever"

#### Lesson 2 — Generator Functions (4 steps)
- 2.1 explanation: "`yield` turns a function into a generator"
- 2.2 exercise: "Rewrite the Countdown class as a generator function"
- 2.3 exercise: "Implement `take(n, gen)` that pulls the first n values"
- 2.4 exercise: "Use `yield from` to chain two generators"

#### Lesson 3 — Pipelines and Pitfalls (4 steps)
- 3.1 explanation: "Generator pipelines: lazy by construction"
- 3.2 exercise: "Build a 3-stage pipeline that filters, maps, and limits"
- 3.3 exercise: "Detect the bug where a generator is consumed twice"
- 3.4 challenge: "Rewrite a memory-heavy list-comprehension chain as a generator chain"

#### Piston considerations
- Stdlib only. `unittest` test harness.
- No external libraries. `itertools` is in the stdlib and is fair game.
- Tests assert on returned values; no async generators in this sub-course (deferred to a future Specific sub-course on `asyncio`).

#### Reference material
- *Fluent Python* (Luciano Ramalho) — Chapter 17, "Iterators, Generators, and Classic Coroutines"
- Python docs — `https://docs.python.org/3/howto/functional.html`
- PEP 234 (the iterator protocol), PEP 255 (generators)
```

Every sub-course in every language file follows roughly this shape. Length varies; structure does not.

---

## 9. Contribution & quality gate (preview — Phase 3+)

This section is **not active in v1**. Today, all courses are authored by the core team and seeded directly. The note here exists so contributors arriving in Phase 3 (and the panel that designs the contributor workflow) know the bar.

When external contribution opens:

- **Curriculum review (S5 — Dr. Elif Yıldız) must answer:** *"Does the progression respect cognitive load and deliberate practice?"* Sub-courses that violate the step-distribution heuristics (§4.3) without an explicit, documented reason are sent back.
- **Content design review (S2 — Valentina Cruz) must answer:** *"Does the learner leave better than they arrived?"* If the learning outcomes are vague, unmeasurable, or restate prerequisites, the sub-course is rejected.
- **Language-specific review (S6-S10) must answer:** *"Is this idiomatic, current, and free of foot-guns this language is famous for?"* Each language has one designated specialist who signs off; no cross-language hand-waving.
- **Executability gate (automated):** every exercise must compile and pass under Piston (or the iframe runner) in CI. Non-negotiable. A course that doesn't run does not ship.
- **Voice gate (S2):** prose runs through §7's checklist. Emoji, "great job!", and quiz-trivia exercises are auto-rejected.
- **Anti-redundancy review:** new sub-courses that overlap >50% with an existing sub-course must either replace it or be merged. We do not ship two ways to learn the same thing for SEO.

Phase 3 will likely formalise this as a PR template plus a `course.yaml` schema. That work is out of scope for this document.

---

## 10. Open questions

Real questions the framework cannot yet answer. Each will be revisited at sprint planning when it becomes load-bearing.

1. **Tiering.** Do we keep all courses free forever, or does the catalog eventually split into free tier + paid tier (with paid funding the maintenance cost)? Today's stance: free forever, courses are top-of-funnel for the kata invite. Decision needed before the catalog grows past ~10 sub-courses or before a single sub-course requires a third-party API key whose cost we'd absorb.
2. **Spaced repetition.** We acknowledge retrieval practice is real (§3). Do we build in-product SRS — Execute Program-style — or do we leave retention to the learner? Building it means scheduler infra, per-learner cards, notification surface; that's a sprint of work. Decision needed before Phase 4 retention metrics.
3. **Contributor workflow.** §9 sketches the gate. The workflow itself — fork-and-PR vs. in-product editor vs. invite-only contributor pool — is undecided. Tied to whether courses are stored as DB rows (current) or markdown files in the repo (would simplify PR flow).
4. **Course versioning.** When TypeScript 6 ships, when Python 3.13 changes a stdlib idiom, when Rust 2027 edition lands — do we fork the course (`typescript-fundamentals-v5`, `typescript-fundamentals-v6`) or update in place? Forking is honest; in-place is less clutter. Probably hybrid: in-place for minor versions, fork for major.
5. **Translations / localisation.** Today: English-only, by intent. Phase 4 multilingual is plausible. Open: do we wait for community translations or commission them? If commissioned, in which languages first? Spanish is the obvious first candidate given the founder's background, but that's not a curriculum decision — it's a budget one.
6. **Analytics.** We need to know if a course is actually working. Completion rate is a notoriously bad proxy for learning (Codecademy proved this — high completion, low retention). Candidate signals: time-to-first-pass per step, hint-open rate, abandonment-by-step heatmap, return-after-N-days rate. Open: which of these we instrument first, and what privacy posture we publish around them.
7. **Iframe-sandbox `fetch()` surface.** ADR 016 flagged this — the current sandbox can make outbound `fetch()` calls. Acceptable for first-party content, unacceptable once contributors can ship steps. Resolution required before §9's Phase 3 contribution opens.
8. **Anonymous learner identity.** localStorage progress is fine for v1. But it loses progress on browser change, on incognito, on cache clear. Question: do we offer a lightweight "save progress" affordance (magic-link email, no full account) before forcing GitHub OAuth? Trade-off: friction vs. data loss complaints.

These eight are the live ones. They will be promoted to ADRs / specs as their answers become urgent.
