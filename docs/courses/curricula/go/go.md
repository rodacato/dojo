# Go — Authoring Spec

> Executable authoring brief for the `go` scroll — the dojo's Go crash course, the **fifth and final language scroll**.
> Inherits the Go Course Authoring Profile from [`../go.md`](../go.md) §2. Template: [`../../authoring-spec-template.md`](../../authoring-spec-template.md). Framework: [`../../README.md`](../../README.md). Direction: [ADR 022](../../../adr/022-crash-course-pivot.md) + Sprint 029 decisions ([`../../../sprints/current.md`](../../../sprints/current.md)).
>
> ---
> **✅ Graduated to canon 2026-06-19** from `.kwik-e/tmp/curricula-drafts/go/`. Drafted + expert-reviewed (Kenji/Elif lens; Go semantics verified — value-receiver-via-interface → `0`, loop-capture → `3 3 3` on 1.16, stdlib surface). Was parked pending the scrolls presentation reshape (S030); that closed, so it graduated here for authoring. **Author prose + per-lesson seed from this spec — smoke each batch against Piston Go 1.16.2.**
>
> **Decisions ratified at sign-off (§7):** capstone = **Option A (sequential, `io.Reader` input, integrates L1+L2+L3; the goroutine gesture G3 lives only in kata 4.4)** — chosen over the goroutine-fan-out capstone to avoid the "author's cleverness, not learner's competence" trap (README §5.3). §7 #1 (drop the worker-pool challenge; 4-step Lesson 4), #2 (keep loop-capture predict+broken→fix WITH the mandatory 1.16-vs-1.22 version caveat), #4 (author to 1.16.2, smoke-first) — all ratified. The body below reflects Option A.
> ---
>
> **Spec-drafted 2026-06-19** (polyglot-first, scoped against the S029 conventions the other four scrolls now share). This brief supersedes the `.kwik-e/tmp/curricula-drafts/go/` scratch (informs-scope-only, not canon) on three load-bearing points: (1) **sandbox truth corrected to Piston Go 1.16.2** — the scratch assumed 1.21+ throughout (`slices`/`maps`/`cmp`, `net/http.ServeMux` 1.22 patterns, the 1.22 loop-variable fix as "the answer becomes a"). All of that is void; see §5 and the §7 honesty audit. (2) **Manual `_t`/`_eq` harness with an echo-free `__DOJO_RESULT__` footer**, consistent with Ruby/Python/Rust — the scratch's "use Go's `testing` package, no manual harness needed" is wrong for this sandbox (`go run`, not `go test`). (3) **No from-scratch exception** — Go does not inherit Rust's S028 grant; every concept is a delta from a model the polyglot already holds.

## Header

```yaml
slug: go
title: "Go"
kind: language-scroll
language: go
sandbox: piston                    # Go 1.16.2, `go run` single file, stdlib-only, PRE-generics
prereqs: []
audience: "polyglot developer who already programs in another language"
learner_time: "~100 minutes (60-120 range, mid-band)"
status: published (S031). 20 steps across 6 lessons (the 1.5 playground was cut at seed — §2.4; L5 = 2 steps); all 10 katas + 2 challenges smoke green vs Piston Go 1.16.2 (validated=64). §7 decisions ratified (capstone A).
maintainers:
  - S6 Kenji Watanabe              # language pedagogy (errors-as-values, structural interfaces, concurrency restraint)
  - S5 Elif Yıldız                 # curriculum architecture
  - S2 Valentina Cruz              # content quality
  - S11 Maya Lindqvist             # predict / playground / read+inline review
primary_audience:
  - A1 Mariana Vargas              # JS/Node senior
  - A2 Esteban Morales             # Python mid-senior
  - A3 Yui Tanaka                  # Java senior
secondary_audience:
  - A4 Felipe Reyes                # TS modernizer (Go is parallel to his path, not next)
```

---

## 1. Learning Outcomes

After finishing this scroll, the learner can…

- Locate Go on their internal language map: what it's for (services, CLIs, infra tooling — `kubectl`, `terraform`, `docker` are all Go), where it doesn't fit (heavy numerics, embedded, GUI), what `go mod` / `go build` / `go test` do, why `gofmt` ends the formatting debate, and **what version family the sandbox runs (1.16.2) vs current Go** — so they know which idioms in this scroll are sandbox-pinned and which are how real Go is written today. Predict the first command to run on a cloned Go project.
- **Treat errors as values — the load-bearing outcome; the whole scroll's voice rests on it.** Return `(T, error)` from any fallible function, propagate with `if err != nil { return ..., err }`, build a sentinel with `errors.New` and compare with `errors.Is`, carry data with a typed-error struct and extract with `errors.As`, wrap with `fmt.Errorf("context: %w", err)`. Recognise the try/except reflex and explain *why* Go rejects it. **Predict the typed-`nil`-is-not-interface-`nil` trap and explain the `(type, value)` model behind it.**
- Read and design small interfaces: satisfaction is structural (no `implements`), interfaces are declared at the consumer, "accept interfaces, return structs" is the default shape, and `io.Reader`/`io.Writer` are the canonical example of why small interfaces compose. Recognise that the `error` they used in Lesson 1 *was* an interface.
- Define structs and methods with the right receiver: pointer when mutating, value when cheap-to-copy, **never mix within a type**. Use struct embedding for composition and explain why it is NOT inheritance. Predict why a value-receiver method invoked through an interface holding a pointer fails to mutate.
- Read and reason about the **zero value**: every type has one, `nil` is the zero value of pointers/slices/maps/interfaces/channels/funcs, a `nil` slice is usable and a `nil` map panics on write — and design types so the zero value is useful (`bytes.Buffer{}` is ready to write).
- Read and write Go concurrency at crash depth: `go f()` schedules; an unbuffered channel is a synchronous handoff; `select` chooses among ready operations; only the sender closes. Recognise the canonical traps — **loop-variable capture (a LIVE footgun on 1.16, fixed only in 1.22), send-on-closed-channel panic, leaked goroutine on early return.** `sync.Mutex`/`WaitGroup`/`context` named-and-deferred to the concurrency deep-dive.
- **Beat the capstone** (§4 Lesson 5): one small real deliverable integrating Lessons 1, 2, and 4.
- Name the deferred footguns (`panic`/`recover` as exception substitute, `init()` magic, reflection, `any`/`interface{}` as escape hatch, generics-as-default, missing `%w` wrapping, `sync`/`context` at depth) and which deep-dive owns each.

Each outcome maps to at least one kata, `predict`, playground, or challenge step in §4. Outcomes without a step are aspirational and must be cut or backed by a step.

---

## 2. Sub-course Authoring Notes

Inherits the Go Course Authoring Profile ([`../go.md`](../go.md) §2) — voice (Go-the-production-language, stdlib-first), step density (~200-300 words per `read`, tighter than Ruby), the four pedagogical bets, and the no-`trace` exclusion. Explicit local gates below, written to the S029 conventions the other four scrolls now share.

### 2.1 The "boring-path test" — gate for every code sample

Before any code sample (read step, kata starter, kata solution, predict snippet, playground) ships, it passes:

> *Is this the most boring way to do it that still works under Go 1.16.2? If a cleverer pattern shows up before the boring one, the prose must justify why — otherwise it's teaching the wrong thing.*

This is the Go equivalent of Ruby's paragraph test and Rust's borrow-check test — the load-bearing rule against Go pedagogy's specific failure mode, which is not tour-guide prose (Go has little surface to tour) but **teaching the clever pattern when the boring one would do**. ✅ `if err != nil { return nil, fmt.Errorf("fetch %s: %w", url, err) }` repeated; the repetition IS the lesson. ❌ an `errgroup.Group` fan-out when `sync.WaitGroup` + a results slice is the boring version (and `errgroup` isn't even stdlib). ❌ a generic `Map[T, U]` deduplication — doubly wrong here because **generics do not exist on 1.16.2**. Same rule applies to interface design in starters: prefer the smallest interface that compiles; an `io.Reader` parameter never read from is the wrong interface.

Valentina (S2) enforces this at review.

### 2.2 The delta gate (the S028 from-scratch exception does NOT apply here)

Rust earned a one-model-from-scratch exception (ownership) because the compiler co-authors that teaching. **Go inherits none of it.** Every paragraph teaching a Go concept must frame it as a delta from a model the primary personas already hold:

- errors-as-values ≈ the try/except / try/catch they reach for, *removed* — Go forces the caller to decide explicitly, in code that's right there.
- structural interfaces ≈ Java/C# interfaces, *minus the `implements` keyword* — satisfaction is inferred, not declared.
- struct embedding ≈ the inheritance they'd reach for, *replaced by composition* — promotion looks like inheritance and isn't (no virtual dispatch, no `super`).
- goroutines/channels ≈ the async model they already hold (Promises/`async-await` for Mariana/Felipe, threads/`ExecutorService` for Yui, `asyncio`/threads for Esteban), *reframed* — `go f()` is not `await`, a channel is not a Promise.
- zero values ≈ the `null`/`None`/uninitialised-field model they hold, *made total and usable* — every type has a zero value and it's often the one you want.

A from-scratch "what is an interface" or "what is concurrency" paragraph is out of contract: rewrite as delta or cut. Authors citing this spec as precedent for a from-scratch exception elsewhere get pointed at the S028 decision (Rust-scoped, zero precedent for Go/TS — see [`../rust/rust.md`](../rust/rust.md) §7).

Valentina (S2) enforces the delta framing; Kenji (S6) enforces that each delta names the *specific* polyglot reflex, not a generic one.

### 2.3 `predict` placement

**Four predicts — Lessons 0, 1, 3, 4 (≈20% of 20 steps).** Slightly above the 10-15% heuristic, defensible because Go's surprise surface is genuinely large and concentrated in a few traps the polyglot will hit in their first week. The Maya test (S11) applies to each: a learner who skipped it must lose something the prose can't cheaply give. Predict option discipline per [`../../INTERACTIVITY-PATTERNS.md`](../../INTERACTIVITY-PATTERNS.md) §predict — every wrong option encodes a *specific* polyglot reflex, never a generic "compile error" / "undefined behavior".

- **0.2 — "You cloned a Go project. What do you run first?"** Orientation predict (the only non-output-shaped one). Correct: `go run .` (run the program in the current directory) **or** `go test ./...` if the README says "run the tests" — the snippet fixes the intent so the answer is unambiguous; pick one framing at authoring and commit. Wrong options encode: `go build` (the compile-first C/Java reflex — produces a binary, doesn't run it), `go mod download` (technically valid but unnecessary — Go fetches on demand), `go get` (the `npm install` reflex — modifies deps). **Sandbox-honesty caveat baked into the reveal:** the dojo sandbox runs single-file `go run`, so the learner won't type `go mod` here — but the real-project answer is the one being taught.
- **1.2 — "What does this print?"** the typed-`nil`-vs-interface-`nil` classic: a function returns a typed `nil` pointer as `error`, the caller's `if err != nil` is *true*. Correct: it prints the error branch. Wrong options encode: the Python `is None` reflex ("the check is false, the pointer is nil"), the Java NPE reflex ("compile error / nil-pointer panic"), and a defensive-C reflex ("runtime panic on deref"). The reveal teaches the interface-value `(type, value)` model — **surprise-first; Lesson 2 then names the model the learner just met.** First output-prediction reveal.
- **3.2 — "What does this print?"** value-receiver method invoked through an interface holding a pointer; the mutation is lost. Correct: prints the *unmutated* value. Wrong options encode: the Java/C# reflex ("methods always mutate the receiver → prints the mutated value"), and a compile-time reflex ("`*T` can't satisfy a value-receiver interface → compile error"). The reveal teaches that `*T`'s method set includes value-receiver methods (which is why it compiles) and that the body operates on a copy.
- **4.2 — "What does this print?"** loop-variable capture: `for i := 0; i < 3; i++ { go func() { print(i) }() }` with a `sync.WaitGroup` to join. **Correct on Go 1.16.2 (the sandbox): `3 3 3`** — the loop variable is shared across iterations, all goroutines close over the same `i`, which is `3` by the time they run. Wrong options encode: the JS `let` reflex ("`0 1 2` in order"), the "`0 0 0`" misread ("the goroutines ran before any increment"). **The reveal MUST state the version contract explicitly:** this is the real behavior on the sandbox's 1.16, *and* Go 1.22 (Feb 2024) changed loop-variable scoping so the same code prints `0 1 2` on current Go — one of the few backwards-incompatible changes the language has made. Teaching the trap on 1.16 is honest: most production codebases the polyglot will read still predate the 1.22 fix, and the *reason* (shared closure variable) is the transferable lesson. See §7 for the open call on whether this belongs in crash vs deep-dive.

Lessons 2 and 5 carry no predict — both are mechanical enough (interface satisfaction; the test-shape refactor) that a predict would fail the Maya test. Forcing one would be decoration.

### 2.4 Playground as `kata` variant (inherited from Ruby/Python/Rust)

**Playground (step 1.5) — designed below, CUT at seed (S031).** The cut path this section pre-authorized (line below) was taken: 1.5 was dropped and Lesson 1 re-budgeted to 4 steps, so the shipped scroll is 20 steps with no playground. The `%w`/`%v` discovery it carried now rests on read 1.1 + kata 1.4's prose. The design is kept here as canon for when a future scroll restores the pattern. Original contract: a `kata` with `data.kind: "playground"`, verdict UI hidden, run button reads "↻ Try it", trivially-true harness assertion so the backend stays uniform. The instruction pre-loads specific expressions to run and vary, with motivation — Maya (S11) blocks any playground whose instruction reduces to "play around".

- **1.5 playground — error wrapping, `%w` vs `%v`.** Starter pre-loads `fmt.Errorf` with `%w` and with `%v`, then `errors.Is` and `errors.Unwrap` over both. The learner runs it, sees `errors.Is` find the inner error through `%w` but not through `%v`, then is invited to wrap-a-wrap and confirm the chain survives. The discovery — *`%v` is a string format, `%w` is a wrap* — is the one thing prose can't teach as cheaply as one run.

The scratch draft proposed a **second** playground in Lesson 5 (`httptest` exploration). **Cut at outline** — for two reasons, both load-bearing: (1) on Go 1.16.2 with single-file `go run` and no guarantee of loopback networking (see §5), `httptest.NewServer` may not even run in the sandbox; an `httptest` playground that might not execute is not a playground. (2) it pushed the scroll past budget. If the playground pattern has been retired by seed time, drop 1.5 and re-budget Lesson 1 to 4 steps.

### 2.5 Hint discipline (+ tiered hints where katas bite)

> *A hint must NOT name the exact method, operator, or syntax that solves the kata. If removing the hint would not change which Go identifier the learner types, the hint is the solution.*

❌ `errors.Is(err, ErrNotFound) chequea identidad de sentinel — esa es tu solución.` (names the function *and* its argument). ✅ *"Querés saber si tu error envuelve a `ErrNotFound` aunque haya capas de wrapping. El package `errors` tiene una función para exactamente eso — empieza con 'Is'."* Same rule for `instruction`: it states what to build; a learner who got the answer from the instruction alone never wrote any Go.

**Tiered hints (`hints: string[]`), per [`../ruby/ruby.md`](../ruby/ruby.md) §2.4 and [`../../INTERACTIVITY-PATTERNS.md`](../../INTERACTIVITY-PATTERNS.md) §"Progressive hint reveal".** Tier 1 (auto-opens on first failed run) obeys the gate verbatim — points at *where to look*, never names the solving identifier. Tier 2 (second failure) is the last nudge before the still-gated solution — it may name the method or operator (e.g. `%w`, `errors.As`, "pointer receiver") but must not write the full solving expression. `hints` falls back to `[hint]` for unconverted katas. **Converted to tiered in this scroll** (the katas that genuinely bite): **1.4** (`%w` wrapping — the verb is the whole point), **3.3** (pointer receiver — the trap the predict primed), **4.4** (`select` shape). The rest keep a single `hint`.

Applies to all katas, Lessons 1-5; authoring against this gate is a precondition for seeding.

### 2.6 Broken→fix discipline (Go is compiled — default is write-from-scratch / fail-by-design)

Like Rust, Go is compiled, so the **default kata shape is write-from-scratch**, and where a starter intentionally won't compile (or won't pass), the brief is the **compiler/test failure itself** — read it, fix it. That fail-by-design shape is NOT the same device as broken→fix: broken→fix plants a *logic bug that looks right and runs*, to be spotted by inspection.

Per [`../ruby/ruby.md`](../ruby/ruby.md) §2.4.1 and [`../../INTERACTIVITY-PATTERNS.md`](../../INTERACTIVITY-PATTERNS.md) §"Broken→fix katas", reach for broken→fix **only** where a planted bug embodies a genuine Go gotcha AND the fix teaches the idiom. Go has exactly three gotchas that meet that bar — and they map cleanly onto the three predicts, which makes broken→fix the natural *kata-after-the-predict*:

| Candidate broken→fix kata | Planted bug = the misconception | Fix teaches | Marked in §4 |
|---|---|---|---|
| **3.3 `Counter` mutation** | value receiver — `Inc()` mutates a copy, `Value()` returns 0 | switch to pointer receiver | **broken→fix** (the 3.2 predict primed exactly this bug; the kata makes the learner fix it) |
| **4.3 loop-capture fan-out** *(candidate — see §7)* | a goroutine fan-out that captures the loop variable and reports garbage | capture per-iteration (pass `i` as an arg, or shadow `i := i`) | **broken→fix candidate** — strongest broken→fix in the scroll IF loop-capture stays in crash scope; if §7 defers loop-capture to the deep-dive, 4.3 reverts to write-from-scratch fan-out |

Everything else is **write-from-scratch**: 1.3 (`Divide` sentinel), 1.4 (`ParseAge` + `%w`), 2.2 (`WriteHello`), 2.3 (`CountLines`), 2.4 (`Notifier` challenge), 3.4 (embedding), 4.4 (`WithTimeout`), 5.2 (the test-shape kata is itself a refactor, not a planted-bug fix). A planted bug there would fight the lesson (the idiom is carried by signature clarity), per the §2.4.1 bar. **Do not homogenize** — the format mix (predict / write-from-scratch / broken→fix / playground / challenge) is a feature.

### 2.7 Footgun deferral discipline

Every named-but-not-taught topic gets **one sentence**: the failure mode + a deep-dive slug (placeholder slugs anchor the deferral honestly).

| Topic | Surfaces where | Footgun named | Deferred to |
|---|---|---|---|
| `panic`/`recover` as exceptions | Lesson 1 read (named on entry) + Lesson 5 closer | reaching for `panic` as a `throw` substitute; legit only for unrecoverable invariants + HTTP recovery middleware | `go-errors-deep` |
| `sync.Mutex`/`WaitGroup`/`Once` | Lesson 4 read + Lesson 5 closer | channels-vs-mutexes is not good-vs-bad; both have a place | `go-concurrency-deep` |
| `context.Context` | Lesson 4 read + Lesson 5 closer | cancellation/deadline propagation; half-teaching it is worse than deferring | `go-concurrency-deep` |
| Generics (type params, constraints) | Lesson 2 read (one line) + Lesson 5 closer | **does not exist on the sandbox's 1.16.2**; reaching for it writes Java-in-Go | `go-generics-when-justified` |
| `any` / `interface{}` as escape hatch | Lesson 2 read | the dynamic-language reflex; useful at `fmt`/library boundaries, never the default in your own code | `go-generics-when-justified` / prose |
| `init()` functions | Lesson 5 closer | action at a distance — named only to say "we don't teach this because you shouldn't use it" (Adrian's flagged strongest opinion) | (no deep-dive — external docs) |
| `reflect` | Lesson 5 closer | how `encoding/json`/`fmt` introspect; you won't write it in year one | `go-errors-deep` / external |
| `cgo` / `unsafe.Pointer` | Lesson 5 closer | the FFI boundary; out of scope for a crash | external docs |
| `gin`/`echo`/`testify`/`gorm` | Lesson 0 read + Lesson 5 closer | the stdlib *is* the framework; you don't need them yet (and the sandbox can't fetch them) | — |
| `go test` / table-driven tests / `httptest` | Lesson 0 read (sandbox honesty) + Lesson 5 read | the manual `_t`/`_eq` harness is a sandbox workaround, not how real Go tests | `go-testing-and-fuzz` |

### 2.8 Production-gesture audit (README §4.4, done at outline)

The 2-3 gestures a working Go developer performs daily. Each is **written in a kata** — not read about:

| # | Gesture | Written in |
|---|---|---|
| G1 | Define a struct + a method with the right receiver | Kata 3.3 (`Counter` with pointer receiver); kata 3.4 (`Logger`/`Server` embedding); capstone 5.3 (the `Summary` struct + method) |
| G2 | Handle an `error`-value return: check `if err != nil`, return/wrap, inspect with `errors.Is`/`errors.As` | Katas 1.3 (sentinel), 1.4 (`%w` wrap); held as the return-shape default in every later kata; capstone 5.3 |
| G3 | Use a goroutine + a channel to coordinate | Kata 4.4 (`WithTimeout` — goroutine + `select` over a channel). **Sole written home of G3** (capstone is sequential — see §7 decision 3) |

A fourth daily gesture — **accept an interface** (`io.Reader`/`io.Writer` as a parameter) — is written in katas 2.2 and 2.3, **and in the capstone** (its input is an `io.Reader`). Audit verdict: no gesture is read-only; the scroll passes §4.4. The capstone integrates **G1 + G2 + G4** (struct+method, error-value return, accept-interface) — three gestures at scroll level without a contrived goroutine; G3 stands alone in kata 4.4.

### 2.9 Stdlib-only, version honesty (Go 1.16.2 — the hard constraint)

Only the standard library, under **Go 1.16.2**, single-file `go run`. No `go get`, no module proxy, no third-party libraries. **Pre-generics:** no type parameters, no `slices`/`maps`/`cmp` packages, no `any` keyword (use `interface{}` — `any` is a 1.18 alias). The `errors` API is the 1.16 surface: `errors.New`, `errors.Is`, `errors.As`, `errors.Unwrap`, and `%w` in `fmt.Errorf` (all present since 1.13 — safe). `errors.Join` (1.20) is **not** available. Any idiom stabilized after 1.16 appears **only in prose with a "newer Go" marker — never in a kata**, mirroring Rust's §2.9 rule. Authors check stabilization versions against the release notes before putting any API in starter/test/solution code. **Confirm the exact patch (1.16.2) and stdlib surface at the first smoke before seeding any lesson** — see §5 and §7.

---

## 3. Retrieval & Cross-references

- **From prior scrolls:** none — entry scroll of the Go track.
- **Within this scroll:**
  - Lesson 1's `error` interface (`type error interface { Error() string }`) is named in read 2.1 as "the smallest useful interface — you already used one in Lesson 1, you just didn't call it that." The learner recognises the forward hook, not a forward reference.
  - Lesson 1's `if err != nil` return shape is the silent default of every later kata's signature; read 2.1, 3.1, 4.1 each lean on it without re-teaching.
  - Lesson 2's `io.Writer` reappears in Lesson 3's embedding kata (`Logger` holds an `io.Writer` field) and in the capstone — used, never re-taught.
  - Lesson 3's struct-literal syntax is named in read 5.1 as the shape the harness's own assertion data uses — surfacing the connection in one sentence.
  - Lesson 3's value-receiver predict (3.2) is the brief for kata 3.3 (broken→fix): the predict primes the trap, the kata fixes it.
  - Lesson 4's loop-capture predict (4.2) is the brief for kata 4.3 IF that candidate broken→fix ships (§2.6, §7).
- **Forward hooks:** the §2.7 deferral table; `sync`/`context`/`errgroup` → `go-concurrency-deep`; `http.Handler` composition + JSON API → `go-net-http-deep`; generics → `go-generics-when-justified`; `t.Helper`/`t.Cleanup`/fuzzing → `go-testing-and-fuzz`; `go mod` at depth → `go-build-and-modules`; error wrapping at depth (`errors.Is`/`As` invariants, sentinel-vs-typed-vs-join) → `go-errors-deep`.

---

## 4. Lessons

Step totals (as shipped): L0 2 · L1 4 · L2 4 · L3 4 · L4 4 · L5 2 = **20 steps** (10 writing steps = 8 katas + 2 challenges incl. capstone + 4 predicts + ~6 reads). The 1.5 playground was cut at seed (§2.4); L1 re-budgeted to 4. Time ≈ 100 min (mid-band). **Exercise share:** writing steps ≈ 10 of 20 ≈ **50%** — meets the framework floor (the Rust 48% exception is Rust-scoped; Go holds ≥50% per the S028 condition). **Remaining cut order if over budget:** trim read 5.1 → fold predict 0.2 into read 0.1 as a `read+inline` micro-quiz. **Katas are not on the cut list.**

> **Time-arithmetic note (recompute at prose stage):** Go's per-step surface is small, so reads run shorter than Rust's (~200-300 words). Rough accounting — reads ~25 min, predicts ~10 min, playground ~5 min, capstone ~20 min — leaves ~40 min for ~9 non-capstone katas (~4.5 min each). Per-step budgets get recomputed once prose exists.

### Lesson 0 — Go in context

> *What changes in the learner's head:* "I know whether Go earns my Friday, what `go mod`/`go build`/`go test` do, that `gofmt` ends the formatting debate, and exactly what this sandbox can and can't run — including that it's an older Go (1.16) without generics — before I invest in syntax."

**Step distribution:** 1 `read`, 1 `predict` = 2 steps. No kata — orientation, not drilling (Python/Rust precedent: one ruthless read beats two comfortable ones).

#### Step 0.1 — `read` — "What Go is for, how it runs, and the sandbox contract"

- **why_care:** before 100 minutes of idioms, the polyglot needs the is-Go-for-me paragraph, the toolchain map, the `gofmt` cultural fact, and — load-bearing — the sandbox version contract.
- **body topics (~280 words, hard ceiling 400):**
  - **Sweet spot / not:** services (HTTP/gRPC backends without a JVM), CLI + infra tooling (`kubectl`, `terraform`, `docker`, `hugo` are Go), anything where a single static binary and fast startup are features. Not: heavy numerics (Python/Julia), embedded (C/Rust), GUI desktop (no canonical toolkit), one-off scripts (the binary is deploy-friendly but script-hostile). Design choices, not slights.
  - **Toolchain in one breath, one cross-language analog each:** `go build` (compile to a static binary), `go run` (compile + run, the learning/inner-loop command), `go test` (discovers `func TestXxx` by signature — no external runner), `go mod` (modules; `go.mod`+`go.sum` ≈ `package.json`+lockfile / `pyproject.toml`+lock), `go get` (add a dep — *not available in this sandbox*). Which command to run first is deliberately NOT stated here — predict 0.2 owns that reveal.
  - **`gofmt` cultural fact:** mandatory, not debatable. The "Prettier vs StandardJS vs Biome" debate does not exist in Go. `gofmt -w .` and the debate ends; editors run it on save.
  - **Sandbox honesty (load-bearing, the corrected S029 truth):** "This scroll runs **Go 1.16.2** in the sandbox, stdlib-only, single-file `go run` — no `go get`, no third-party libraries (`gin`/`echo`/`testify` named only to be excluded), no `go test` (the scroll uses a small manual harness; real Go tests with `func TestXxx` are deferred to `go-testing-and-fuzz`). **1.16 is pre-generics** — no type parameters, no `slices`/`maps` packages; where modern Go has something newer (generics 1.18, `errors.Join` 1.20, the 1.22 loop-variable change) the prose marks it *newer Go* and you won't be asked to run it. On your machine, install current Go; nothing in this scroll breaks on it — but a couple of behaviors (loop-variable capture, Lesson 4) are *different* on current Go, and the prose flags exactly where."
  - **NOT to include:** "Go is fast" (every language says that), Go-vs-Rust, Plan 9 history, "Go is opinionated". Per §2.1.
- **voice_check:** every paragraph survives the boring-path test; the toolchain paragraph names each analog exactly once; the sandbox paragraph states 1.16.2 + pre-generics + manual harness explicitly (not buried).

#### Step 0.2 — `predict` — "You cloned a Go project. What do you run first?"

- **snippet:** shell session — `git clone`, `cd`, `ls` revealing `go.mod`, `go.sum`, `main.go`, `internal/`, then `???`. README says "Go 1.21+ required; run the tests."
- **options:** (a) `go build` (b) `go run main.go` (c) `go test ./...` (d) `go get`.
- **correct:** c (the intent is fixed to "run the tests" so the answer is unambiguous; `go test ./...` runs every package's tests and fetches deps on demand).
- **feedback:** per §2.3 — each wrong option names its reflex (compile-first / just-run-it / add-a-dependency) and what the command actually does. Reveal carries the sandbox-honesty caveat: in *this* sandbox you run single-file `go run`, but the real-project muscle is `go test ./...`.

---

### Lesson 1 — Errors as values: the try/except reflex you unlearn

> *What changes in the learner's head:* "Go has no exceptions. `error` is a return value and `if err != nil { return ..., err }` is the language's load-bearing convention, not boilerplate. I can wrap with `%w` so the caller still finds the original, match a sentinel with `errors.Is`, extract a typed error with `errors.As`. And I just saw that a typed `nil` is NOT an interface `nil` — the thing that bites everyone once."

**Step distribution (as shipped):** 1 `read`, 1 `predict`, 2 `kata` = 4 steps (the 1.5 playground was cut at seed — §2.4). Errors-first because it's the most viscerally surprising idiom for a Python/Java/JS dev and it appears in every later kata (Kenji's S6 sign-off: errors-before-interfaces, with the `error` interface as Lesson 2's motivating example — a forward hook, not a forward reference).

#### Step 1.1 — `read` — "Errors are values"

- **body topics (~280 words):** the convention (`(T, error)` return; caller checks `if err != nil`; no `throw`/`try`/`catch` — design, not missing feature); **the polyglot reflex named explicitly** (§2.2 — "your hand is reaching for try/except; stop"); the repetition-is-the-point framing (verbose on purpose; every fail-path visible in source); the `error` interface (`type error interface { Error() string }` — the simplest useful interface, Lesson 2 makes the model explicit); sentinels (`var ErrNotFound = errors.New("not found")`, compared with `errors.Is`, never `==` because wrapping breaks identity); typed errors (a struct with `Error() string`, extracted with `errors.As`); **wrapping** (`fmt.Errorf("context: %w", err)` preserves the chain; `%v` does NOT — *use `%w` by default*, the single most common Go mistake); `panic`/`recover` named-and-deferred in one sentence (§2.7). Ends with a cliffhanger pointing at predict 1.2 ("what happens when a function returns a *typed* nil pointer as an `error`? the answer surprises everyone once").
- **figure (committed):** `before-after` — left: a polyglot's instinct, a Go function pretending to `panic`/swallow on failure (the smell); right: the same function returning `(T, error)` with the `if err != nil` caller (the idiom). Pedagogy lives in the contrast: explicit fail-path vs hidden one. (Reuses the catalog `before-after`; per-line `✕`/`✓` annotations.)
- **voice_check:** every sample compiles under 1.16.2 (or is the deliberate cliffhanger); `%w` vs `%v` stated as a rule, not a footnote.

#### Step 1.2 — `predict` — "What does this print? (typed-`nil` vs interface-`nil`)"

- **snippet:** a `*MyError` with an `Error()` method; `func doSomething() error { var err *MyError = nil; return err }`; `main` checks `if doSomething() != nil { print "got an error" } else { print "no error" }`.
- **options:** (a) `got an error` (b) `no error` (c) compile error (d) runtime panic (nil deref).
- **correct:** a. An interface value is a `(type, value)` pair; even with `value == nil`, the `type` is `*MyError` (non-nil), so the interface is not nil. Feedback per §2.3: (b) Python `is None` reflex, (c) Java NPE reflex, (d) defensive-C deref reflex — each named and corrected. Reveal teaches the `(type, value)` model and the fix (return a bare `nil`, not a typed nil pointer). **First output-prediction reveal; sets up Lesson 2's interface model.**

#### Step 1.3 — `kata` — `Divide(a, b int) (int, error)` *(write-from-scratch; production gesture G2)*

- Define `var ErrDivByZero = errors.New("division by zero")` at package level (pre-defined in the starter so the lesson's work is the return mechanics, not naming). Implement `Divide` returning `(0, ErrDivByZero)` when `b == 0`, else `(a/b, nil)`.
- Tests (manual harness, §5): `10,2 → (5, nil)`; `7,0 → (0, ErrDivByZero)` asserted via `errors.Is`; `-6,3 → (-2, nil)`.
- Single `hint` (§2.5): points at returning a specific identifiable error and at Go's multi-return syntax — without writing `(0, ErrDivByZero)`.

#### Step 1.4 — `kata` — `ParseAge(s string) (int, error)` with `%w` *(write-from-scratch; tiered hints)*

- Implement `ParseAge`: parse `s` with `strconv.Atoi`, validate 0-150 inclusive. On parse failure, **wrap**: `fmt.Errorf("parse age %q: %w", s, err)`. On range failure, return an unwrapped `fmt.Errorf("age %d out of range", n)`.
- Tests: `"25" → (25, nil)`; `"abc" → (0, err)` asserted via `errors.Is(err, strconv.ErrSyntax)` — **`%v` fails this test**, with a specific message about the broken wrap chain; `"200"`/`"-1" → out-of-range`. **Confirm at smoke that `strconv.Atoi` on 1.16.2 wraps `strconv.ErrSyntax`** (it does since 1.x, but verify the sentinel is reachable via `errors.Is`).
- `hints` (tier 1: there's a `fmt.Errorf` verb that preserves the wrap chain, different from the string-format one — `errors.Is` walks the chain only if you use it; tier 2: names `%w` vs `%v` but not the full call).

#### Step 1.5 — `playground` — "Explore error wrapping: `%w` vs `%v`" *(CUT at seed — §2.4; design kept as canon)*

- `data.kind: "playground"`. Starter pre-loads `ErrBase`, `wrappedW := fmt.Errorf("outer: %w", ErrBase)`, `wrappedV := fmt.Errorf("outer: %v", ErrBase)`, then prints `.Error()` for both (same string), `errors.Is(..., ErrBase)` for both (true vs false), `errors.Unwrap` for both (the inner vs nil).
- Prompts in instruction (motivation, not "play around"): (1) same `Error()` text — so what differs? look at `errors.Is`/`errors.Unwrap`; (2) wrap-a-wrap (`inner := %w`; `outer := %w` over inner) — does `errors.Is(outer, ErrBase)` still find it? (3) the discovery framed straight: *`%v` formats the string and loses the wrap; `%w` keeps the chain — that's why §1.4's test insisted on `%w`.*
- Harness: trivially-true assertion; verdict UI hidden per the inherited contract.

---

### Lesson 2 — Structural interfaces

> *What changes in the learner's head:* "Interfaces in Go aren't declared — a type satisfies one just by having the methods. The `error` I returned in Lesson 1 was an interface. 'Accept interfaces, return structs' is the rule that keeps Go composable, and `io.Reader`/`io.Writer` are the example everyone reuses. There is no `implements` keyword and that's the point."

**Step distribution:** 1 `read`, 2 `kata`, 1 `challenge` = 4 steps. No predict — interface satisfaction is mechanical; a predict would fail the Maya test. Delta-framed throughout (§2.2): interfaces ≈ Java/C# interfaces minus `implements`.

#### Step 2.1 — `read` — "Interfaces are sets of methods"

- **body topics (~280 words):** structural satisfaction (no `implements`; a type satisfies by having the methods; **Lesson 1's `*MyError` already did this with `error`** — the named back-reference closing the forward hook); "the bigger the interface, the weaker the abstraction" (Pike/Cheney — small interfaces compose, large ones don't); `io.Reader`/`io.Writer` as canonical one-method interfaces (anything that reads — file, conn, buffer, string — is an `io.Reader`); "accept interfaces, return structs" (take the abstraction, return the concrete type so the caller has the full API); interface declaration syntax (`type Reader interface { Read(p []byte) (n int, err error) }`); **the polyglot reflex (Java/C#, §2.2):** "where do I write `implements`?" — nowhere, the compiler infers it; `any`/`interface{}` named-and-deferred in one sentence (§2.7 — the escape hatch, not the default; and on 1.16 it's spelled `interface{}`, since `any` is a 1.18 alias).
- **figure (committed — satisfies the disambiguation mandate):** `disambiguation` — **`interface{}` (the escape hatch) vs a named one-method interface (the abstraction)**, divergent attribute **Constraint** (accepts anything, tells you nothing vs accepts a method set, tells you exactly what's callable). Single-dimension highlight per the catalog rule. Lands beside the `any`/`interface{}` paragraph.
- **voice_check:** every sample compiles under 1.16.2; the back-reference to Lesson 1's `error` lands in one sentence (no re-teach); the read ends pointing at kata 2.2.

#### Step 2.2 — `kata` — `WriteHello(w io.Writer) error` *(write-from-scratch; gesture G4 — accept an interface)*

- Implement `WriteHello(w io.Writer) error` that writes `"hello, world\n"` to `w`. Test passes a `*bytes.Buffer` (satisfies `io.Writer`) and asserts captured bytes via the harness.
- Why: the same function works for `os.Stdout`, a file, a conn, a buffer — the polyglot internalises "accept interfaces" by writing one.
- Single `hint`: `io.Writer` has one method; look up its signature — it gives you what you need.

#### Step 2.3 — `kata` — `CountLines(r io.Reader) (int, error)` *(write-from-scratch)*

- Implement `CountLines(r io.Reader) (int, error)` using `bufio.Scanner` (default split is lines — don't change it). Test passes `strings.NewReader(...)` to avoid the filesystem.
- Why: mirror of 2.2 — accepting `io.Reader` means it works for files, network, strings. Tests pin the abstraction.
- Single `hint`: points at the buffered-scanner family for reading line by line — without naming `bufio.Scanner` / `.Scan()`.

#### Step 2.4 — `challenge` — `Notifier` interface, two implementations *(write-from-scratch; no hint per challenge rule)*

- Define `type Notifier interface { Notify(msg string) error }`. Implement `EmailNotifier` (writes `"EMAIL: <msg>"` to an `io.Writer` field) and `LogNotifier` (writes `"LOG: <msg>"`). Write `SendAll(notifiers []Notifier, msg string) error` that calls each; on first error, return it wrapped with the index (`fmt.Errorf("notifier %d: %w", i, err)`).
- Why: combines interface design + struct definition (a preview of Lesson 3) + error wrapping (Lesson 1 retrieval) + iteration. Highest-density step in Lesson 2; ~2× budget, ≤1 hint per §5.3 — here zero.
- **Note:** this is a *mid-scroll* challenge, distinct from the capstone. README §4.3 forbids zero challenges and more-challenges-than-exercises; one mid-scroll challenge + one capstone is within bounds (2 challenges, ~10 exercises). If budget pressure hits, this challenge — not a kata — is a cut candidate before the playground.

---

### Lesson 3 — Structs, methods, and composition over inheritance

> *What changes in the learner's head:* "Go has no inheritance — it has struct embedding, which looks like inheritance and isn't (no virtual dispatch, no `super`). Pointer vs value receiver is a deliberate choice: mutation needs a pointer. Mixing them via an interface trips you up — I predicted it wrong, then fixed it. And every type has a zero value I can lean on."

**Step distribution:** 1 `read`, 1 `predict`, 2 `kata` = 4 steps. Delta-framed (§2.2): embedding ≈ inheritance replaced by composition; zero value ≈ null/None made total.

#### Step 3.1 — `read` — "Structs, methods, receivers, embedding, zero values"

- **body topics (~300 words):** struct literal syntax, field access, struct comparison; methods (`func (c Counter) Value() int` vs `func (c *Counter) Inc()` — receiver type matters); **pointer-vs-value receiver heuristic** (mutation → pointer; small read-only → value; large struct → pointer regardless; *mixing within a type is a smell*); struct embedding (`type Server struct { Logger; addr string }` — methods on `Logger` are promoted; **this is NOT inheritance**, §2.2 — no virtual dispatch, no `super`, no override); the polyglot reflex (Java/Python: "where's the class? where's `extends`?" — neither; composition via embedding is the answer); **zero values** (every type has one; `nil` is the zero of pointers/slices/maps/interfaces/channels/funcs; a `nil` slice is usable, a `nil` map panics on write; design types so the zero value is meaningful — `bytes.Buffer{}` is ready to write); forward hook to Lesson 5 (the struct-literal shape is what the harness's assertion data uses).
- **figure (committed):** `two-by-two` — axes **Receiver (value × pointer)** × **Call site (direct value × via interface)**, each cell stating whether a mutation sticks. The cell that names the confusion — value receiver, called via interface holding a pointer, mutation lost — is highlighted. (This is the exact orthogonal-axes confusion the `two-by-two` exists for; it also de-risks predict 3.2 by giving the read a static map of the trap.)
- **voice_check:** every sample compiles; the embedding paragraph states "not inheritance" before showing promotion; the receiver heuristic is the load-bearing summary.

#### Step 3.2 — `predict` — "What does this print? (value receiver via interface holding pointer)"

- **snippet:** `type Counter struct{ n int }`; `func (c Counter) Inc() { c.n++ }` (value receiver); `type Incrementer interface { Inc() }`; `main` stores `&Counter{}` in an `Incrementer`, calls `Inc()` three times, prints `c.n`.
- **options:** (a) `0` (b) `3` (c) compile error (`*T` can't satisfy a value-receiver interface) (d) runtime panic.
- **correct:** a (`0`). Value receiver → each `Inc()` mutates a copy and discards it. The pointer in the interface lets it compile (`*T`'s method set includes value-receiver methods), but the body works on a copy. Feedback per §2.3: (b) Java/C# always-mutate reflex, (c) the method-set misread, (d) no deref happens. Reveal names the fix (pointer receiver) → primes broken→fix kata 3.3.

#### Step 3.3 — `kata` — `Counter` with pointer receiver *(broken→fix — §2.6; production gesture G1)*

- **broken→fix:** starter ships a plausible-but-wrong `Counter` with `func (c Counter) Inc()` (value receiver) and a `Value()` method, plus a `main`/test that calls `Inc()` three times and expects `3`. **The test fails** (returns `0`) — the planted bug IS the misconception the 3.2 predict just surfaced. Learner changes the receiver to `*Counter`.
- Tests: `Inc()` ×3 then `Value()` == 3; the failing-then-passing arc is the lesson.
- `hints` (tier 1: the predict you just did is the bug — where does the mutation go? tier 2: names "pointer receiver" but not the `*Counter` edit). The instruction's first line states the starter is wrong **by design** and the wrong output is the brief (audience fix — Yui's failure mode is otherwise "the environment is broken, file a bug").

#### Step 3.4 — `kata` — Embedding for composition *(write-from-scratch; production gesture G1)*

- Define `type Logger struct { w io.Writer }` with `func (l *Logger) Log(msg string)` writing `"[LOG] <msg>\n"` to `w`. Define `type Server struct { Logger; addr string }`. Implement `NewServer(w io.Writer, addr string) *Server`. Test calls `s.Log("hello")` directly (via promotion) and asserts captured output.
- Why: embedding is Go's answer to "I want this behavior without an inheritance hierarchy." The test forces the use of the promoted method.
- Single `hint`: points at how a method on an embedded type becomes callable on the outer type — without writing the embedding declaration.

---

### Lesson 4 — Concurrency: goroutines, channels, select

> *What changes in the learner's head:* "Goroutines are cheap, not free. A channel is a typed pipe; an unbuffered one is a synchronous handoff. `select` chooses among ready operations. `go f()` is not `await` and a channel is not a Promise. And the loop-variable-capture trap is real on this Go — I predicted it wrong."

**Step distribution:** 1 `read`, 1 `predict`, 2 `kata` = 4 steps. Concurrency lands fourth, after errors/interfaces/structs are solid (Kenji's S6 fixed progression: sequential → channels → select; the polyglot has three lessons of sequential muscle before `go func()`). Delta-framed (§2.2): goroutines/channels ≈ the async model they hold, reframed.

#### Step 4.1 — `read` — "go func(), channels, select"

- **body topics (~300 words):** sequential first (most Go is sequential; concurrency is a tool, not the default); `go f()` schedules on the runtime scheduler (no threads to manage; ~2KB initial stack; cheap, not free); channels (typed pipes; unbuffered = synchronous handoff, send blocks until receive ready; buffered = bounded queue); close discipline (only the sender closes; receive from closed → zero value + `ok=false` via `v, ok := <-ch`; **send on closed → panic**); `select` (chooses among ready ops; `default` makes it non-blocking; the construct that makes channels useful for timeouts/cancellation); "don't communicate by sharing memory; share memory by communicating" (Pike — channels are the higher-level abstraction, not "mutexes are wrong"); **the polyglot async-model delta (§2.2):** for Mariana/Felipe `go f()` is not `await` (no value comes back; you coordinate via a channel); for Yui it's lighter than a thread and there's no `synchronized` if channels do the job; for Esteban it's not `asyncio` (no event loop you await on); `sync.Mutex`/`WaitGroup`/`context`/`errgroup` named-and-deferred (§2.7).
- **figure (committed):** `tabbed-card` — three tabs: **`go f()` (schedule)** / **channel (coordinate)** / **`select` (choose)**, same tiny producer/consumer artifact viewed through each lens. Tab switch is the interaction (CSS-only). Best fit because one concept (a goroutine talking over a channel) has three useful views; avoids three separate figures.
- **voice_check:** every sample compiles under 1.16.2; the async delta names a *specific* reflex per persona, not a generic one; sequential-first is the framing, not an afterthought.

#### Step 4.2 — `predict` — "What does this print? (loop-variable capture, Go 1.16)"

- **snippet:** `var wg sync.WaitGroup`; `for i := 0; i < 3; i++ { wg.Add(1); go func() { defer wg.Done(); print(i) }() }; wg.Wait()`.
- **options:** (a) `0 1 2` in some order (b) `3 3 3` in some order (c) `0 0 0` in some order (d) compile error.
- **correct (on the sandbox's Go 1.16.2): b (`3 3 3`).** The loop variable `i` is shared across iterations; all three goroutines close over the same `i`, which is `3` once the loop ends. Feedback per §2.3: (a) JS `let` per-iteration reflex (*and* correct on Go 1.22+ — named explicitly), (c) "they ran before increment" misread (the `WaitGroup` proves they didn't), (d) syntactically valid, the bug is semantic. **Reveal MUST state the version contract:** `3 3 3` is real on 1.16; Go 1.22 (Feb 2024) made the loop variable per-iteration, so the same code prints `0 1 2` on current Go — a rare backwards-incompatible change. The transferable lesson is the *why* (shared closure variable), live on this sandbox. **This predict is the brief for kata 4.3 IF loop-capture stays in crash scope — see §7.**

#### Step 4.3 — `kata` — fan-out over goroutines *(broken→fix candidate OR write-from-scratch — see §2.6 + §7)*

- **If loop-capture stays in crash scope (default): broken→fix.** Starter ships a `FanOut(inputs []int, fn func(int) int) []int` that spawns a goroutine per input and **captures the loop variable**, so results are garbage/duplicated. The planted bug IS the 4.2 misconception. Learner fixes it (`i := i` shadow, or pass `i`/`v` as a goroutine arg) and gathers results in input order. Tests assert output order == input order. `hints` tiered (tier 1: the 4.2 predict is the bug; tier 2: names per-iteration capture but not the shadow line). First-line "wrong by design" rule per 3.3.
- **If §7 defers loop-capture to the deep-dive: write-from-scratch.** Same `FanOut` signature, blank scaffold, no planted bug — the kata just exercises goroutine + channel/slice gather. Loses the broken→fix punch but stays honest about scope.
- Why: establishes "fan out, gather in" with order discipline (results-by-index, not completion-order).

#### Step 4.4 — `kata` — `WithTimeout` using `select` *(write-from-scratch; tiered hints; production gesture G3)*

- Implement `WithTimeout(work func() int, d time.Duration) (int, bool)` — run `work` in a goroutine, return its result with `ok=true` if it finishes before `d`, else `(0, false)`. Use `select` over the result channel and `time.After(d)`.
- Tests: a fast `work` → `(result, true)`; a slow `work` (sleeps past `d`) → `(0, false)`. **Determinism note (§5):** bound durations tightly (e.g. fast = immediate, slow = `d` + small margin) so the test is reliable under the run timeout; assert on outcomes, never scheduling order. **Confirm `time.After`/`time.Duration` behave under Piston's run cap at smoke.**
- `hints` (tier 1: you need to race two things — the work finishing and time running out — what construct waits on whichever channel is ready first? tier 2: names `select` + `time.After` but not the case bodies).

---

### Lesson 5 — Integration: the capstone (with a testing-as-design close)

> *What changes in the learner's head:* "I can read most idiomatic Go and write a small real function end-to-end — errors as values, a struct with a method, parsing from an `io.Reader`. I know exactly what this scroll didn't teach (real `go test`, `sync`, `context`, generics, the deferred footguns) and where each depth lives."

**Step distribution:** 1 `read` (testing-as-design + deferral map) + 1 `challenge` (the scroll capstone) = 2 steps. The capstone integrates **L1 + L2 + L3** (sequential — see §7 decision 3; G3 stays in kata 4.4). *(The scratch draft's standalone Lesson 5 — table-driven tests + `httptest` challenge + playground — is re-scoped: `go test` is not available in the sandbox, so "table-driven tests as the test shape" can only be taught as prose-about-real-Go, not drilled. The honest move is one read that names testing-as-design + the manual-harness caveat + the deferral map, then the capstone. See §7.)*

#### Step 5.1 — `read` — "Testing as design (and what we deliberately didn't teach)"

- **body topics (~300 words):** **testing-as-design, prose-only and sandbox-honest:** "In real Go, tests are not an external concern — they're design pressure. `func TestXxx(t *testing.T)`, table-driven cases (`[]struct{ name; in; want }` + `t.Run` per case), `t.Errorf` vs `t.Fatalf`, `httptest` for HTTP without a network. The heuristic — *if the test is painful to write, the design is wrong* — is one you can actually use. **This sandbox runs `go run`, not `go test`, so this scroll's katas used a small manual harness instead; real Go testing is `go-testing-and-fuzz`.** The polyglot reflex (`expect(x).toBe(y)`): Go has no fluent matchers — `if x != y { t.Errorf(...) }` is the convention, boring on purpose." Then the **named-and-deferred map**, one sentence per §2.7 item (`panic`/`recover`, `sync.*`, `context`, generics, `any`, `init()`, `reflect`, `cgo`, the frameworks, real `go test`) — each with failure mode + deep-dive slug; closes by setting up the capstone explicitly ("the last step is one function a working dev would write — it needs Lessons 1, 2, and 4 at once").
- **figure (optional, committed if it earns its place):** `tabbed-card` — **the same `Add(a,b)` tested three ways**: tab 1 "real Go (`go test`, table-driven)", tab 2 "this sandbox (manual `_t`/`_eq`)", tab 3 "the polyglot's reflex (`expect().toBe()`)". Makes the sandbox caveat concrete instead of apologetic. Cut if the read is already at budget.
- **voice_check:** the testing prose is marked *real Go, not the sandbox* wherever it describes `go test`; the deferral list is the one place one-sentence items are exempt from the code-sample rule (pointers, not teaching); ends pointing at the capstone.

#### Step 5.2 — `challenge` — **Capstone: "Log triage — parse, count, report"**

- **Deliverable (one small, real function a working dev would plausibly write):**
  ```go
  type Level int
  const ( Info Level = iota; Warn; Error )

  type Summary struct{ Infos, Warns, Errors int }

  var ErrEmpty = errors.New("empty log")
  type ErrUnknownLevel struct{ Token string }
  func (e *ErrUnknownLevel) Error() string { ... }   // typed error → errors.As

  func Summarize(r io.Reader) (Summary, error)
  func (s Summary) String() string                   // "2 info, 1 warn, 1 error"
  ```
  Input: an `io.Reader` over a multi-line log where each non-blank line starts with a level token (`"WARN disk at 91%"`). Read it with `bufio.Scanner`. Blank lines skipped. Unknown token → `&ErrUnknownLevel{Token: tok}` (the learner extracts it with `errors.As`). No non-blank lines → `ErrEmpty` (matched with `errors.Is`). **Sequential — no goroutine (§7 decision 3, ratified A):** a log this small does not need concurrency, and forcing a goroutine fan-out would teach the author's cleverness, not the learner's competence (README §5.3). G3 (goroutine+channel) is written in kata 4.4 and integrated by-reference here, not re-contrived. The `io.Reader` parameter is what pulls Lesson 2 into the capstone — a real gesture (accept an interface), not gold-plating.
- **Lessons integrated (named in the learner-facing instruction, per README §5.3):** **Lesson 1** (sentinel `ErrEmpty` via `errors.Is`, typed `ErrUnknownLevel` via `errors.As`, `(T, error)` return); **Lesson 2** (input is an `io.Reader` — accept an interface, read via `bufio.Scanner`); **Lesson 3** (`Summary` struct + a method `String()` — receiver choice; `Level` const block). Three lessons integrated cleanly, satisfying README §5.3's ≥3-lesson floor without concurrency theater.
- **Tests (cover every arm):** mixed log (via `strings.NewReader`) → `Summary{2,1,1}` AND `s.String()` == expected; a `"TRACE …"` line → `ErrUnknownLevel{Token:"TRACE"}` reachable via `errors.As`; `strings.NewReader("")` and `"\n\n"` → `ErrEmpty` via `errors.Is`; blank-line skipping verified in the mixed case. Deterministic by construction (sequential — no goroutine ordering to worry about).
- **Budget & rules:** ~20 min (2× kata, stated in the instruction). **≤1 hint**, high-level: *"Three sub-problems: scan the reader into candidate lines (`bufio.Scanner`), turn a line's first token into a `Level` (one fallible function — return `(Level, error)`), and accumulate counts into `Summary`."* Not a gate; skippable.
- **Outline-level persona attack sketches (README §5.3):**
  - **Mariana (A1):** lines→tokens→reduce is her JS reflex; her predicted snag is the typed `ErrUnknownLevel` requiring `errors.As` (Lesson 1 paying off) and reading from an `io.Reader` with `bufio.Scanner` instead of a string split (Lesson 2 paying off).
  - **Esteban (A2):** maps the parse to a Python comprehension; his snag is the `(Level, error)` return on the per-token parser instead of raising — Lesson 1's both-paths discipline is the correction.
  - **Yui (A3):** maps `Level` to a Java enum + `Summary.String()` to `toString()`; her snag is reaching for inheritance/exceptions — Lessons 1 + 3's deltas are the corrections.
  - All three can sketch an attack using only outlined lessons → the lesson set passes the capstone test. *(Re-run before seeding if a lesson's scope changes at prose stage.)*

---

## 5. Sandbox notes

- **Runner:** Piston **Go 1.16.2** (declared in Lesson 0; pinned, not assumed). Single-file `go run` — **no `go build` artifacts, no `cargo`-equivalent, no `go mod`, no `go get`, no third-party packages, and (critically) no `go test`.** **Pre-generics:** no type parameters, no `slices`/`maps`/`cmp`. **`any` is unavailable as a keyword** (1.18 alias) — use `interface{}`. **Confirm the exact patch and stdlib surface at the first smoke** (§7 open call 4) — every quoted output, every API used in a starter/test/solution, gets verified against the real 1.16.2 before its lesson seeds.
- **Test harness:** **manual `_t`/`_eq` pattern, consistent with Ruby/Python/Rust** (the scratch draft's "use `go test`, no manual harness" is void — `go run`, not `go test`). Shape sketch, finalized at seed:
  ```go
  type _result struct {
      Name string `json:"name"`
      Pass bool   `json:"pass"`
      Msg  string `json:"msg,omitempty"`
  }
  var _results []_result

  func _eq(name string, actual, expected interface{}) {
      if reflect.DeepEqual(actual, expected) {
          _results = append(_results, _result{name, true, ""})
      } else {
          _results = append(_results, _result{name, false,
              fmt.Sprintf("expected %v but got %v", expected, actual)})
      }
  }

  func _t(name string, f func()) {
      defer func() {
          if r := recover(); r != nil {
              _results = append(_results, _result{name, false, fmt.Sprintf("panicked: %v", r)})
          }
      }()
      f()  // f calls _eq(...) internally; the name lives on the _eq calls
  }
  ```
  - **`_eq` uses `reflect.DeepEqual`** for struct/slice comparison (1.16 has no generics; this is the boring, correct equality). Test names are user-facing sentences per framework rules.
  - **`recover()` in `_t`** keeps one panicking test from killing the suite (the Go analog of Rust's `catch_unwind`).
  - **ECHO-FREE FOOTER — and NO `encoding/json`. ✅ Validated at first smoke (S031, 2026-06-19).** `main` runs the `_t` calls and emits **ONLY** the single `__DOJO_RESULT__` JSON line — no per-test `✓`/`✗` echo (it tips `PISTON_OUTPUT_MAX_SIZE`, removed from the other three footers). **The JSON is hand-rolled with `fmt`/`strings`, NOT `encoding/json`:** importing `encoding/json` crashes the Piston sandbox keeper on Go 1.16.2 (`Sandbox keeper received fatal signal 6` — its cold-compile pulls enough transitive deps to blow the cgroup `+pids` limit). `fmt`+`reflect`+`strings` are fine; a `go` hello-world runs in ~750ms/90MB. The footer matches ExecuteStep's parser exactly (`{"ok":<bool>,"tests":[{"name","passed"[,"message"]}]}`), mirroring Rust's `_json_escape` approach:
    ```go
    ok := true
    parts := make([]string, 0, len(_results))
    for _, r := range _results {
        if !r.pass { ok = false }
        if r.pass {
            parts = append(parts, fmt.Sprintf("{\"name\":\"%s\",\"passed\":true}", _jsonEscape(r.name)))
        } else {
            parts = append(parts, fmt.Sprintf("{\"name\":\"%s\",\"passed\":false,\"message\":\"%s\"}", _jsonEscape(r.name), _jsonEscape(r.msg)))
        }
    }
    fmt.Printf("__DOJO_RESULT__ {\"ok\":%t,\"tests\":[%s]}\n", ok, strings.Join(parts, ","))
    ```
    (`_jsonEscape` is a `strings.Builder` loop over the runes: `"`, `\`, `\n`, `\r`, `\t`, and `< 0x20` → `\uXXXX`.) Harness imports: **`fmt`, `reflect`, `strings` only** (plus whatever the kata itself needs).
  - **Entry-point merge — VALIDATED design (S031): marker insertion.** Go can't use Rust's "learner code first" order — Go demands `package main` + a single import block at the file top and rejects unused imports. So the **testCode is the full file**: `package main` + the exact import block + the `_result`/`_eq`/`_t`/`_jsonEscape` helpers + a `// __DOJO_SOLUTION__` marker + `func main(){ <tests> <footer> }` — and the PistonAdapter inserts the learner's `code` at the marker. Needs an `isGo` branch in the adapter (`testCode.replace('// __DOJO_SOLUTION__', code)`) + runFile `main.go` (so compile errors read `main.go:LINE`). **Consequence the author respects:** imports live in testCode, not the editable starter, so the import block must pre-declare every package the intended solution needs; the instruction names the available packages. Line-number offset from the preamble is a known wrinkle (compile-error lines won't match the learner's editor) — accept for v1, revisit if it bites.
- **Fail-by-design / broken→fix katas and the verdict:** for the broken→fix katas (3.3, and 4.3 if it ships broken→fix), the starter compiles but the harness reports a failing test (wrong output) — ExecuteStep surfaces the failing `_eq` message as feedback, not as an infra failure. For any kata whose starter intentionally won't compile, ExecuteStep must pass the `go run`/compile stderr through as feedback (the adapter scrubs Piston noise lines, as it does for Rust). Confirm both channels at smoke.
- **Stdlib only.** Confirmed-needed packages (verify each exists on 1.16.2 at smoke — all should): `errors`, `fmt`, `io`, `bufio`, `bytes`, `strings`, `strconv`, `sort`, `time`, `sync`, `reflect`. **NOT in the harness / NOT used:** `encoding/json` (**crashes the Piston sandbox on 1.16.2** — see the footer note; the harness hand-rolls JSON), `slices`, `maps`, `cmp` (1.21), generics (1.18), `errors.Join` (1.20). `net/http`/`httptest` are **not used** (the scratch's httptest lessons are cut — §2.4, §4 Lesson 5 — partly because loopback networking in Piston is unconfirmed and partly because it pulled the scroll past budget).
- **Determinism:** no `time.Now()` in assertions (inject or avoid); no `rand` without a seeded source; no `time.Sleep` for real waits except tightly-bounded ones inside the `WithTimeout` kata's *slow* fixture; goroutine scheduling is non-deterministic by design — concurrency tests assert on *outcomes* (final `Summary`, fan-out results-by-index), never on intermediate ordering. No `map` iteration order in asserted output (the capstone counts into named `Summary` fields precisely to avoid a map).
- **STDIN:** never exercised; inputs are function arguments.
- **Run-latency budget:** Go compiles fast (much faster than Rust), so the Piston run cap (3-15s range) is comfortable for everything except a leaking concurrency solution — kata 4.4 and the capstone bound their durations so a leak fails fast rather than timing out ambiguously. Confirm the cap at smoke.

---

## 6. References

To finalize when prose lands. Anticipated citations (sandbox-honest: cite the *language*, mark 1.16-vs-current where it matters):

- *The Go Programming Language* (Donovan & Kernighan, 2015) — ch. 5 (errors → Lesson 1), ch. 7 (interfaces → Lesson 2), ch. 6 (methods/embedding → Lesson 3), ch. 8 (goroutines/channels → Lesson 4). The 2015 edition is *pre-generics* — a near-perfect match for the sandbox's 1.16 surface; flag only where modules/generics diverge.
- *Learning Go*, 2nd ed. (Bodner, 2024) — ch. 9 (errors), 7 (types/methods), 10 (concurrency), 13 (tests). Modern; use for the "why", mark the 1.18+/1.22 bits as *newer Go*.
- *100 Go Mistakes* (Harsanyi, 2022) — #48-54 (errors → L1), #56-62 (interfaces/embedding → L2-3), #63-73 (concurrency → L4). The loop-capture and typed-`nil` framing.
- *Effective Go* — <https://go.dev/doc/effective_go> — canonical idioms, cited L1-L4.
- Go blog: "Working with Errors in Go 1.13" (<https://go.dev/blog/go1.13-errors>) for L1's `%w`; "Share Memory By Communicating" (<https://go.dev/blog/codelab-share>) for L4; the Go 1.22 loop-variable post for predict 4.2's *newer Go* caveat.
- Dave Cheney — "the bigger the interface, the weaker the abstraction" (<https://dave.cheney.net/2016/08/20/solid-go-design>) for L2.
- std API docs — `errors`, `io`, `bufio`, `strconv`, `testing` (read-only for L5's prose).

---

## 7. Open scope decisions + expert (Kenji/Elif) review notes

> Status tags: **`◯ open`**, **`◐ leaning`**, **`✓ encoded/ratified`**.
> **ALL DECISIONS RATIFIED 2026-06-19** (Adrian sign-off, on the reviewer's recommendations): #1 drop worker-pool / 4-step Lesson 4 ✓; #2 keep loop-capture predict+broken→fix WITH the 1.16-vs-1.22 caveat ✓; **#3 capstone = Option A (sequential, `io.Reader`, L1+L2+L3) ✓ — body updated**; #4 author to 1.16.2, smoke-first ✓. The detail below is kept for the resume-reader's context.

**Brutal-honesty preface — where the scratch draft over-reached.** The `.kwik-e/tmp/curricula-drafts/go/` draft is built on a sandbox that does not exist here. It assumes **Go 1.21+** throughout: `slices.Sort`/`cmp.Ordered` "available if a learner reaches for them", `net/http.ServeMux` 1.22 routing patterns, `go test ./...` as the harness, a whole Lesson 5 on table-driven testing + `httptest`, and — most damaging — it frames the loop-variable predict as "on 1.22+ the answer becomes `0 1 2`, pin the version in feedback" as if 1.22 were plausibly the sandbox. The real sandbox is **1.16.2**: pre-generics, no `slices`/`maps`/`cmp`, no `go test`, loop-capture LIVE. Three knock-on corrections are already encoded above (harness, generics-out, httptest-out); the open calls below are the ones that genuinely need Adrian.

1. **`◯ open` — Concurrency depth in a ~100-min crash scroll.** This is the real budget threat, and the scratch draft walks right into it. Its Lesson 4 had `read + predict + 2 kata + challenge` (a 5-step lesson with a "bounded worker pool with shutdown" challenge integrating goroutines + channels + select + leak-discipline). That challenge is a *deep-dive-sized* problem — worker pools, graceful shutdown, and leak-freedom are `go-concurrency-deep` material, not crash-course material, and on a 1.16 sandbox with non-deterministic scheduling it's also hard to test honestly. **Recommendation:** keep concurrency to the **4-step shape** encoded above (`read + predict + 2 kata`), cap the goroutine surface at `go f()` + one channel + `select`, and **drop the worker-pool challenge entirely** (its leak-discipline lesson is exactly what the deep-dive owns). Kenji's lens reinforces this: his fixed commitment is *sequential before concurrent*, and a crash scroll that spends its last third on concurrency contradicts "95% of production Go is sequential, error-checked, interface-driven." Channels/`select` get a *taste* (enough to read them on Friday); depth is deferred. **If Adrian wants more concurrency, the honest move is a `go-concurrency-deep` scroll, not a fatter Lesson 4.**

2. **`◐ leaning` — Does loop-variable capture belong in a crash scroll at all (predict 4.2 + kata 4.3)?** The argument *against*: it's a footgun fixed in 1.22, so teaching it on 1.16 risks teaching a soon-to-be-historical bug — and a polyglot on current Go will never hit it. The argument *for* (stronger): (a) the sandbox IS 1.16, so the trap is live in every kata they run here; (b) most production Go the polyglot will *read* on Friday predates 1.22 and still carries the pattern; (c) the transferable lesson is *closure-captures-a-variable-not-a-value*, which is language-agnostic and bites in JS, Python, C# too — the goroutine is just the vehicle. **Recommendation: keep the predict (4.2), and ship kata 4.3 as broken→fix** — it's the single strongest broken→fix candidate in the scroll (the planted bug exactly embodies the predicted misconception, §2.6). The non-negotiable condition: the predict reveal and the kata instruction **must state the 1.16-vs-1.22 version contract explicitly** (encoded in §2.3 / §4.2) so no learner walks away thinking current Go behaves this way. If Adrian disagrees, the fallback is: keep predict 4.2 as a *historical/read-Friday-code* note, revert kata 4.3 to a plain write-from-scratch fan-out, and the scroll loses its best broken→fix but gains a cleaner "this is current Go" story. I'd keep it — the closure lesson is too universal to defer.

3. **`◯ open` — Does the capstone need a goroutine, or is that gold-plating?** Encoded above: the capstone (log triage) integrates Lessons 1 + 3 cleanly and *adds* a goroutine fan-out to also integrate Lesson 4 (production gesture G3 at scroll level). **The honest problem:** a log small enough to fit a crash-course test does NOT need concurrency — the fan-out is pedagogically motivated, not performance-motivated, and forcing it risks the "use each feature once" tour the README §5.3 explicitly forbids. **Two clean options:** **(A)** sequential capstone integrating L1 + L3 (+ L2's interface if we make the input an `io.Reader`), and let kata 4.4 (`WithTimeout`) be the sole written home of G3. Cleaner, more honest, but the capstone then integrates concurrency-by-reference only. **(B — encoded default)** keep the goroutine fan-out in the capstone with the instruction stating plainly that it's for practice, not performance. **Recommendation: lean A** — a capstone that contorts to use a goroutine teaches the author's cleverness, not the learner's competence (README §5.3's exact warning). G3 is already written in kata 4.4; the capstone doesn't owe us a second instance. But this is genuinely Adrian's call on whether scroll-level integration of *all four core lessons* is worth a slightly artificial goroutine. If A, the capstone integrates L1 + L2 + L3 (input becomes `io.Reader`, satisfying §5.3's ≥3-lesson floor without concurrency theater).

4. **`◐ leaning` — Confirm the exact Piston Go version + stdlib surface before any seeding.** The whole spec is pinned to **1.16.2** per the brief, but the recent commits in this repo are all Piston-tuning (`PISTON_OUTPUT_MAX_SIZE`, accessory timeouts) — the Go runtime version should be re-confirmed against the live Piston image at the first smoke, exactly as Rust's 1.68.2 was. If it's actually newer (e.g. 1.21), several decisions relax (generics become available-but-still-not-taught; loop-capture flips to the 1.22 behavior if ≥1.22; `go test` *might* be reachable). **Recommendation:** treat 1.16.2 as the contract for authoring, but make "confirm version + run a one-file smoke through the real harness" the first seeding task (§5). Do not author quoted error/output text from memory — capture it live, per the Rust §7 discipline.

5. **`✓ encoded` — Harness is manual `_t`/`_eq`, echo-free footer, NOT `go test`.** The scratch's "Go's stdlib testing is already the right shape, no manual harness needed" is the single most confidently-wrong line in the draft for *this* sandbox (`go run`, not `go test`). Encoded in §5 with the echo-free `__DOJO_RESULT__` footer specified from the start (the per-test `✓`/`✗` echo that tipped Piston's stdout cap on the other three scrolls is never added here).

6. **`✓ encoded` — Exercise share held at ≥50%.** As shipped: 20 steps, ~10 writing (≈50%) after the 1.5 playground cut (§2.4). The Rust 48% exception was Rust-scoped with zero precedent for Go (Rust §7); Go meets the framework floor. If prose-stage merges a read, prefer that over adding one — the share must not drop.

7. **`◐ leaning` — NEW FIGURE: none proposed; all six reuses fit.** Audited the figure needs against the catalog (before-after / two-by-two / disambiguation / array-track / tabbed-card / metric-pair). Every committed figure reuses an existing type: 1.1 `before-after` (smell vs idiom error handling), 2.1 `disambiguation` (`interface{}` vs named interface, single-dimension highlight), 3.1 `two-by-two` (receiver × call-site mutation grid), 4.1 `tabbed-card` (schedule/coordinate/choose), optional 5.1 `tabbed-card` (three test shapes). **No `⚠️ NEW FIGURE PROPOSED` is needed.** One thing I deliberately did NOT add: a `metric-pair` (goroutine vs thread memory: ~2KB vs ~1MB stack) was tempting for Lesson 4, but it risks seeding "goroutines are free, spawn thousands" — the exact cargo cult Kenji's lens guards against. Principle 2 (cost-as-number) is *consciously unserved* in this scroll, mirroring Rust's clone-count rejection (Rust §7). Flag if Adrian wants it back.

8. **`✓ encoded` — Errors-first ordering holds.** Kenji's S6 call (scratch §4): errors are the most jarring polyglot surprise and appear in every later kata; the `error` interface is Lesson 2's motivating example (forward hook, not forward reference). No reason to revisit; flagged only because prose-stage Lesson 1 might strain to teach `error` without leaning on interface mechanics — if it does, the order is still right, the read just adds one sentence ("`error` is an interface; Lesson 2 makes that precise").
