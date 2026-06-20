# Sprint 032 — Ship the set, then close the reshape loop

> **Status:** Open 2026-06-20. The five-language scroll set is content-complete (Ruby, Python, Rust, TypeScript, Go) and the catalog/landing reshape shipped in S030. This sprint takes it live and finishes the reshape's deferred layer.
> **Predecessor:** [Sprint 031 — Go crash scroll](archive/sprint-031-go-scroll.md)

## Sprint thesis

Two things have been staged but not landed: the Go scroll (published in source, not deployed) and the reshape's player/recognition layer (the catalog + landing shipped; the step-player polish, completion/error states, and share surface were carried). The set is built — this sprint ships it and closes the loop, rather than starting new content.

## Mandatory (sprint blockers if not done)

- **Deploy the five-language set incl. Go.** The reseed runs the S031 Ruby `parameters_of` fix (a dead kata, live in prod until reseed) and the Go scroll live. **Read the Go prose first** — it was authored solo in S031; the spec called for a panel + audience review that didn't happen. Confirm the `piston-execute-smoke` cron covers `go` and is green post-deploy.
- **Sprint admin discipline.** Close with retro, archive, CHANGELOG, S033 open.

## The reshape's deferred layer (the real work of this sprint)

Carried from S030 (catalog + landing shipped; this is the rest):

- **Step-player consistency pass + states.** The terminal `scroll/<lang>` header and a `THE CONTRACT`-style box to match the reshaped catalog/landing; plus the surfaces that decide whether it *works* — the completion moment for the catalog-era look and the error/empty/runner-offline states (the OutputPanel already handles runner errors; audit the rest).
- **Completed-scroll share reshape** (`ScrollSharePage`) — align with the reshaped surfaces (Amara C7).
- **`lessons.outcome` field** — the §4.4 "what changed in the learner's head" line the new scroll landing can't yet show (lessons store only `title`). Small schema add, like `estimatedMinutes`; then surface it on the landing rows.

## Stretch / candidates (triage before picking up)

- **First topic deep-dive** — `sql-deep-cuts` is already live; the named-but-unbuilt deep-dives (`rust-lifetimes`, `ruby-blocks`, `go-concurrency-deep`) are Phase-3 candidates, triggered by real audience need, not authored on spec.
- **Turnstile on `/scrolls/execute`** for anonymous callers — precautionary hardening (backlog); only if real execution abuse shows.
- **Local Piston Go reliability** — the devcontainer flake is host-memory-driven; if it keeps blocking local smokes, consider a memory bump or a CI-only Go smoke path.
- **Render-test infra** (jsdom) — the perennial defer; land it or defer with a reason.

## Reading order if you're picking this up cold

1. [archive/sprint-031-go-scroll.md](archive/sprint-031-go-scroll.md) — what just shipped + the staged deploy + the solo-authored-prose flag.
2. [archive/sprint-030-scrolls-reshape.md](archive/sprint-030-scrolls-reshape.md) — the reshape, and what its deferred layer is.
3. [`docs/courses/README.md`](../courses/README.md) §4.5/§4.6 — catalog + landing canon.
4. [`docs/sprints/backlog.md`](backlog.md) — the reshape follow-ups + carries.

## Out of scope, parked

- Sixth scroll — the five-language set is the closed commitment (ADR 022).
- Kumite feature (still the `/kumite` placeholder).
- Per-track belt marks, rust indicator (PRD-031 v1.1).
- Sumi-e migration — its own sprint when the token values get a designer pass.
- Aggressive sensei voice rewrite (calibration-gated).
