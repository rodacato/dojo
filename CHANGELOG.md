# Changelog

All notable changes to this project are documented here. First-person decision voice — not feature announcements.

---

## Sprint 031 — Go crash scroll: the five-language set closes (2026-06-19 – 06-20)
**Phase 1 — Alpha**

> The last language scroll, and the carried smoke debt finally paid.

**The carried smoke (W1) earned its keep on the first run.** The full-set real-Piston smoke caught a dead kata in the *published* Ruby scroll — `parameters_of` had its fixtures in `starterCode` instead of `testCode` (so the recorded solution had nothing to introspect) *and* an invalid `fixture_mixed` signature (`*rest` after a keyword — a parse error). It never compiled; every learner Run failed. Fixed both.

**Go — the fifth and final language scroll.** 22 steps, 6 lessons: the 1.16.2 sandbox contract, errors-as-values, structural interfaces, structs/composition, concurrency, and a capstone that integrates the first three (`Summarize` a log — `errors.Is`/`As`, an `io.Reader`, a `Summary` struct/method). 10 katas, 4 predicts, 6 reads, a mid-scroll challenge. Two broken→fix katas where the planted bug *is* the misconception (Counter's value receiver; FanOut's loop-variable capture, with the explicit 1.16-vs-1.22 version contract). Delta-framed from the polyglot's existing models, authored against the 1.16.2 sandbox truth.

**The highest-risk infra item, de-risked first** (the spec demanded it). Go can't use Rust's learner-code-first combine — it demands `package` + imports at the file top and rejects unused imports — so `PistonAdapter` gained an `isGo` branch that splices the learner's code into a full-file template at a `// __DOJO_SOLUTION__` marker (`main.go`). And the harness **hand-rolls its JSON**: importing `encoding/json` crashes the Piston sandbox keeper on 1.16.2 (its cold-compile blows the cgroup `+pids` limit). Both found and fixed at the first smoke, before any lesson seeded.

**The honest finding.** The devcontainer Piston is badly flaky for Go under host memory pressure — a healthy hello-world SIGABRTs at random (~50-90% by load; same root cause as the vite-build OOM, multiple devcontainers sharing the host). `validate:scrolls` now retries transient sandbox crashes (the `Sandbox keeper…` marker survives in stderr; real failures are deterministic and still surface). The Go content is correct — every kata validated when Piston cooperates (`validated=64`); the flake is environmental, not the seed.

**Staged, not live.** Go is flipped to `published` + `isPublic:true` + whitelisted — it goes live on the next deploy + reseed. The prose was authored solo; a fresh-eyes read before deploy is the open recommendation.

---

## Sprint 030 — scrolls presentation reshape (2026-06-19)
**Phase 1 — Alpha**

> Re-scoped from the Go scroll. Saw Rustfinity/Rustlings and realized the thing I wanted for the scrolls already existed in the engine — Piston exercises, anonymous→login progress, the Engawa playground — but the *presentation* didn't sell it. The catalog showed no progress, there was no orientation surface, the entry didn't read as "clear, free, start-anything." A Claude Design prototype validated the direction (terminal-forward, state-aware, no streak/%/badges). Reshaped the presentation on the working engine — restyle, not rewrite — and moved Go to S031.

**What shipped:**
- **Catalog reshape** — per-scroll binary state (Not started / In progress / Completed) from a new batch endpoint, state-aware CTA (Start / Continue / Review), filter tabs, Languages/Topics grouping keyed on the closed 5-language set (ADR 022), a `~min` contract per card. No streak, no %-hero, no badges — the felt win in the reference was clarity + free choice, not the dopamine.
- **Scroll orientation landing** (`/scrolls/:slug`, new route) — contract + time, a state-aware CTA, the lesson list as a free jump-to (not a gate), an inside-scroll N/M progress rail. The player moved to `/scrolls/:slug/:stepId`; step navigation dropped its hash bookkeeping for the path param, so back/forward and refresh are exact for free.
- **Completion moment for anonymous finishers** — was gated on login (the share card is keyed by user), so anon learners who can do every scroll saw nothing on finishing. Now they get the same moment, with the share button replaced by an offer to sign in (which saves the completion + unlocks the card). Merge-on-login already carries their progress over.
- **Backend prereqs (no UI):** `estimatedMinutes` on the scroll schema (migration 0024) + per-scroll seed anchored to the framework's time targets (§4.2 — Rust 120, the ceiling, not the prototype's invented 150); `GET /scrolls/progress` batch endpoint. `ScrollDTO` stayed pure Content — progress (Learning) never coupled onto the cacheable catalog DTO (Darius C2).

**Key decision (the honest one):** considered gating scrolls behind auth to stop API abuse. Rejected — it reverses the free/anonymous thesis (ADR 022, README §1) and identity doesn't stop automated abuse anyway; rate-limit + captcha + sandbox quotas do (Marta C5). Anonymous stays first-class. The execution endpoint already has per-IP rate-limit + a language whitelist + the Piston sandbox; Turnstile is a precautionary backlog item, added only if real abuse shows.

**Also fixed:** `db:migrate` / `db:push` / `db:studio` didn't load the workspace `.env` (the seeds did, via `tsx --env-file`), so they saw `DATABASE_URL` undefined. Invoke the drizzle-kit bin under `node --env-file` — Node 22 native, no new dependency.

**Carried to S031:** the **full-set Piston smoke** (owed since S029; this sprint's changes were presentation-only and didn't touch executable katas, so the risk didn't grow — run it before any Go DB work). Player visual polish (terminal `scroll/` header, contract box), Engawa consistency pass, render-test infra. The Go scroll itself. Follow-ups: a `lessons.outcome` field (the §4.4 "what changed in your head" line the landing can't yet show), the completed-scroll share reshape.

---

## Sprint 029 — scroll format revision + publish all four (2026-06-17 – 06-19)
**Phase 1 — Alpha**

> Unplanned interlude. The planned S029 was the Go scroll (now S030). This sprint came out of a gut-check — "the courses feel boring, too much text, no felt learning" — and the instinct to gamify with a 3D engine. Wrong fix: that competes with YouTube on production, the one axis a solo author loses. The real gap was the *interaction shape*. Built the mechanism, piloted on Ruby, rolled it across the catalog, and published the four existing scrolls.

**The mechanism (ADR 023), piloted on Ruby:**
- **Broken→fix katas — a usage pattern, not a new step type.** A kata can ship plausible-but-wrong `starterCode` to debug, when the planted bug *is* the misconception and the fix teaches the idiom. Ruby: `repeat` (forgets to `yield`), `lookup` (`||` swallows present-`nil`), `safe_call` (sends without a `respond_to?` guard), `classify` (dispatches on `x.class`, so `Integer === Integer` is false). Kept write-from-scratch where a bug would fight the lesson (`map_keys`, `summarize`, `tally_words`, `compare_views`, `tally_args`, `greet`).
- **Progressive hint reveal.** New `hints: string[]` (tier-ordered); the player reveals tier 1 on the first failed run, tier 2 on the second, off an ephemeral client-side failure count. The reference `solution` stays gated post-pass — escalating hints, never the answer. Rejected the original ask (reveal the solution after 2 fails) because it would relax the server `403` gate and reopen the leak it closes on purpose. New nullable `steps.hints jsonb` column (migration 0023); falls back to `[hint]`.
- **Crash-course contract made explicit** in Ruby Lesson 0's "What this is" block.

**Rolled across the catalog — and the honest finding shrank the work.** Rust/Python/TS were authored post-pivot (S027/S028) with crash-course framing, paragraph-test discipline, figures, and polyglot-first already in place, so "what Ruby had to fix" was already there. And broken→fix barely transfers: Rust teaches via fail-by-design katas (the compiler error *is* the brief) + signature clarity; TS's type system is itself the corrector. Forcing planted bugs into either would homogenize.
- **L0 "What this is" block** added to Rust/Python/TS.
- **Tiered hints where katas bite:** Rust 2.3/2.5, TS 1.3/3.3/3.4/4.2/5.2, Python safe_get/parse_int_or/temp_state/@trace/@retry.
- **Python broken→fix ×3** (each hand-verified — bug fails the existing tests, solution still passes): `temp_state` (restores without `try/finally`), `flatten` (comprehension clauses reversed → NameError), `safe_get` (`d.get(key) or default` swallows present-`None`). Rust/TS: zero, documented in their specs.

**Published the four existing language scrolls** (Ruby, Python, Rust, TypeScript): `status: 'published'` + `isPublic: true`; `ruby`+`rust` joined the anonymous-execution whitelist (sandboxed + rate-limited; surface over the already-allowed Python ≈ nil).
- **This jumped the gate S030 reserves.** The planned sequence was *full-set smoke → publish decisions*; we published first, on Adrian's call. So the protective gate is now urgent, not stretch: the **full-set real-Piston content smoke** (every kata's starter+solution etc. — Ruby especially, it changed here and was validated by logic, not execution). The **TS Piston caps** the publish needs (`PISTON_RUN_TIMEOUT=8000` + `PISTON_OUTPUT_MAX_SIZE=65536`) were already landed in `config/deploy.api.yml` and are watched by the 30-min `piston-execute-smoke` CI job. The seed flip ships them ready on reseed; it does **not** bypass the content smoke, which carries into S030.

---

## Sprint 028 — Rust + TypeScript crash scrolls (2026-06-12)
**Phase 1 — Alpha**

The sprint that proved the authoring machine runs at 2×: two language scrolls, end-to-end, through the same Phase-A→W3 pipeline, twice, with consistent quality. The cadence held — both shipped content-complete and smoked against the real compiler.

- **Rust crash scroll** — 7 lessons / 25 steps. The compiler-as-tutor lens with a Rust-scoped format exception: one mental model taught from scratch (ownership → borrowing → lifetimes-lite), everything else delta-style. The exception held without leaking — Go and TS don't inherit it, and the spec says so. Seeded in 4 batches, each smoked live against **Piston rustc 1.68.2** (installed into the local Piston this sprint). All 13 reference solutions pass; every quoted rustc error is a verbatim capture, not a guess. `isPublic:false`.
- **TypeScript crash scroll** — 6 lessons / 20 steps. Benefits-forward for the JS developer adopting TS (A4 Felipe). The whole interaction model rides on compile-result-as-feedback (`Equal<>` assertions, `@ts-expect-error`, type-error-as-output) — a channel no prior scroll exercised, so it was smoked green (TS 5.0.3) before a word of prose. The harness `_eq` distinguishes `{}` from `{k:undefined}` — the optional-field benefit the scroll teaches, made real in the test runner. All 11 solutions pass. Legacy `typescript-fundamentals` left intact — rebuild-not-migrate's hard-delete is a publish-time call, not done unilaterally on live content. `isPublic:false`.
- **Per-batch real-compiler smoke earned its keep, every batch.** Rust: the mod-solution wrap died on module privacy (E0425/E0603 — replaced with a fn-main rename); a kata solution wasn't self-contained; `help: consider cloning` exists on 1.68.2 (the drafts believed it post-1.68). TS: the suite voice audit (which compiled the code) caught two compile-breakers; the live smoke caught the strip-and-run trap (a type-only `@ts-expect-error` whose stripped JS runs and throws), a `@ts-expect-error` living inside a `//` comment, a content arithmetic bug (the discount example claimed 108×0.95=102), and a stdout-cap overflow on the capstone. None survive a real-compiler smoke; none are caught by reading.
- **Execution infra hardened by what the smokes exposed:** the PistonAdapter renames learner `fn main`→`__learner_main` for Rust and scrubs Piston's sandbox-keeper/chmod noise; `errorKind` recognizes compiler-error signatures (`error TS####`, `error[E####]`) so type/borrow errors read as "did not compile," not "crashed"; `PISTON_RUN_TIMEOUT` 3000→8000 (Piston compiles TS at run — a ~2.7s floor even for `console.log`); the TS harness footer drops the legacy ✓/✗ echo (Piston caps stdout at 1024 bytes; the capstone's 10-test result tipped over).
- **The `metric-pair` figure consciously unserved in both scrolls** (no honest ≥3× magnitude — Rust's alloc-count would seed clone-phobia, TS's enum-vs-union is categorical not magnitude), recorded so it isn't re-proposed. **AUDIENCE.md corrected:** the TS row I'd written gave Esteban "JS from his fullstack years" — he's Python-first with no JS background; personas drive real authoring calls, so the invented detail was a real bug, caught at the TS confirmation.
- **Honest publish gate:** neither scroll publishes yet. Both are `isPublic:false` until the full-set real-Piston smoke and — for TS specifically — the Piston deploy raises `max_run_timeout` (≥8000) and `output_max_size`. Documented in the seed headers as infra the deploy owns, not a content blocker.
- **Cadence decision held; Go is next.** Go (Piston Go 1.16.2 is pre-generics — that constraint shapes the lens) is the fifth and final language scroll. *(It was scoped as S029; the unplanned format-revision interlude took the S029 slot, so Go is now S030.)*

---

## Sprint 027 — Python crash scroll + scroll hardening (2026-06-11)
**Phase 1 — Alpha**

The sprint that shipped Python and then got reviewed by its own product. The planned arc (figures W1, Python authoring W2, seeding W3) held; the unplanned middle was a full scroll-hardening pass triggered by asking "review the scrolls — content, interactions, UX, UI" and then acting on every confirmed finding. The first real smoke at close caught what only smoke catches, and one of its findings became canon.

- **Python crash scroll end-to-end.** 6 lessons / 23 steps (~105 min) under the polyglot-first lens, figures from day 1 — the structural bet of the sprint thesis paid: 5 figure embeds landed with the prose instead of as a backport. Lens held ("protocol surface + EAFP"; asyncio stayed cut). `isPublic: false` until the full-set smoke.
- **Six figure components shipped** (`before-after`, `two-by-two`, `disambiguation`, `array-track`, `tabbed-card`, plus `metric-pair` born this sprint) with the `:figure` directive parser tested, and the Ruby backport stretch landed — all four proposed embeds in the Ruby seed.
- **XSS closed in the scroll markdown renderer.** The regex pipeline interpolated captures straight into `dangerouslySetInnerHTML` with zero escaping. Latent rather than live (single author), but `admin-scrolls` exists and content authorship will widen — escaped at the source with unit tests. Found by the review, fixed the same day.
- **Player UX debt paid:** the mobile sidebar was literally unclosable below `md` (280px of a 375px screen), step navigation kept the previous step's scroll position, predict had radiogroup semantics but no arrow keys, and a failed solution fetch latched forever. All fixed; all small; all the kind of thing a speed-run audience punishes.
- **ScrollPlayerPage stopped being a god component.** 1,470 lines → a 169-line orchestrator plus `scrolls/player/` modules, with a step-type registry as the extensibility seam: adding a step type is now a component plus a registry entry, compiler-enforced. The refactor introduced exactly one regression — the registry dropped the old else-branch and crashed on the legacy `'kata'` DB value — which Adrian's smoke caught and a runtime fallback fixed. Kept honestly in the retro: narrowing dispatch needs runtime fallbacks when the DB predates the union.
- **`read+inline` shipped** (the Tier 2 type approved since Sprint 023): schema + marker contract (`<!-- interact:id -->`, typos degrade visibly) + reveal/micro-quiz renderers, with first uses in Python L5.1a (the `add.__name__` reveal that plants `@wraps`) and Ruby L3 (the operators-as-messages transfer quiz). The draft `figure` interaction kind died in implementation — the markdown directive already resolves inside prose, so the schema stayed two-kinded.
- **The 101 prototypes got their second distillation.** INTERACTIVITY-PATTERNS gained six acceleration principles (prediction-before-revelation, cost-as-number, invariants-over-time, dual representation, fail-by-design, agency-over-abstraction), each with an apply-today form — plus the deferred device kit recording the `algo-trace` architecture with adoption triggers, so the eventual algorithms-course decision starts from a design, not from zero. `metric-pair` was the one piece cheap enough to build now: real measured numbers (8,448,728 B vs 208 B for the same million results; 1,000 string objects vs 1 symbol) replacing adjectives in both scrolls.
- **The capstone rule, born from smoke.** Adrian's first real walk of both scrolls surfaced the right doubt: *"se me hace poco — can I actually write basic Ruby or Python at the end?"* The honest answer was "almost": the mechanisms were taught but never demanded together, and Ruby never made you write a `class`. Now canon (README §5.3 + §4.4): every crash scroll ends with one integrative capstone challenge, planned at outline stage where it doubles as a lesson-set completeness test, and every scroll makes the learner perform the language's production gestures. Applied immediately: Ruby's `roster` capstone (blocks + fetch + truthiness + keywords) and Money kata (first `class`, `+` and `==` as the methods they are, `send(:+)` as proof), Python's `parse_prices` capstone (three-layer decorator + EAFP + comprehensions, solution validated 5/5 against CPython 3.11). Ruby: 27 steps; Python: 23.
- **Spanish leaked into product content** — four Python lesson titles carried over from the Spanish-language curricula drafts. Fixed in seed; the curricula docs themselves (~200 Spanish lines in `ruby/ruby.md`) are a carried docs-only pass.
- **Cadence decision at close:** two language scrolls per sprint from S028 (Rust + TypeScript next, Go after). Full-set real-Piston smoke and publish decisions deferred until all five scrolls exist — Adrian's call, so the smoke happens once against the complete catalog.

---

## Sprint 026 — Ruby crash scroll end-to-end (2026-06-08)
**Phase 1 — Alpha**

The sprint that proved the polyglot-first crash-course format with Ruby end-to-end. Started as "finish Ruby Lessons 2-5" and turned into a mid-sprint scope adjustment after re-reading the spec under the lens *"crash for experienced programmers — idioms and peculiarities, not fundamentals."* The reorder, the new Lesson 0, the playground variant, the audience personas, and the authoring-flow retrospective are all this sprint. Python was downgraded to S027 per the explicit fallback declared at scope adjustment; no admin debt.

- **Polyglot-first reorder of the Ruby scroll.** New order: Lesson 0 (Ruby in context) → Lesson 1 (Blocks) → Lesson 2 (Literals that surprise) → Lesson 3 (Object model) → Lesson 4 (Control flow + truthiness) → Lesson 5 (Methods). The polyglot encounters `do |x|` and `&:method` on Friday; the scroll respects that. The object model becomes the *explanation* of why those idioms behave as they do, not the entry gate. Rhea (S10) signed off with the constraint that blocks land *before* the object model — Lesson 1 honours this.
- **Lesson 0 added — `Ruby in context`** (3 steps: 2 read + 1 predict). What Ruby is for, where it doesn't fit, the version landscape, RubyGems / Bundler, how Ruby actually gets run. Not padding — orienting information the polyglot would otherwise cobble together from five browser tabs. Voice gate: every paragraph removes one decision the polyglot would have made in another browser tab.
- **Playground as `kata` variant (Option B2)** — two playground steps (Lesson 1.5 explore `&:method`, Lesson 3.5 object model in action) shipped with `data.kind: "playground"` flag. Backend stays uniform (kata with always-pass harness); frontend reads the flag, hides verdict UI, renders an `↻ explored` chip instead of the StatusChip. Scoped to Ruby as a local experiment; promotion to a canonical step type with ADR remains the gate per `INTERACTIVITY-PATTERNS.md`.
- **AUDIENCE.md** — 4-persona authoring toolkit (A1 Mariana JS Senior, A2 Esteban Python Mid-Senior, A3 Yui Java Senior modernizing, A4 Felipe TS Modernizer). Each persona has a stack they live in, a list of things they already know cold (the scroll should not re-teach them), and per-scroll surprise tables. Authors convoke them when reviewing a step — *"Would Mariana lose anything if I cut this paragraph?"* — exactly the pattern that caught 9 issues at zero authoring cost on Ruby.
- **AUTHORING.md** — 15-stage retrospective flow reference. Reference, not contract. Captures the audience → panel → feedback-loop pattern that operationalised the 9-then-4 round of Ruby reviews. Identified the highest-ROI stage (outline-level user testing) and the lowest-ROI ones (the catalog-tour reading orders). Each scroll's author decides which stages to compress, skip, or add.
- **5 embeddable visual figures canonicalized** in `INTERACTIVITY-PATTERNS.md` § *Embeddable visual figures*: `before-after` (verbose → idiomatic side-by-side), `two-by-two` (orthogonal-axes confusion grid), `disambiguation` (near-look-alikes in identical skeletons with the divergent attribute highlighted), `array-track` (iteration concept over the same input under different methods), `tabbed-card` (one concept, multiple lenses, no animation library needed). Schema + authoring rules + anti-patterns documented. Figures embed via the `:figure[name]{attrs}` markdown directive inside `read` steps or as `kind: 'figure'` interactions in `read+inline`. Ruby lesson drafts propose figure embeds in 4 places (npm-vs-bundle, foreach-vs-each-block, string-vs-symbol, operators-as-messages). Sister-session work; see [`PROTOTYPES-101-REVIEW.md`](../.kwik-e/local/scrolls/PROTOTYPES-101-REVIEW.md) for the panel debate that produced the canon.
- **CodeEditor Ruby support** via `@codemirror/legacy-modes/mode/ruby` + a fallback for unknown languages. The legacy CodeEditor would crash with `Cannot read properties of undefined (reading 'extension')` when a scroll's language wasn't in its hardcoded set; any future scroll language now degrades to plain-text editing instead of crashing the page.
- **Legacy slug cleanup helper.** `removeLegacyScrollBySlug` in `seed-scrolls.ts` walks the FK chain manually (`stepNudges → steps → scrollProgress → lessons → scrolls`, since the schema has no `ON DELETE CASCADE`) and retires the `ruby-fundamentals` slug — declared 2026-06-06 in the seed header comment, never actually wired until the smoke surfaced the orphan row in the catalog.
- **MockExecutionAdapter fix.** With `FF_CODE_EXECUTION_ENABLED` off (dev flows without Piston), the mock was returning literal `"All tests passed. 3 tests, 0 failures"` — which the `ExecuteStep` parser couldn't read. The legacy fallback in the parser saw "fail" in "0 failures" and reported the step as failed despite the apparently-successful output. Fixed by having the mock emit the structured `__DOJO_RESULT__` shape the real Ruby / Python / SQL harnesses produce. UI flows are testable again without Piston.
- **Solution-unlock UX fix.** The previous flow auto-advanced to the next step on kata pass, which unlocked the Solution tab on the just-finished step *and immediately hid it* by switching to the next step. Adrian hit this during Ruby smoke. Fix: split the single `onComplete` callback into `onMarkComplete` + `onAdvance`; kata's `runCode` calls `onMarkComplete` only; a new "Next →" button appears beside the StatusChip when `isCompleted`. The Solution tab is now naturally discoverable. Sister-session further refined this into a `navigateToStep` helper with URL hash synchronisation.
- **4 canon-doc consistency fixes** surfaced by a cross-language audit subagent that read all four upcoming-language curriculum drafts side by side. `AUTHORING.md` referenced a cut persona ("A3 Diego"). `AUDIENCE.md` listed A3 Yui as a Python secondary but had no Python row in her surprise table. `ruby.md` cited "the heuristic's 10-15%" as if from `INTERACTIVITY-PATTERNS.md` when the heuristic actually lives in `README.md` §4.3. `AUTHORING.md` cited a `≥20 instances` gate for promoting the playground from kata-variant to canonical step type that was unreachable given 5 scrolls × 2 playgrounds = 10; reframed for the case where the variant reuses an existing pipeline.
- **Cross-language curriculum drafts staged.** Four parallel subagents drafted Python / Rust / TypeScript / Go curriculum specs (outer + inner) in `.kwik-e/tmp/curricula-drafts/` while the Ruby work cooled. Plus a cross-lang audit pass that compared all four drafts on 10 dimensions (time targets, harness shape, generics treatment, audience matrix application, etc.). Workspace-local scratch, not in repo — the drafts inform S027's Python work without committing to any specific lens choice today.
- **Python downgraded per fallback.** The sprint adjustment of 2026-06-07 declared: *"if Ruby exceeds 16 hours, Python downgrades to stretch without admin debt."* Ruby exceeded; Python carries to S027 as the new mandatory. The fallback was the entire point of declaring it — no retro mea culpa needed.

---

## Sprint 025 — Crash-course pivot + `predict` step type (2026-06-06)
**Phase 1 — Alpha**

The sprint that started as "rescope the Ruby curriculum" and turned into a product-direction call. The previous direction had each language carrying 6-8 sub-courses; the math was 40+ deliverables across 5 languages, scoping us into multi-year content debt. After a real evaluation pass on the Lesson 1 POC (Ruby Fundamentals as it stood), the panel converged: long fundamentals competing with Codecademy / Boot.dev / freeCodeCamp is a losing position; what's actually under-served is "polyglot dev with a deadline wants confidence in a new language by Friday." That's not curriculum, that's crash course.

- **ADR 022 commits the pivot** — five language scrolls (Ruby, Go, Python, Rust, TypeScript) as the *anchored* set (closed, not extensible); 90 min target with up to 120 when the language warrants; audience contract is the developer who already programs in another language; deep-dive scrolls (SQL window functions, Ruby metaprogramming, async Python) as a separate shape, deferred. "Scroll" stays as the single product noun — the descriptor "crash course" lives in copy, not in vocabulary. The kata loop returns to being the strategic focus; scrolls become a top-of-funnel artifact a learner can finish in a sitting.
- **Course Authoring Profile + Sub-course Authoring Spec architecture** (introduced mid-sprint, survives the pivot) — every language file declares its voice, density rhythm, interactivity menu (which `step.type`s it uses and which it deliberately excludes), and pedagogical bets. The per-scroll spec (`curricula/<lang>/<slug>.md` per `authoring-spec-template.md`) is the executable brief — dense enough that an author can write the scroll content without inventing pedagogy on the fly.
- **Ruby crash spec written** (`curricula/ruby/ruby.md`) — 5 lessons, ~16-20 steps, ~90 min. Lesson 1 spec-complete (read + predict + 2 katas); Lessons 2-5 stubbed with shape decisions made. The other 4 language curricula (`go.md`, `python.md`, `rust.md`, `typescript.md`) flagged as pre-pivot drafts in their headers — each language gets its re-scope in its own sprint, specialist-led (S6 Kenji / S7 Nadia / S8 Björn / S9 Leo).
- **`predict` step type shipped end-to-end** — Drizzle migration 0022 adds `data jsonb` to the `steps` table for variant-shaped Tier 2 payloads (extensible to future `trace` / `read+inline`). `StepType` extended in Zod + TS + domain values + `StepSeed`. `PredictData` / `PredictOption` types in `@dojo/shared`. `ScrollPlayerPage` dispatches `predict` to a new `PredictStep` component — CSS state machine (`unanswered → revealed`), 4-option radiogroup with per-option feedback voice, correct/wrong styling + hint outline on the unselected correct answer. Per [INTERACTIVITY-PATTERNS.md](docs/courses/INTERACTIVITY-PATTERNS.md) §predict.
- **Motion runtime policy on `/scrolls/*` codified** — Rive + CSS only; **GSAP excluded from scroll routes**. The previous two-library model (GSAP + Rive co-load on scrolls) is simplified: at Phase 0 with one user/designer/engineer, the Rive designer-iterates-without-engineer property is vapor; CSS state machine is the honest v1 choice. Rive returns when a real designer or a 5+ state machine arrives. The PredictStep contract is built so the swap is mechanical (same three states, same `onComplete`).
- **CSS motion polish on the scroll player** — five new keyframes in `main.css` (`step-fade-in` on step change via `key={step.id}` remount; `status-reveal` on pass/fail chip mount; `test-row-fade-in` with index-based `animation-delay` stagger; `editor-focus-ring` on `:focus-within`; Run button gets `transition-all duration-150 active:scale-95`). All honor `prefers-reduced-motion` via the global override.
- **TypeScript scroll UUID drift bug fixed** — `pnpm db:seed:scrolls` had been crashing on the TS scroll for weeks because the row's actual DB id diverged from `seedUuid('typescript-fundamentals')`; the upsert on slug correctly UPDATEd in place (preserving id), but the lessons insert tried `scrollId: COURSE_ID` (the seed-computed value), violating the FK. Fix: `seedOneScroll` now `.returning({ id })`s the actual id post-upsert and re-maps every lesson's `scrollId` to it (plus adds `scrollId` to the lessons update set so previously-orphaned lessons reattach). Five scrolls now seed end-to-end clean.
- **Devcontainer drift fix** — `post-install.sh` hand-rolled a 5-package Piston install loop with `version: "*"` while `scripts/piston-reprovision.sh` was the canonical 7-runtime pinned source of truth. Replaced the loop with a delegated invocation. Dev now installs the same set as prod, no version drift.
- **Ruby scroll seeded** as the format proof: slug `ruby` (per ADR 022 slug convention — bare language slug for the crash course; future deep-dives use `<lang>-<topic>`), 4 steps (read + predict + 2 katas), Ruby 3.0.1 via Piston, manual `_t`/`_eq` harness emitting `__DOJO_RESULT__` JSON for `ExecuteStep` to parse. Minitest is deliberately deferred to its own future deep-dive — the crash scroll shouldn't introduce a test harness as teaching content. `isPublic: false`; Ruby execution stays authed-only (the POC eval pass briefly flipped both anonymous for review ease; restored at sprint close per Marta's security posture).
- **Verification** — `pnpm typecheck` green across all 5 workspaces; `pnpm lint` green; `pnpm test --filter=api` 146 passing (3 fixtures patched for the new `data: null` field on `Step`); `pnpm db:seed:scrolls` runs clean end-to-end for all 5 scrolls including TS. Migration 0022 applied. Ruby scroll renders end-to-end in dev including the new predict step.

Full sprint write-up: [sprints/archive/sprint-025-crash-course-pivot.md](docs/sprints/archive/sprint-025-crash-course-pivot.md).

---

## Sprint 024 — Maintenance pass + Sumi-e theme foundation (2026-06-06)
**Phase 1 — Alpha**

The block that started as a maintenance sweep and turned into the Sumi-e theme migration foundation. Two threads in the same sprint because the type-scale normalization and the design-system audit were natural staging ground for shipping the theme infrastructure cleanly. Closes S023's deferred "Day 8 visual polish" item and ships the dual-theme machinery ahead of the designer-pass on values.

- **4 brand-honesty violations closed** — fake `api / db / llm · ok` status dots removed from the dashboard (were hardcoded to true); the access-request form surfaces real errors instead of fake "Received"; weekly goal target no longer defaults to 3 invented out of thin air; `PracticePatternsCard` gated to ≥3 completed kata so empty users don't see "Avg time 00:00". The product had been lying in small ways — none of them load-bearing, all of them precisely the kind of cosmetic dishonesty BRANDING.md prohibits.
- **XSS in `POST /access-requests` outbound email closed** — `githubHandle` and `reason` were interpolated directly into HTML; `reason` allowed up to 1000 chars of attacker-controlled markup. Tightened the zod schema to the actual GitHub username grammar (`^@?[a-zA-Z0-9](?:[a-zA-Z0-9-]){0,38}$` — also closes the subject-header `\r\n` injection vector) and `escapeHtml`-wrapped every interpolated value (defense in depth).
- **`/dashboard` parallelized** — the handler ran 10 sequential DB awaits when only the active-session check + conditional UPDATE actually carry a hard dependency. Refactored into a Phase 1 barrier + a `Promise.all` of 9 independent reads. P95 drops 5-6× at steady state. Same payload shape, no caller change.
- **Bug fixes** — `avgTime` formatting broke at ≥100 min (`padStart(2, '0')` doesn't truncate, rendered `150:00`); `useEvaluationStream` setTimeout for the post-verdict redirect was never cleaned up on unmount (component could navigate against an unauthorized route after logout); the sensei was evaluating with `kataTitle: ''` (TODO comment lived through several sprints), degrading prompt quality on review katas specifically since the title renders as the PR title in that prompt variant.
- **Brand type scale formalized** — `DESIGN.md` §Typography declared `--text-xs/sm/base/lg/xl/2xl/4xl` with brand-specific sizes (11/13/15/18/24/32/48) but `main.css` never declared them, so Tailwind utilities resolved to the framework defaults (12/14/16/18/20/24/36). The drift produced 411 arbitrary `text-[Npx]` callsites across 55 files trying to hit the brand sizes ad-hoc. Added the scale to `@theme` (plus a new `--text-3xl` and `--text-5xl` for sizes the code was already using) and migrated every callsite to the named utility. Visual shifts at `xl/2xl/4xl` are intentional — the brand spec wins.
- **Sumi-e dual-theme infrastructure shipped** (ADR 021) — `[data-theme="sumi" | "washi"]` CSS overrides in `main.css` re-bind every `--color-*` token. `lib/theme.ts` + `useTheme` React hook handle OS auto-detect (`prefers-color-scheme`) + `localStorage` persistence + initial paint without FOUC (`initTheme()` runs before React mounts). Toggle ships in `/settings` (4 pills) + sidebar (3-state cycle button). No feature flag — single-creator constraint, instant rollback via the Slate option in the toggle. Values are v1 draft per `DESIGN.md` §Migration path; calibration against paper samples is deferred but unblocked.
- **Brand motifs shipped as components** — `EnsoLoader` (clockwise stroke-dashoffset draw, ~600ms once, loops if loading >2s), `HankoBadge` (vermillion seal, char-stack for single words / word-stack for phrases), `BrushstrokeUnderline` (deterministic seed picks one of 6 geometric placeholders, draws on viewport entry via IntersectionObserver), `BeltRingAvatar` (2px `boxShadow` ring colored by rank, `border-radius: 2px` hanko-square geometry for black belt), `lib/brushstrokes.ts` library (3 underlines + 3 ticks, hash-seeded). Placeholder paths are smooth Béziers marked TODO — CC0 sumi-e strokes from Wikimedia / commissioned work come later without touching consumers.
- **Motif integration across surfaces** — `HankoBadge` on `/belts` milestone cards, `BrushstrokeUnderline` under kata title (ResultsPage) and belt rank header (BeltsPage), `BeltRingAvatar` on `/settings` + `/u/:username`, belt-color 4px band on the public profile header, faint enso wash behind sensei chat-avatar initials, ink-wash heatmap ramp consolidated into the shared `Heatmap` component, drawn vermillion brushstroke (CSS `@keyframes brushstroke-draw`) replacing the verdict block's solid left bar. Belt color tokens added to `@theme` (`--color-belt-{white,yellow,green,brown,black}`) and the two `RANK_COLOR` duplicates retired.
- **Editor themes follow brand** — `useThemeTokens` hook reads resolved `--color-*` from the DOM and re-emits on `data-theme` mutation via `MutationObserver`. `CodeEditor` rebuilds CodeMirror's `EditorView.theme` + `HighlightStyle` from the resolved tokens; `MermaidEditor` re-runs `mermaid.initialize` and re-renders the active diagram. Highlight tokens map to brand colors (keyword → accent, string → success, number → warning, comment → muted). Closes the immersion break where the kata-flow editor stayed Slate Indigo regardless of theme.
- **Landing GSAP polish** — hero `TypewriterText` + `SecondLine` + manual delay math swapped for a single declarative `gsap.timeline`; 4 `ScrollFadeIn` IntersectionObserver wrappers collapsed into one `ScrollTrigger.batch` (`ScrollFadeIn.tsx` deleted); `TerminalDemo` cycles 3 sample sessions on a repeating timeline. `DESIGN.md` §Motion updated to declare landing as a deliberate GSAP exception to the "CSS-only on product surfaces" rule (the rest of the GSAP/Rive scope policy carries unchanged).
- **`BRANDING.md` split** — voice + IA + microcopy + glossary stays in BRANDING; tokens + themes + motifs + components + motion specs move to DESIGN. The two had drifted (BRANDING declared stale token names that no longer existed in `main.css`); rewrote BRANDING to own the language layer only and made the doc boundary explicit in the preamble of both files.
- **`stitch/` retired** — was gitignored AI-design scratch space with stale token names. Repo cleaned of 17 references (DESIGN.md ×14, CHANGELOG ×1, code-comment breadcrumbs ×2). `.gitignore` line dropped.
- **Cleanup** — Toast `shadow-lg` removed (brand prohibits drop shadows); `HeatmapDayDTO`, `SessionSummaryDTO`, `PublicSessionDTO` extracted to `@dojo/shared` (were declared inline in two DTOs); landing's duplicated "Sign up →" CTA in the sticky nav dropped (hero "Enter dojo →" carries conversion alone); `docs/README.md` + `docs/WORKFLOW.md` doc-map descriptions resynced to the BRANDING / DESIGN split.
- **Tests** — `/dashboard` route handler covered by 5 unit tests (mock chain via recursive Proxy + `vi.hoisted`), exercising the empty-shape default, the regression guard against re-adding `senseiSuggests`, the brand-honesty `weeklyTarget === null` fix, the user-set target case, and the belt-in-payload path. E2E specs synced with S023's `/learn` → `/scrolls` + `exercise` → `kata` rename (landing, dashboard, kata-flow, results-page, `public-courses.spec.ts` → `public-scrolls.spec.ts`); `belt` added to mock dashboards.
- **GitHub stats proxy** — landing was calling `api.github.com` directly, rate-limited at 60/hr per visitor IP. Moved to a new `/landing/repo-stats` endpoint with 10min in-memory cache + graceful fallback. Same data, no longer a single-popular-tweet outage waiting to happen.
- **Verification** — `pnpm typecheck` green (shared + api + web), `pnpm lint` green, `pnpm test --filter=@dojo/api` 146 passing (5 new in `dashboard.test.ts`), `pnpm test --filter=@dojo/web` 23 passing. Production deploy verified by the creator after merge.

Full sprint write-up: [sprints/archive/sprint-024-maintenance-sumi-e.md](docs/sprints/archive/sprint-024-maintenance-sumi-e.md).

---

## Sprint 023 — Dojo ubiquitous language pass (2026-06-05)
**Phase 1 — Alpha**

The sprint where the codebase finally speaks one vocabulary. The product was already half-committed to the dojo metaphor (dojo, sensei, kata) but the URLs and the code still spoke generic SaaS (`/learn`, `/badges`, `/leaderboard`, `Exercise`, `Course`, `Badge`). The seam read as indecision. Doing this before Phase 1 invites scale meant zero external links to break and no share cards in circulation to regenerate.

- **Routes renamed end-to-end** (PRD-030) — `/kata` → `/katas`, `/learn` → `/scrolls`, `/playground` → `/engawa`, `/badges` → `/belts`, `/share/course/*` → `/share/scroll/*`, `/admin/exercises` → `/admin/katas`, `/admin/courses` → `/admin/scrolls`. Old paths deleted (zero users, no 301s). `/dashboard` and `/start` stay — generic terms that earn their place.
- **`/leaderboard` deleted, not renamed** — kumite is sparring, not ranking. Surfacing rank lives on `/belts` (identity), not on a competitive leaderboard surface. The leaderboard endpoint, page, types, and client method are all gone. PRD-031 documents the leaderboard-as-identity-corruption rationale.
- **`/kumite` placeholder shipped** — reserved URL with an honest "coming soon" panel that explains kumite will be 1v1 sparring with paired evaluation. Not built; not a relabel of leaderboard. Future PRD covers the feature design.
- **Belts system shipped** (PRD-031, Spec 028) — `BeltRank` value object (white / yellow / green / brown / black), `BELT_THRESHOLDS` table in `domain/recognition/belt.ts`, `CalculateBelt` use case (stubbed to white at sprint close; full factor projection deferred). Hard constraint: the sensei does **not** influence belt advancement. Rubric is volume + topic-cluster diversity + active days + cooldown — derivable from existing session/attempt data, no migrations required to revise.
- **Badge → Milestone** — the existing `Badge` records (FIRST_KATA, POLYGLOT, COURSE_*) are single-moment achievements, not rank. PRD-030 originally proposed renaming them to `Belt`; the rename inventory caught the conflation. They are renamed to `Milestone` instead. `/belts` page surfaces both: belt rank as headline + milestones as a section below.
- **Domain code ubiquitous language** — `Exercise` aggregate → `Kata`, `Course` aggregate → `Scroll`, `Badge` aggregate → `Milestone`. Touched: shared schemas, domain layer, application use cases, infrastructure adapters, HTTP routes, container wiring, event handlers, frontend pages, App.tsx, Sidebar/BottomNav, API client. ~157 files renamed across the monorepo.
- **Schema export rename, DB names preserved** (ADR 020) — Spec 028's "alias on import" approach was insufficient: Drizzle's relational query API binds to the exported table variable name. Adjusted: `schema.ts` exports `katas`, `scrolls`, `userMilestones`, `scrollProgress` directly, while DB table names stay legacy via `pgTable('exercises', ...)`. Column property names also follow ubiquitous language (`sessions.kataId` maps to column `exercise_id`). The schema file becomes the single canonical mapping point between legacy DB shape and dojo vocabulary.
- **Topic clusters helper** — `topicCluster(topic: Topic): TopicCluster` added to `@dojo/shared`. The mapping is `Record<Topic, TopicCluster>` so TypeScript fails the build if a new topic is added without a cluster — invariant enforced at compile time, no runtime test needed.
- **Sensei prompts updated + calibration harness shipped** — literal `EXERCISE:` → `KATA:` and "bug-fix exercise" → "bug-fix kata" applied in `prompts/sensei.ts`. The calibration gate ships as a standalone script ([scripts/calibrate-sensei.ts](apps/api/src/scripts/calibrate-sensei.ts) + [.fixture.ts](apps/api/src/scripts/calibrate-sensei.fixture.ts)) that embeds the pre-rename "legacy" prompt as a string baseline, runs the new prompt against a 10-kata fixture (3 easy + 4 medium + 3 hard), parses verdicts, and reports per-difficulty drift. Exits 1 if any bucket exceeds ±10pt. Smoke verified with `pnpm calibrate:sensei --smoke`; the real-LLM run (`LLM_API_KEY=... pnpm --filter=api calibrate:sensei`) is the gate the creator runs locally before declaring the rename validated.
- **Step type `'exercise'` stays** — orthogonal to the aggregate rename. It's the step kind inside a Scroll, not the renamed aggregate. Left intact in `StepType`.
- **Docs aligned in the same sprint** — `ARCHITECTURE.md`, `README.md`, `AGENTS.md`, `BRANDING.md` updated. BRANDING gained a glossary section (kata / sensei / scroll / belt / milestone / engawa / kumite — each with on-brand and off-brand examples) plus a rewritten Belts & Milestones section. Old ADRs / archived sprints / archived specs were **not** edited — they are history.
- **Belt computation is real, not stubbed** — `computeBeltFromHistory(history, now)` walks completed sessions chronologically as a state machine, maintaining running count, topic-cluster set, and 30-day activity window. Promotes at most one rank per session, only when both next-rank thresholds and cooldown at current rank are satisfied. `SessionRepository.listCompletedKataHistoryForBelt(userId)` ships the projection — single JOIN between `sessions` and `katas`, ordered by `startedAt asc`. Pure-domain unit tests cover the cooldown gate, the activity-window math, and tolerance for legacy topic slugs.
- **Verification** — `pnpm typecheck` green across the monorepo (shared + api + web); `pnpm test --filter=api` — 141 passing (8 new in `domain/recognition/belt.test.ts` + 4 in `application/recognition/CalculateBelt.test.ts`). Visual polish (belt rings, share card variant) and the real-LLM calibration run are explicit follow-ups, not blockers.

---

## Documentation cleanup (2026-06-05)

The `docs/` folder had drifted: `docs/wip/` had become a permanent limbo for research that had already materialized into specs, root-level `CODE_SCHOOL_PLAN.md` and `MARKET_STUDY.md` were ungrouped with the rest, and early-phase PRDs (001-005, 008-010, 013) sat next to active ones, signaling "still relevant" when they were not. The fix was structural, not cosmetic.

- **`docs/research/` introduced** — Background plans/analyses that informed past decisions and are still cited from canonical docs (ADRs, courses/README) live here. Moved in: `CODE_SCHOOL_PLAN.md`, `EXECUTION_PLAN.md`, `EXERCISE-VARIETY-ANALYSIS.md`, `MARKET_RESEARCH.md`, `SPRINT-014-alt-iframe-sandbox.md`. Stale references in ADR 014, ADR 016, spec 021, sprint-015 archive, and `courses/README.md` updated to the new paths.
- **`docs/courses/testcode-pattern.md`** — `IFRAME-TESTCODE-PATTERN.md` was an active reference for course authors, not WIP. Promoted out of `wip/` into `courses/` next to `courses/README.md` where it gets discovered.
- **`docs/research/prd-archive/`** — Early-phase exploratory PRDs (001-005, 008-010, 013) that served their purpose during Phase 0 planning moved out of `docs/prd/`. `ROADMAP.md` PRD index updated to point to the archive and marks them `Archived`.
- **`docs/wip/` deleted** — The concept was the bug. In-progress work belongs in `sprints/current.md` or in a branch, not in a doc folder that never empties. `.gitignore` cleaned up accordingly.
- **`docs/MARKET_STUDY.md` deleted** — Survey methodology written for Phase 0 problem validation, never executed (alpha cohort feedback served that role instead). Zero references.
- **`docs/README.md` introduced** — Entry point that organizes everything by lifecycle: canonical (source of truth) / live (active work) / history (immutable) / exploratory & archived research (disposable). Reading order by role (new contributor / AI agent / picking up active work / course author / decision archaeology).
- **Status headers on the seven canonical docs** — `VISION`, `IDENTITY`, `EXPERTS`, `ROADMAP`, `WORKFLOW`, `ARCHITECTURE`, `BRANDING` now carry a one-liner declaring their lifecycle. A reader knows at a glance whether they are reading current truth or a frozen artifact.
- **`docs/WORKFLOW.md` doc map rewritten** — Now includes a Lifecycle column so each doc declares its expected mutation rate. `AGENTS.md` build context now points at `docs/README.md` as the entry point.
- **What was *not* touched** — `docs/specs/`, `docs/adr/`, `docs/sprints/archive/`, and `docs/courses/{language}.md` are project history or active references; left untouched. (`stitch/` was later deleted — see the doc-system sweep that consolidated everything into `docs/DESIGN.md` + `docs/BRANDING.md`.)

---

## Sprint 022 — Open the door: friend cohort + public playground (2026-04-26)
**Phase 1 — Alpha → hook experiment**

The sprint where the platform got its first top-of-funnel surface, the prep loop got real streaming, and authenticated learners got a free-form Q&A surface — all behind feature flags so the rollout is reversible.

- **Playground v0** (PRD 029, migration 0020) — Anonymous code execution at `/playground` with the full four-layer abuse stack: per-IP rate limit + per-browser-session rate limit + Cloudflare Turnstile + global daily quota. `playground_runs` log retains only `(ip_hash, session_hash, language, version, exit_code, runtime_ms)` — no source code, no stdout/stderr. Funnel events emitted from day one (`playground_run`, `playground_cta_click`, `playground_signup_conversion`). Behind `FF_PLAYGROUND_CONSOLE_ENABLED`. Six languages whitelisted (Python, TypeScript, Go, Ruby, Rust, SQL).
- **Playground v1 — ask-sensei** (migration 0021) — Authenticated free-form Q&A streamed via SSE. `LLMPort.askSensei` returns `{stream, usage}` so the route can stream answer deltas and log token counts simultaneously. Hard daily quota per user (default 30/day) enforced server-side against the new `llm_requests_log` table. Question and answer text deliberately NOT persisted — the surface is exploration, not graded practice. UI is a modal with the panel-mandated disclaimer baked in. Behind `FF_PLAYGROUND_ASK_SENSEI_ENABLED`. Anonymous LLM access stayed explicitly out of scope.
- **Streaming kata prep** — `GET /sessions/:id/body-stream` SSE endpoint replaces the 2s polling loop when `FF_LLM_PREP_STREAMING_ENABLED` is on. Idempotent on already-persisted bodies (replays as one `token` + `done` frame). Concurrent connections get 409 to avoid duplicate LLM calls. Frontend prefers SSE and falls back to polling on 404 — old deploys and new deploys both work, the flag rollout is genuinely safe. Brings perceived prep latency from ~30s to ~2s on Sonnet 4.6.
- **Smoke suite** — six specs (`sign-in`, `view-profile`, `view-dashboard`, `complete-course-step`, `complete-kata`, `playground-anon-run`). `complete-kata` and `playground-anon-run` skip cleanly on prod runs that don't carry `SMOKE_USE_MOCK_LLM=1` / `SMOKE_PLAYGROUND_ENABLED=1` so a single workflow definition works against staging and prod.
- **Operational floor** — Errors retention cron (`/cron/cleanup-errors`, 30-day window). Piston liveness: GHA `piston-liveness.yml` workflow probes `/health/piston` every 30 minutes, two consecutive failures alert via GitHub's email path (ADR 019). `scripts/piston-reprovision.sh` is idempotent and documented in the README runbook.
- **Runtime bumps blocked upstream** — Go / Ruby / Rust bumps deferred to backlog. `engineer-man/piston` ships only Go 1.16.2, Ruby up to 3.0.1, Rust up to 1.68.2; bumping to current stable requires either a maintained fork or a custom package layer.
- **First friend invite carried to S023** — code surface ready (S021 + S022); dispatch is humans-only and was not blocked by anything in this sprint. Audit doc scaffolded at `docs/audits/2026-04-friend-feedback.md` with a 7-day populate-or-cut rule.
- **Verification** — typecheck ✓, lint ✓, API test suite green (123 tests). Three new feature flags all default-off. Frontend's SSE-first / polling-fallback path makes flag flips reversible without redeploy.

---

## Sprint 020 — Phase 1 expansion (2026-04-21)
**Phase 1 — Alpha**

The sprint where the platform stopped being a prototype and started behaving like a product — error states, acquisition loop, a new kata format, and the observability to know when any of it breaks.

- **UX/UI audit + 5 shipped fixes** — Soren C6 walked every user-facing flow and filed 13 findings in [docs/ux-gaps-2026-04.md](docs/ux-gaps-2026-04.md). Shipped: **B-1** kata prepare timeout cut 60s → 20s with a "taking longer than usual" notice at 8s; **B-2** `ResultsPage` survives reload via API hydration instead of sessionStorage; **F-1** reusable `ErrorState` component retrofitted into `CoursePlayerPage`, `SharePage`, `PublicProfilePage` (distinguishes 404 vs network); **F-2** `SenseiEvalPage` announces "Evaluation complete — opening full analysis…" during the 1.5s auto-redirect; **F-3** `useEvaluationStream` surfaces a reconnect affordance on unexpected WS close codes instead of freezing. Remaining findings (F-4..F-6, P-1..P-6) moved to backlog.
- **Acquisition loop closed** (migration 0017) — Course completion now ships: a dynamic satori-based share card at `/share/course/:slug/:userId`, three per-course badges (TS / JS DOM / SQL) emitted by a new `CourseCompleted` domain event, and a "Share your completion" banner on the course final screen with native share + clipboard + Twitter fallback. TS Fundamentals and JS DOM flipped to `isPublic: true` so visitors can try them without auth. The catalog now has 3 public courses.
- **Ask the sensei MVP** (single-shot nudge, PRD 026) — `LLMPort.generateNudge` + `GenerateNudge` use case + `POST /learn/nudge` + rate limiter + `FF_COURSE_NUDGE_ENABLED` flag + inline UI. Persistence in the same sprint: `step_nudges` table + 👍👎 feedback. No memory, no threaded chat — full version deferred to S021+ if usage signals it.
- **"Code Review" kata format POC** (migration 0019, PRD 027) — New `'review'` exercise type + nullable `rubric JSONB` column. `buildReviewPrompt` short-circuits `GenerateSessionBody` so the sensei evaluates against the rubric, not against code. First kata seeded: "Inventory drift bug" with 5-issue rubric. `TypeBadge` gained a `REVIEW` variant. Editor wiring treats review input as plain text + rubric preview. Real format, 1 live kata.
- **Python course skeleton** (PRD 025) — `python-for-the-practiced` in `status: draft`, L1 with 2 steps (intro read + `@dataclass` exercise). Python test harness in-file. L1.3 / L1.4 / L2 / L3 slide to S021 — the skeleton ships so the schema and test harness are exercised in-sprint.
- **Editorial backfill — alternative approach on 6 key steps** — TS L1.3 (template literal vs concatenation), TS L1.4 (arrow vs function), TS L2.2 (for-of vs reduce), TS L3.2 (concatenation form of FizzBuzz), JS DOM L1.2 (innerText vs textContent), SQL L1.2 (DENSE_RANK vs RANK). The field shipped empty in S019; it now has content where it most helps.
- **Observability — error reporting pipeline** (ADR 017, migration 0016) — `ErrorReporterPort` + 4 composable adapters on both API (`Console`, `Postgres`, `Sentry`, `Composite`) and web (`Console`, `Api`, `SentryBrowser`, `Composite`). API wired into `router.ts` `onError` + `POST /errors` (rate-limited 30/min/IP) so the web boundary fans out to all three sinks via a single server round-trip. Web wired into `ErrorBoundary.componentDidCatch`, `window.onerror`, `unhandledrejection`. Admin surface at `/admin/errors` with filtering by source + status. Sentry SDKs (`@sentry/node`, `@sentry/react`) gated on DSN + environment so a prod `.env` on a laptop can't burn Sentry quota. Source maps uploaded via `@sentry/vite-plugin` keyed on `VITE_SENTRY_RELEASE` (git SHA). README + `.env.example` updated with the full matrix of env vars.
- **Piston production recovery** (ADR 018) — The `/health/piston` endpoint that shipped this sprint surfaced that Piston had been in a crashloop for ~3 weeks, invisible because neither the app nor the proxy health checks touched it. Root cause: a host kernel upgrade tightened cgroup v2 delegation; `privileged: true` alone was no longer enough. Fix: `privileged` + `cgroupns: host` + named volume for `/piston/packages` + pinned image digest. 6 runtimes reinstalled. The accessory is now explicitly configured for the hardening it was accidentally relying on.
- **CSP fix — Sentry ingest** — Part 7.10 verification caught that the web nginx CSP's `connect-src` was blocking the Sentry browser SDK from reaching `*.ingest.us.sentry.io`. Events still reached Sentry via the server-side fan-out, but the web SDK's richer browser breadcrumbs were silently dropped. Whitelisted the ingest pattern; the direct path is restored.
- **Verification** — typecheck ✓, lint ✓, API + web test suites green pre-deploy. `/health/piston` returns `{ status: 'ok', runtimes: [python, typescript, sqlite3, go, ruby, rust] }` in prod. Dashboard EXPLAIN ANALYZE on the 3 hottest queries (weak areas, recent sessions + verdict subquery, heatmap 30d) ran cleanly in 0.07–0.27 ms — plans are healthy given the current data volume, but too sparse to validate the sprint-012 N+1 fix. Re-run flagged for after the alpha cohort has been active 2-3 weeks.

---

## Sprint 019 — Course content quality v2: pedagogy (2026-04-17)
**Phase 1 — Alpha**

The sprint where the courses became pedagogically complete — not just structurally correct.

- **Semantic slots renderer** — `MarkdownContent` now detects `## Why this matters` / `## Your task` / `## Examples` / `## Edge cases` at the start of a step instruction and renders each as a styled card (accent, neutral, muted, warning). Falls back to plain markdown when no slots are found. Pure function `renderSlots()` with 6 unit tests. vitest added to `apps/web` for the first time.
- **External references per course** (migration 0015, `courses.external_references` JSONB) — Framework §8 required every sub-course to cite books, docs, or talks it draws from; all 3 courses now do. SQL Deep Cuts: *Use The Index, Luke!*, SQLite Window Functions docs, *Learn SQL the Hard Way*. TS Fundamentals: TypeScript Handbook, *Effective TypeScript*, Total TypeScript Tips. JS DOM: MDN DOM intro, MDN Event delegation, *YDKJS Objects & Classes*. Rendered as a "Further reading" collapsible section at the bottom of the course sidebar.
- **Alternative approach post-pass** (migration 0015, `steps.alternative_approach` TEXT) — The solution endpoint now returns `{ solution, alternativeApproach }`. When present, an "Alternative approach" `<details>` section appears below the reference solution in the Solution tab. Schema and UI wiring complete; editorial content for individual steps will be backfilled incrementally.
- **SQL L1.4 — "Compare each row to the previous"** — New exercise introducing `LAG(expr, offset, default)` with a month-over-month sales delta. SQL Deep Cuts goes from 9 → 10 steps. `validate:courses` 14/14 green.
- **Verification** — typecheck ✓, lint ✓, 106/106 API tests, 6/6 web tests, `validate:courses` 14/14 OK + 6 iframe skipped + 10 no-solution skipped.

---

## Sprint 018 — Course content quality v1 (2026-04-16)
**Phase 1 — Alpha**

The sprint where the curriculum framework written in `docs/courses/README.md` finally became executable in the schema and in the catalog.

- **Step type `exercise` reintroduced** (migration 0014) — Sprint 017 collapsed everything that wasn't `read` into `challenge`. The framework distinguishes warmup (`exercise`, ~80% pass on first try) from stretch (`challenge`, ~40%) for a reason. `StepType` is now `'read' | 'code' | 'exercise' | 'challenge'`, the column default flipped to `exercise`, and the sidebar gives each type a distinct icon (📖 read, 📝 exercise, ⚡ challenge).
- **`step.title` and `step.solution` columns** — Title was being extracted from the H1 of the instruction markdown by regex; now it's a real top-level field. Solution is the reference implementation, intentionally absent from `/learn/courses/:slug` so it can never leak before pass.
- **27 step rows backfilled and reclassified** — Every step now has an explicit `title` (the H1 was stripped from the body so it isn't rendered twice). 19 non-read steps got a hand-written reference `solution`. Most former `challenge` rows were downgraded to `exercise`; only the genuine stretch ones kept the marker.
- **Per-course audits:** TS Fundamentals gained a new "Template literals" read step in L1 (the existing greet exercise used `${}` syntax that hadn't been taught yet) and a new "Implement memoize" challenge in L3 (so the sub-course finally satisfies the framework's "every sub-course needs ≥1 challenge" rule). JS DOM L1.1 now mentions `getElementById` alongside `querySelector` with the trade-off, and the L3.3 delegation challenge hint was reworded to point at the DOM-tree concept instead of giving away `closest('li')`. SQL Deep Cuts L2.2 had its starter input shortened from 12 → 8 lines to reduce cognitive load.
- **Solution reveal panel** — `GET /learn/courses/:slug/steps/:stepId/solution` returns 403 until the caller has the step in their `completedSteps`, then 200 with the reference. New "Solution" tab in the StepEditor next to Tests/Output, locked with 🔒 until pass, lazy-fetched on first open. Body opens with "One way to write this. Yours might be different — both can be right." so it reads as comparison, not as the answer.
- **`pnpm validate:courses` CI gate** — A standalone script walks every seeded step that has a `solution`, runs it through the same `ExecuteStep` use case the learner triggers, and asserts `passed === true`. On first run it caught two real bugs in our own seeds: the TS Sum-an-array test used `Array.from` (Piston's TS 5.0.3 default lib is ES5, no `Array.from`) and the original debounce challenge needed `Promise` + top-level `await` (also unsupported by the runtime). Sum was rewritten to a for-loop; debounce was replaced with synchronous `memoize`.
- **Verification** — typecheck ✓, lint ✓, 106/106 API tests (+5 for the solution endpoint), 10/10 E2E. `validate:courses` reports 13/13 OK with 6 iframe steps skipped.

---

## Sprint 017 — SQL Deep Cuts + Public Courses + Debugging Sensei (2026-04-15)
**Phase 1 — Alpha**

The sprint where the dojo got its first truly public course and the sensei learned to evaluate bug-fix exercises differently.

- **SQL Deep Cuts course (public)** — The draft from Sprint 016 is now a live course at `/learn/sql-deep-cuts`. 3 lessons, 9 steps (3 read + 6 challenge): window functions (RANK, running totals), CTEs (refactor + chained budget ratio), real-world analysis (cohort sizes + a final "rewrite this slow churn report" challenge). Marked `isPublic: true` — no login required to try it.
- **SQL testCode harness (SQLite, finally real)** — Sprint 016's SQL katas shipped with PostgreSQL syntax (`DO $$ BEGIN ... RAISE EXCEPTION`, `to_char`) that never executed — Piston runs SQLite (ADR 014). Fixed with a new convention: `PistonAdapter.buildSqlScript()` substitutes `-- @SOLUTION_FILE` with `CREATE VIEW solution AS <user code>;`, and assertions use `SELECT CASE WHEN cond THEN '✓ name' ELSE '✗ name: reason' END` + a final `CREATE TABLE _ok (ok INT CHECK(ok=1))` gate that forces exit 1 on any miss. All 3 `sql-advanced.ts` katas rewritten and verified. All 6 SQL Deep Cuts challenges verified (correct answer → exit 0, known-wrong → exit 1).
- **Public courses + anonymous progress** (migration 0013) — `courses.is_public` flag + `course_progress.anonymous_session_id` (nullable, partial unique index). `CourseProgress` port rebuilt around a `ProgressOwner` union: `{ kind: 'user', userId } | { kind: 'anonymous', sessionId }`. New `MergeAnonymousProgress` use case: when a user logs in, anonymous progress unioned into their account (max `lastAccessedAt`), then the anonymous row is deleted. `POST /learn/progress/merge` endpoint. Frontend `dojo-anon-id` in localStorage + `optionalAuth` middleware + language whitelist on the anonymous `/learn/execute` path (Marta: shrink attack surface).
- **Step type `read | code | challenge`** — Normalized from legacy `explanation | exercise` via the same migration. `CoursePlayerPage` already renders `read` as markdown-only (no editor) since Sprint 014 — the rename closed the loop.
- **"Public" badge** on course cards in the catalog, accent-colored border, visible to all visitors.
- **Sensei prompt — debugging context** — When `exercise.category === 'debugging'`, all three prompt variants inject a 5-line block focused on root-cause identification vs. symptom patching, fix minimality, and understanding WHY the code was wrong. Relevant for the 5 fix-the-bug katas from Sprint 016. `category` threaded through `LLMPort.evaluate` + adapters (Anthropic, OpenAI).
- **Journal recovery** — `_journal.json` was missing entries for migrations 0012 and 0013, so neither was applying. Fixed; migrations run clean from scratch.
- **Verification** — typecheck ✓, lint ✓, 97/97 API tests (+12 from Sprint 016: merge use case, debugging prompt variants, SQL adapter).

---

## Sprint 016 — Surprise me + Fix-the-bug + SQL Advanced (2026-03-28)
**Phase 1 — Alpha**

The sprint where picking a kata got one click shorter and the exercise library grew a debugging track.

- **Surprise me →** — Second CTA on `DayStartPage`. Calls `getExercises` with current mood/duration, picks one at random, starts the session, navigates straight to `/kata/:id`. Independent `surpriseLoading` state so the primary "Show my kata" button keeps working. Uses the same sessionStorage hand-off as the manual flow.
- **Fix-the-bug kata (5 exercises)** — New `category: 'debugging'` seed file. Each exercise ships with `starterCode` containing a pre-filled buggy implementation the learner has to fix: off-by-one pagination (TS), Python mutable default argument, Go race condition without mutex, `parseInt` without radix (TS), Go nil-check on the wrong receiver. Tests assert corrected behavior via Piston.
- **SQL advanced kata (5 exercises)** — New seed file targeting window functions and recursive CTEs: department rankings (`RANK() OVER PARTITION BY`), running monthly totals (cumulative `SUM`), org-chart recursive CTE, flatten nested subquery into readable CTEs, churn analysis. Piston-verified against seeded fixtures.
- **`starterCode` on Exercise** — New nullable column (`migration 0012_starter_code.sql`) + domain field + DTO. `KataActivePage` pre-fills the editor with `exercise.starterCode` when present, so debugging katas open ready to edit instead of blank.
- **SQL Deep Cuts course (draft)** — `seed-courses-draft-sql.ts` scaffolded and kept out of the runner. 3 lessons, 9 steps, testCode pattern in place for Sprint 017 wiring.
- **Verification** — typecheck ✓, lint ✓, 79/79 API tests pass.

---

## Sprint 015 — iframe Sandbox + JavaScript DOM Course (2026-03-27)
**Phase 1 — Alpha**

The sprint where the course catalog got a second language and the browser became the execution engine.

- **iframe sandbox runner** — `IframeSandboxRunner` executes `javascript-dom` course steps in `<iframe sandbox="allow-scripts">`. No server call, no Piston — the browser is the runtime. Results communicated via `postMessage`. Same `ExecuteStepResponse` contract as the Piston path. (ADR 016)
- **StepEditor routing** — `CoursePlayerPage` now routes by `course.language`: `javascript-dom` → iframe runner, everything else → `POST /learn/execute`. Badge "Runs in browser" shown when iframe is active.
- **JavaScript DOM Fundamentals course** — 3 lessons, 9 steps: Selecting Elements (`querySelector`, `querySelectorAll`), Modifying Elements (`textContent`, `classList`, `setAttribute`), Events (`addEventListener`, event delegation). Step 3.3 is a pre-filled bug challenge — `e.target` vs `e.target.closest("li")` in event delegation.
- **Seed runner refactored** — `seedOneCourse()` helper supports N courses. `db:seed:courses` now seeds both TypeScript Fundamentals and JavaScript DOM Fundamentals.
- **Landing page CTA** — "Try a free course →" button added to hero alongside "Request access".
- **Rate limiter integration test** — Verifies 10th request succeeds and 11th returns 429 for anonymous Piston execution. Also tests per-IP isolation.
- **Coverage** — `application/learning` layer: 100% across all metrics. `GetCourseProgress` (was 0%), `ExecuteStep` fallback branches added. 79 tests / 21 files.
- **Docs + env** — README updated with Courses feature and `db:seed:courses` command. `.env.example` PISTON_RUN_TIMEOUT corrected 15000→3000.

---

## Sprint 014 — Courses MVP (2026-03-27)
**Phase 1 — Alpha**

The sprint where the dojo opened to the public. Anyone can now learn TypeScript without an account.

- **Learning bounded context** — New `PostgresCourseRepository` and `PostgresCourseProgressRepository` with full Drizzle ORM queries (joins across courses → lessons → steps).
- **5 use cases** — GetCourseList, GetCourseBySlug, ExecuteStep (reuses CodeExecutionPort/Piston), TrackProgress (idempotent), GetCourseProgress.
- **5 API endpoints** — `GET /learn/courses`, `GET /learn/courses/:slug`, `POST /learn/execute`, `POST /learn/progress`, `GET /learn/progress/:courseId`. All with Zod validation.
- **Seed course** — "TypeScript Fundamentals": 3 lessons (Variables & Types, Arrays & Objects, Control Flow), 9 steps with testCode for each exercise.
- **Course catalog** (`/learn`) — Public page, grid layout with course cards showing language badge, lesson count, accent color.
- **Course player** (`/learn/:slug`) — Collapsible sidebar with lesson/step nav, markdown instruction renderer, CodeMirror editor with "Run" button, test results panel. Auto-advances on success.
- **Progress tracking** — localStorage for anonymous users, API sync for authenticated. Merge on auth (union).
- **Navigation** — "Learn" added to sidebar and bottom nav with graduation cap icon.
- **10 new tests** — 72 total across 19 files.

---

## Sprint 013 — Hardening + Courses Pre-work (2026-03-27)
**Phase 1 — Alpha hardening**

The cleanup sprint before courses. Everything deferred from Sprint 012, resolved.

- **Domain cleanup** — `Session.isExpired()` encapsulates timer enforcement with 10% grace.
- **Route split** — feedback.ts and preferences.ts extracted. practice.ts: 1,312 → 374 lines. 7 route files.
- **API client modules** — Split into 7 files. Old api.ts is a thin re-export shim.
- **WebSocket handler tests** — 6 new tests (62 total). handleSubmit/handleReconnect extracted to ws-handlers.ts.
- **UX polish** — Share card approach_note, weekly goal target (1-7) in preferences, WCAG color audit.
- **Courses pre-work (ADR 015)** — 4 tables + indexes + domain skeleton + public routes.
- **Rate limiting** — Anonymous Piston: 10/min per IP. Authenticated: 60/min.
- **Piston Kamal accessory** — Boots automatically on deploy.

---

## Sprint 012 — Alpha-Ready (2026-03-26)
**Phase 1 — Alpha prep → Alpha launch**

The sprint where code execution became real and the post-kata experience got personal.

- **15 testCode exercises** — Function-oriented katas designed for Piston: TypeScript (4), Ruby (2), Python (2), Go (3), SQL (4). Each with 5-8 test cases covering edge cases. Total catalog: 76 exercises.
- **Post-kata insight screen** — Sensei prompt now produces `<strengths>`, `<improvements>`, `<approach_note>` XML tags. ResultsPage shows structured cards with green/amber/accent styling. Graceful fallback if tags absent.
- **Dashboard N+1 fix** — Active session and today session queries collapsed from cascaded lookups to single JOINed queries. 10 → 6 queries per dashboard load.
- **Weekly goals** — "2 of 3 this week" progress bar on dashboard. Computed from sessions (no new table). goal_weekly_target in user_preferences.

---

## Sprint 011 — Refactoring + Landing + Execution + Interests + E2E (2026-03-26)
**Phase 2 closing → Phase 1 Alpha prep**

The sprint where the codebase got cleaned up, the landing page got rewritten for real visitors, code execution became real, and kata selection got personal.

- **Code health refactoring** — practice.ts split from 1,312 to 492 lines across 4 route files (ADR 013). Verdict/streak query helpers extracted. Frontend components (TodayCard, RecentSessionRow, useRotatingMessage) extracted. Error handling and type safety fixes across the codebase.
- **Contrast fix** — `--color-muted` brightened from #475569 to #64748B to pass WCAG AA (4.5:1 minimum) on all surface backgrounds.
- **Landing page redesign** — Full Stitch rewrite: sticky navbar, dot grid background with mouse proximity effect, typewriter hero, 4-step "How It Works" flow, social proof with practitioner quotes, new "Open Source" section with live GitHub stats, scroll fade-in animations. "What It's Not" section removed per Soren.
- **Sandboxed code execution (Piston)** — ADR 014. CodeExecutionPort with PistonAdapter + MockExecutionAdapter. ExecutionQueue with concurrency limit. WS messages `executing` and `execution_result`. Sensei receives test results as factual evidence (4 prompt variants). Frontend shows results before sensei streaming.
- **Interest-based kata selection** — user_preferences table (level, interests, randomness). Weighted exercise ordering: interests affect category preference, level affects difficulty, randomness controls the mix. DayStart "Customize your practice" panel.
- **E2E smoke tests** — Playwright setup with 4 tests (landing, auth redirect, dashboard, kata flow). API mocked with page.route(). CI job runs in parallel.
- **Pre-launch hardening** — GetExerciseOptions domain violation fixed (UserPreferencesPort), 5 DB performance indexes, connection pool (max 20), 14 new tests (ExecutionQueue, PistonAdapter, GetExerciseOptions), WS error logging + partial stream persistence.

---

## Sprint 010 — Feedback Loop + Share + Admin Review (2026-03-26)
**Phase 2 — Pre-invite polish (closing)**

The sprint where the product learned to listen. Users can now tell me what's broken in an exercise, I can see the signal aggregated by variation, and the share experience finally has a proper landing page instead of a dead link.

- **Kata feedback system** — 3 micro-questions (clarity, timing, evaluation fairness) + optional note, collapsed on Results page. One per session, stored per variation so I can tell which sensei persona is underperforming.
- **Share redesign** — Public page at `/share/:id` with verdict badge, sensei pull quote, exercise info, and "Enter the dojo" CTA. OG image for social previews. ShareButton now copies the public URL.
- **Admin review** — Aggregated feedback on the edit page, breakdown by variation, notes list, admin notes field. Archive action for exercises with consistently bad feedback. Version auto-increments on every edit.
- **Secondary screens** — Login card-centered with watermark, Badges grouped by category (2-col mobile), Leaderboard and Profile cleaned up for AppShell navigation.

---

## Sprint 009 — Design Alignment + Quality of Life (2026-03-24)
**Phase 2 — Pre-invite polish**

The sprint where every screen got a second pass against the Stitch design reference. Six core screens, a sidebar, and a 4x expansion of the exercise catalog.

- **Dashboard** — 12-column grid layout (streak 4col + today 8col, activity 8col + right panel 4col), card-style rows, Material Symbols icons in sidebar/bottom nav.
- **Core screens** — Results, Sensei Eval, Day Start, Kata Selection, Kata Active all aligned with Stitch design direction.
- **Component library** — Modal, Toast, SkeletonLoader, AccentCard, StatCard, GroupButtons, Input/Textarea — all implemented.
- **60+ exercises** — Expanded from 15 to 61 across 10 categories (SQL, design patterns, architecture, common services, frontend, DevOps, algorithms, security, testing, process). Split into per-category files under `exercises/`.
- **Streaming improvements** — Code blocks parsed in eval messages, typing reveal for non-streaming mode.
- **Mobile responsive** — Full audit with critical/high/medium fixes across all pages. `prefers-reduced-motion` global CSS rule.

---

## Sprint 008 — Production Ready (2026-03-22)
**Phase 2 — The Scoreboard**

OG tags, email reminders, Mermaid whiteboard editor, OpenAI-compatible LLM adapter, `LLM_STREAM` toggle, error recovery, expired session handling.

---

## Sprint 007 — Phase 2 Scoreboard (2026-03-20)

Leaderboard (monthly/all-time), badge system (10 badges, 2 prestige), weak areas dashboard, practice patterns.

---

## Sprint 006 — Phase 1 Social (2026-03-18)

Public profiles, invitation system, share cards (satori PNG generation), badge definitions.

---

## Sprint 005 — Hardening + Phase 1 (2026-03-16)

CSP headers, 404 page, invitation flow, admin edit exercise, Resend email integration, request access form.

---

## Sprint 004 — Polish & Branding (2026-03-14)

Logo (torii gate mark), favicon, OG image, landing page visual polish, results permalink, dashboard stats.

---

## Sprint 003 — Production Deploy (2026-03-12)

First production deploy (Hetzner + Cloudflare Tunnel), landing page, UX error states, bearer token auth.

---

## Sprint 002 — Core Loop (2026-03-10)

HTTP routes, WebSocket evaluation streaming, Anthropic adapter, 16 seed kata, 8 frontend screens, admin UI.

---

## Sprint 001 — Technical Foundation (2026-03-08)

Monorepo (Turborepo), DDD scaffold (bounded contexts, ports, adapters), PostgreSQL + Drizzle, GitHub OAuth, CI pipeline, shared package.
