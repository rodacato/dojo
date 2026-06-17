# TypeScript — Lesson 0: TypeScript in context

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-12
> **Spec:** [typescript.md §4 Lesson 0](typescript.md#lesson-0--typescript-in-context) — the contract. Gates §2.1 (the Felipe test), §2.2 (no-type-system-flexing), §2.3 (predict placement) apply.
> **Primary audience:** A4 Felipe (5yr JS, forced TS-strict migration, `any` everywhere, follows Pocock — holds "no annotation = any" and "static types can't change in a branch"). Auditor: A1 Mariana (TS senior — keeps the claimed benefits honest).
> **Step count:** 2 (1 `read` + 1 `predict`). No kata — this lesson orients, it doesn't drill.
> **What changes in the learner's head:** "TypeScript is my JavaScript plus a second reader that runs in a separate pass. The types are erased before anything runs — so the tools that *run* TS aren't always the tools that *check* it. If my pipeline only strips, the benefit I came for never executes."

This file holds the **production prose** for each step's fields. All content and meta-notes in English. The sandbox runs **TypeScript 5.0.3** under `strict` (`useUnknownInCatchVariables` on); no code here needs anything past 5.0.3.

---

## Step 0.1 — `read` — "What TypeScript adds (and where the benefit lives)"

**Title:** `What TypeScript adds — and where the benefit lives`
**Type:** `read`
**Word count target:** ~300 words (code blocks excluded). Felipe test §2.1 applied — no JS reteach, every sentence names something the *type system* adds or costs. Establishes the **check-vs-strip split** and **stops**: which tools check and which only strip is predict 0.2's reveal, not this read's. Ends with a forward prompt into the predict.

### `instruction` (markdown body)

```markdown
## What this is

A **crash course, not a tutorial.** It's for JavaScript developers who already shipped "TS-strict" code without ever being sold the delta — you've met the syntax, you're here to *practice under pressure*, not to be walked through "what a type is". Six lessons, no hand-holding. The compiler is your **second reader**, and its errors *are* the curriculum: every kata is judged by the tests and the type-checker, not by a vibe. When you fail twice, the hints sharpen — but the answer stays yours to earn.

## Why this matters

You've shipped "TS-strict" code for a year without anyone selling you the delta. Here it is, in one read: what the type system actually buys you, the one cost it charges, and the toolchain fact that decides whether you're getting the benefit at all.

## The one-sentence contract

TypeScript is your JavaScript plus a static second reader. That reader catches shape mistakes before runtime, documents intent at function boundaries, and powers refactors — rename a field, add a variant, change a signature, and it tells you every site that broke. Then it **erases completely**: every type you write is stripped before the code runs. `function add(a: number, b: number)` ships as `function add(a, b)`. No runtime cost, and no runtime guarantee — the types are gone before the first line executes.

So the benefit isn't in the running program. It's in a pass that happens *before* the program runs.

## Checking is a separate pass from running

This is the fact most JavaScript developers half-know and get burned by: **checking your types and running your code are two different operations.** Much of the modern toolchain that runs or builds TypeScript skips the check entirely — that's where its speed comes from. Which means a pipeline can execute `.ts` files all day while the second reader you're paying for never opens the file once.

A pipeline with no checking pass is paying TypeScript's annotation cost for none of its benefit. *Which* of the tools you use check, and which only strip, is the next step's whole question — hold that thought.

## `tsconfig.json`, briefly

The config file exists; `strict` is the first flag that matters, and this scroll assumes it. The flag-by-flag tour is a different scroll.

## This sandbox

This scroll runs single-file TypeScript 5.0.3 in the sandbox — no DOM, no React, no `npm install`. The compile pass runs before your code: a type error here fails the step. That is exactly the behavior you want from CI.

So: which command would have caught a type error before your code ran?
```

### Authoring notes

- **Check-vs-strip split established, tool-by-tool verdict withheld (§2.3).** The read states that checking is a separate pass and that *some* of the toolchain skips it — it deliberately does **not** list which tool does which (no `tsc`/`tsx`/`esbuild`/`node` verdict). That list is predict 0.2's reveal; naming it here would pre-answer the predict.
- **Erasure stated as both cost and benefit** — no runtime cost, no runtime guarantee — per the spec's one-sentence-contract outline. The `add` → `add` example carries it without a paragraph on "what static typing is."
- **`useUnknownInCatchVariables` is on under `strict` at 5.0.3** — relevant to Lesson 4, not surfaced here; the read names `strict` and stops.

### Paragraph-test audit (Felipe test §2.1 — Valentina/Leo gate)

| Paragraph | What TypeScript-specific thing it adds (or what it costs) | Verdict |
|---|---|---|
| "Why this matters" | Orientation — names the delta-not-sold price and the payoff. No type concept; framing only. | KEEP |
| "The one-sentence contract" | The second-reader frame + **erasure** (the cost: no runtime guarantee). The whole scroll's mental model. | KEEP — ends in the `add` erasure example |
| "Checking is a separate pass from running" | The check-vs-strip split — the fact that decides whether the benefit runs. Load-bearing for predict 0.2 and the lens. | KEEP — stops short of the tool verdict (predict owns it) |
| "`tsconfig.json`, briefly" | Names the file + `strict` without the flag tour; closes a door Felipe expects opened. | KEEP (one sentence; deferred per §2.6) |
| "This sandbox" | Sandbox honesty (single-file, no DOM, no `npm install`); the compile-fails-the-step contract = CI intuition. | KEEP (spec §2.4 sandbox-honesty bet) |

**What got cut:** what static typing is (the reader can guess); any JS feature (closures, async, array methods — Felipe writes JS for a living); the Flow comparison (dead); the tsconfig flag tour; bundler/`moduleResolution` mechanics; the tool-by-tool check-vs-strip list (predict 0.2's reveal, per §2.3).

---

## Step 0.2 — `predict` — "Which command catches the bug?"

**Title:** `Predict: which command catches the bug?`
**Type:** `predict`
**Mental model under test:** "if it runs TypeScript, it checks TypeScript." The lens's foundation — the benefit only exists if the checking pass runs. **This predict owns the tool-by-tool reveal** that read 0.1 deliberately withheld. The `node file.ts` trap targets a second stale belief Felipe carries: "Node can't run TypeScript" — it can now (Node ≥23 strips and runs), it just doesn't check.

### `instruction` (short intro shown above the snippet)

```markdown
The read said checking is a separate pass from running. Here's the file that proves it — commit to an answer before you reveal.
```

### `question`

```
Four commands, one file with a type error. Which one warns you about the bug *before* the code runs?
```

### `snippet`

```typescript
// retries.ts
const retries: number = "3";
const remaining = retries - 1;
console.log(`retries left: ${remaining}`);
```

### `options`

```yaml
- id: a
  text: "`tsc --noEmit retries.ts`"
- id: b
  text: "`tsx retries.ts`"
- id: c
  text: "`node retries.ts`"
- id: d
  text: "`esbuild retries.ts`"
correct: a
```

### `feedback` (per option, sensei voice)

**a — `tsc --noEmit retries.ts`:**
> Correct. `tsc` is the checker — the second reader from the read, run on demand. `--noEmit` says "check, but don't write any JavaScript out": you want the verdict, not the build. It reports the error and produces nothing. This is the command your editor runs on every keystroke and the one your CI runs before merge. Everything else in this list runs the file; only this one reads it first.

**b — `tsx retries.ts`:**
> The fast-iteration reflex — `tsx` is what you reach for to run a `.ts` file without a build step, and it's genuinely great at that. But it strips the types and runs, by design: skipping the check is *where the speed comes from*. `retries - 1` becomes `"3" - 1`, JavaScript coerces, and you get `2` with no warning that `retries` was never a number. Running is not checking. The bug ships.

**c — `node retries.ts`:**
> Two stale beliefs collide here. The old one — "Node can't run TypeScript" — is no longer true: since Node 23, `node retries.ts` strips the types and runs the file directly, no `ts-node`, no build. The trap is concluding that because it *runs* TS, it *checks* TS. It doesn't — Node strips and executes exactly like `tsx`, with zero type-checking. The file runs, coerces `"3" - 1` to `2`, and the bug ships. Node runs your TypeScript; it never reads it.

**d — `esbuild retries.ts`:**
> The build-tool reflex. `esbuild` is a transpiler — it converts TypeScript to JavaScript at high speed by *stripping* the types, never *checking* them. It's a type-eraser with a build step bolted on, not a type-checker. It will happily emit the broken file and report success. Fast, and silent about the bug. It ships.

### `reveal` — the tool-by-tool verdict (appended to every option's feedback at seed, so each path sees it)

```markdown
The split the read promised, made concrete:

| Command | Runs the file? | Checks the types? |
|---|---|---|
| `tsc --noEmit` | no — it only checks | **yes** |
| `tsx` | yes | no — strips and runs |
| `node` (≥23) | yes | no — strips and runs |
| `esbuild` | no — it builds | no — strips and emits |

One rule underneath all four: **stripping types is not checking them.** The speed of `tsx` / `node` / `esbuild` comes precisely from skipping the check. That's fine — that's the production pattern: a fast stripper runs and builds your code, and `tsc --noEmit` (in your editor and in CI) is the gate that actually reads it.

The benefit you came for — the second reader — only exists where that checking pass runs. If your pipeline strips and never checks, you're paying the annotation cost for none of the benefit. The rest of this scroll is about what that reader can do for you once it's actually running.
```

### Authoring notes

- **Reveal owns the tool-by-tool verdict (§2.3):** the four-row table is the payoff read 0.1 set up and withheld. The player's `predict` schema has no separate reveal field, so the walk ships appended to each option's feedback at seed (Rust 1.2 precedent).
- **Option `c` addresses the stale "Node can't run TS" belief explicitly** per the spec's 0.2 outline — Node ≥23 strips-and-runs, so it runs but doesn't check. Both of Felipe's beliefs (can't-run *and* runs-therefore-checks) get named in the one feedback entry.
- **Per-option feedback names the specific reflex** behind each wrong answer (fast-iteration / runs-therefore-checks / build-tool), per the predict voice contract — not just "wrong."
- **Snippet has a real 5.0.3 type error:** `const retries: number = "3"` is `TS2322` ("Type 'string' is not assignable to type 'number'"). The two innocent lines make the file look runnable so the "it just runs" reflex has something to grab.

---

## Self-review checkpoint (before commit)

- [x] Read 0.1 under ~300 words (code blocks excluded); paragraph audit included; what got cut is named.
- [x] Read 0.1 establishes the **check-vs-strip split and stops** — no tool-by-tool verdict in the read (§2.3); the verdict is predict 0.2's reveal.
- [x] Read 0.1 ends with a **forward prompt into the predict** ("which command would have caught a type error before your code ran?").
- [x] Read 0.1 states **erasure as both cost and benefit** (no runtime cost, no runtime guarantee) and names the sandbox honestly (single-file 5.0.3, no DOM/React/`npm install`).
- [x] Predict 0.2 options are 4 commands (`tsc --noEmit` / `tsx` / `node` / `esbuild`); correct is `tsc --noEmit`.
- [x] Option `c` (`node file.ts`) feedback addresses the **stale "Node can't run TS" belief** (Node ≥23 strips-and-runs → runs but doesn't check).
- [x] Per-option feedback names the **specific reflex**; the reveal owns the tool-by-tool verdict table.
- [x] No JS reteach anywhere (Felipe test §2.1). No "we'll see later" hedges; no "simply/just/obviously."
- [x] All quoted/expected behavior is from 5.0.3 knowledge; no code needs >5.0.3. No `tsc` error *output* is quoted in this lesson (the snippet's error is named, not fenced), so no `verify-at-smoke` text fence is required here.
- [x] No figures embedded — Lesson 0 commits none in the spec.
- [x] Every word in English — titles, instructions, options, feedback, code comments, captions, meta-notes.

---

## Figure data spec

*None embedded in this lesson.* The spec commits no figure to Lesson 0; the snippet and the reveal's verdict table carry the visual load.
