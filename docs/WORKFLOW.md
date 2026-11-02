# Dojo — Workflow & Documentation Guide

> **Status:** Canonical · **Last reviewed:** 2026-11-02

## Philosophy

Documentation is the foundation, not an afterthought. Before writing a line of code, the intention lives in a document. Before merging, the docs reflect the reality. This is not bureaucracy — it is the difference between a project that grows coherently and one that accumulates confusion.

The build cycle is:

```
Idea → Issue → [Triage] → PRD (optional) → Spec (optional) → Implement → Test → Release
                                                                     ↓
                                                           ADR (when an architectural decision is involved)
```

---

## Documentation Map

What each document is for, and which are canonical or history: [`docs/README.md`](README.md).

---

## Code Layer Structure

Every feature touches three layers. Keep them clean.

```
apps/api/src/
  domain/           ← aggregates, entities, value objects, port interfaces
  application/      ← use cases (orchestrate domain + call ports)
  infrastructure/   ← adapters (Hono routes, Postgres repos, LLM client, event bus)
```

**Rules:**
- Domain never imports from application or infrastructure
- Application imports from domain only (via port interfaces)
- Infrastructure imports from application and domain, and implements port interfaces
- Hono routes are thin: parse request → call use case → return response. No business logic in routes.

---

## Build Cycle in Detail

### 1. Idea
Something new or something broken. Capture it as a GitHub issue — see [Tracking Work](#tracking-work). A change of direction goes to `docs/ROADMAP.md`, which holds direction, not tasks.

### 2. Spec (for non-trivial features)
A short spec lives in `docs/specs/` as a Markdown file. It answers:
- What is being built and why?
- What does "done" look like?
- What is explicitly out of scope for this version?

No spec template required — keep it as short as it needs to be and no shorter.

### 3. ADR (for architectural decisions)
Any decision that changes how the system is structured — database schema, a new package, switching a library, a new port or adapter, choosing a deployment strategy — gets an ADR. ADRs are never deleted. Superseded ones are marked as such.

**ADR format:**

```markdown
# ADR-NNN: Title
**Status:** accepted | superseded | deprecated
**Date:** YYYY-MM-DD

## Context
What situation forced this decision?

## Decision
What was decided and why?

## Alternatives Considered
What else was evaluated and why it was not chosen?

## Consequences
What does this decision make easier? Harder? What is the repayment path if this turns out to be wrong?
```

ADRs live in `docs/adr/`. Filename: `NNN-short-title.md` (e.g., `001-websocket-for-sensei-streaming.md`).

### 4. Implement
Small, reviewable, reversible changes. One feature or fix per PR. If a change requires touching more than 3 unrelated areas of the codebase, consider splitting it.

**Before touching code, identify which layer it belongs to:**
- New business rule → domain aggregate
- New workflow → application use case
- New HTTP route, DB query, or external call → infrastructure adapter

### 5. Test

#### Test strategy by layer

| Layer | Test type | What to test | LLM dependency |
|---|---|---|---|
| Domain | Unit | Aggregate invariants, value objects, domain logic | None — pure functions |
| Application | Unit | Use case orchestration, event publishing | Mock all ports via `MockLLMAdapter`, `InMemoryEventBus` |
| Infrastructure | Integration | Postgres repos, Hono routes | A real Postgres, mock LLM port |
| Full loop | E2E | Session creation → evaluation → verdict | Mock LLM adapter (deterministic responses) |

**The key rule for LLM-dependent code:** never call a real LLM in tests. Mock at the port boundary — `MockLLMAdapter` returns deterministic `EvaluationResult` objects. This keeps tests fast, free, and reproducible.

**Testing non-deterministic outputs:** you cannot assert that the sensei says exactly X. You can assert:
- `verdict` is one of the three valid values
- `topicsToReview` is a non-empty array when verdict is not "passed"
- `analysis` is a non-empty string
- `followUpQuestion` is null on `isFinalEvaluation: true`

These structural contracts belong in unit tests on the `EvaluationResult` value object, not in E2E tests against a live LLM.

**Commands:** see [`CLAUDE.md`](../CLAUDE.md#commands). The E2E smoke suite is `pnpm --filter=@dojo/e2e test:smoke`.

### 6. Release
A release is cut with the Release workflow, which generates the `CHANGELOG.md` entry from conventional commits — see [`RELEASING.md`](../RELEASING.md).

---

## Playbooks

Concrete step-by-step checklists for recurring operations. When the user asks to perform one of these, follow the checklist exactly to keep all documents consistent. New playbooks are added here as new recurring operations are identified.

---

### Playbook: Convert a PRD to spec(s)

Triggered by: "convierte este PRD en spec" / "avancemos a spec"

1. **Read the PRD** — identify the chosen option from the "Provisional conclusion" section
2. **Determine scope** — decide if this is one spec or multiple (one spec per coherent deliverable)
3. **Create spec file(s)** at `docs/specs/NNN-title.md` — use the next sequential number(s)
4. **Write each spec** answering: what is being built and why? what does "done" look like? what is explicitly out of scope?
5. **Update the PRD** — change status to "advancing to spec" and add a link to the spec(s) in the "Next step" section
6. **Link the spec from its issue** — the issue that tracks the work gets the spec link in its body
7. **Confirm** — show links to the new spec(s)

---

### Playbook: Prepare a release

Triggered by: "preparemos un release" / "vamos a hacer un release"

1. **Check the milestone** — every issue planned for it is closed or consciously moved out
2. **Verify the definition of done** — confirm: typecheck passes, lint passes, tests pass, docs updated
3. **Run the Release workflow** and follow [`RELEASING.md`](../RELEASING.md): the workflow generates the `CHANGELOG.md` entry from conventional commits; read it before merging
4. **Close the milestone** if the release completes it

---

## PRDs — Exploratory Documents

A PRD in this project is a thinking tool, not a formal planning artifact. It lives in `docs/prd/` and uses the template at `docs/prd/000-template.md`.

**What they are for:**
- Exploring an idea from multiple perspectives before committing to build it
- Identifying tensions and trade-offs that are not obvious upfront
- Deciding whether something advances to a spec, needs more exploration, or gets discarded

**When to write a PRD vs. going straight to a spec:**
- New idea with UX, architecture, or product direction implications → PRD first
- Small, well-defined feature with no obvious tensions → spec directly
- Something that seems simple but involves multiple user perspectives → PRD

**Format:** see `docs/prd/000-template.md`. Required sections: idea in one sentence, at least two perspectives, and next step.

**They are disposable.** If something does not advance, archive it without shame. An archived PRD is not a failure — it is evidence that thinking happened before writing code.

---

## Tracking Work

Work state lives in GitHub, not in `docs/`. Docs keep direction and decisions (VISION, ARCHITECTURE, ROADMAP, ADRs, specs); GitHub keeps what is planned, in progress and done.

- **Issues** are the unit of work, including epics. A pull request that resolves one carries `Closes #N` in its body.
- **Milestones** group issues by theme or time-box (`M1` to `M4`). Closing a milestone replaces closing a sprint. History lives in closed milestones, `CHANGELOG.md` and release tags.
- **Ideas that are not ready to be public** stay as draft cards on the maintainer's private project board, with enough context to be understood cold. They become an issue when work on them starts. Anything with security impact never becomes an issue; see [`SECURITY.md`](../SECURITY.md).
- **Labels** carry kind and area only. Priority and status live on the project board.
- **Sprint docs are retired** and were deleted; git history keeps them.

### Golden rule

**If it is not an issue, it is not tracked.** The git log says what happened; the issue and its milestone say what is planned and what is done.

---

## Commit Convention

Follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use |
|---|---|
| `feat:` | New user-facing feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `chore:` | Tooling, dependencies, config |
| `refactor:` | Code change with no behavior change |
| `test:` | Adding or fixing tests |
| `release:` | Version bump and changelog entry |

Release mechanics: [`RELEASING.md`](../RELEASING.md).

---

## Documentation Sync Rules

When making changes that affect behavior, update the corresponding docs in the same commit or PR:

| If you change... | Update... |
|---|---|
| New or changed API endpoint | `README.md` |
| New or changed env var | `README.md` + `.env.example` |
| New or changed deploy secret or variable (GitHub Environment) | `docs/ops/deploy.md` |
| New feature shipped | `apps/web/src/pages/ChangelogPage.tsx` (public, curated user-facing entry). `CHANGELOG.md` is generated at release from conventional commits ([`RELEASING.md`](../RELEASING.md)) |
| Change of direction, or something discarded for good | `docs/ROADMAP.md` |
| Architectural decision | Add ADR in `docs/adr/` + update `docs/ARCHITECTURE.md` if needed |
| New port or adapter | `docs/ARCHITECTURE.md` ports & adapters table |
| New exercise type | `README.md` exercise types table |
| Auth or security change | `SECURITY.md` if scope changes |

---

## Branching

- `master` — the default branch. Every change lands through a PR.
- `production` — the deploy pointer. It only fast-forwards to a commit already on `master`; see [ops/deploy.md](ops/deploy.md).
- Feature branches: `feat/short-description`, `fix/short-description`, `docs/short-description`

Branch from `master`.

---

## Definition of Done

A task is done when:
- [ ] The feature works end-to-end in dev
- [ ] Domain logic covered by unit tests
- [ ] LLM-dependent paths tested with `MockLLMAdapter`
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Docs updated if behavior changed
- [ ] No known auth or security regression
- [ ] Port interfaces unchanged (or a new ADR documents the change)
- [ ] Next task captured in a GitHub Issue if applicable
