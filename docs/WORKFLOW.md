# Dojo — Workflow & Documentation Guide

## Philosophy

Documentation is the foundation, not an afterthought. Before writing a line of code, the intention lives in a document. Before merging, the docs reflect the reality. This is not bureaucracy — it is the difference between a project that grows coherently and one that accumulates confusion.

The build cycle is:

```
Idea → Backlog → [Triage] → PRD (optional) → Spec (optional) → Implement → Test → Release
                                                                     ↓
                                                           ADR (when an architectural decision is involved)
```

---

## Documentation Map

| Document | Location | Purpose |
|---|---|---|
| `CLAUDE.md` | `/CLAUDE.md` | Agent instructions, commands, project conventions |
| `AGENTS.md` | `/AGENTS.md` | AI agent behavior, identity, expert panel routing, trigger phrases |
| `docs/VISION.md` | `docs/VISION.md` | Why Dojo exists, philosophy, who it's for |
| `docs/IDENTITY.md` | `docs/IDENTITY.md` | Primary build persona — decision style and defaults |
| `docs/EXPERTS.md` | `docs/EXPERTS.md` | Virtual advisory panel — 11 specialist personas (quick reference at top) |
| `docs/ROADMAP.md` | `docs/ROADMAP.md` | Active phase status — current phase only |
| `docs/BRANDING.md` | `docs/BRANDING.md` | Colors, typography, tokens, voice, UI components |
| `docs/ARCHITECTURE.md` | `docs/ARCHITECTURE.md` | DDD model, bounded contexts, ports, events, decisions |
| `docs/prd/` | `docs/prd/` | Exploratory PRDs — pre-spec, multi-perspective, disposable |
| `docs/sprints/current.md` | `docs/sprints/current.md` | Active work block — committed items and expected outcome |
| `docs/sprints/backlog.md` | `docs/sprints/backlog.md` | Ideas by triage state — untriaged, next block, later, explore, discarded |
| `docs/sprints/archive/` | `docs/sprints/archive/` | Closed blocks with retros |
| `CONTRIBUTING.md` | `/CONTRIBUTING.md` | How to set up, branch, commit, and open a PR |
| `SECURITY.md` | `/SECURITY.md` | Vulnerability reporting, scope, response timeline |
| `LICENSE.md` | `/LICENSE.md` | MIT License |

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
Something new or something broken. Capture it. If it can be described in one sentence and takes less than 2 hours, create a GitHub Issue directly. If it is bigger, start with the Roadmap.

### 2. Roadmap
Every new feature or phase change is reflected in `docs/ROADMAP.md` before it is built. The Roadmap has the final word on scope. If a feature is not there, it is not being built yet.

### 3. Spec (for non-trivial features)
A short spec lives in `docs/specs/` as a Markdown file. It answers:
- What is being built and why?
- What does "done" look like?
- What is explicitly out of scope for this version?

No spec template required — keep it as short as it needs to be and no shorter.

### 4. ADR (for architectural decisions)
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

### 5. Implement
Small, reviewable, reversible changes. One feature or fix per PR. If a change requires touching more than 3 unrelated areas of the codebase, consider splitting it.

**Before touching code, identify which layer it belongs to:**
- New business rule → domain aggregate
- New workflow → application use case
- New HTTP route, DB query, or external call → infrastructure adapter

### 6. Test

#### Test strategy by layer

| Layer | Test type | What to test | LLM dependency |
|---|---|---|---|
| Domain | Unit | Aggregate invariants, value objects, domain logic | None — pure functions |
| Application | Unit | Use case orchestration, event publishing | Mock all ports via `MockLLMAdapter`, `InMemoryEventBus` |
| Infrastructure | Integration | Postgres repos, Hono routes | Real DB (test container), mock LLM port |
| Full loop | E2E | Session creation → evaluation → verdict | Mock LLM adapter (deterministic responses) |

**The key rule for LLM-dependent code:** never call a real LLM in tests. Mock at the port boundary — `MockLLMAdapter` returns deterministic `EvaluationResult` objects. This keeps tests fast, free, and reproducible.

**Testing non-deterministic outputs:** you cannot assert that the sensei says exactly X. You can assert:
- `verdict` is one of the three valid values
- `topicsToReview` is a non-empty array when verdict is not "passed"
- `analysis` is a non-empty string
- `followUpQuestion` is null on `isFinalEvaluation: true`

These structural contracts belong in unit tests on the `EvaluationResult` value object, not in E2E tests against a live LLM.

**Commands:**
```bash
pnpm test --filter=api        # unit + integration tests
pnpm test --filter=e2e        # E2E tests (when they exist)
pnpm typecheck                # type-check all workspaces
pnpm lint                     # lint all workspaces
```

### 7. Release
On merge to `main`, update `CHANGELOG.md`. Mark completed Roadmap items as done.

---

## Playbooks

Concrete step-by-step checklists for recurring operations. When the user asks to perform one of these, follow the checklist exactly to keep all documents consistent. New playbooks are added here as new recurring operations are identified.

---

### Playbook: Close a block

Triggered by: "cerremos el bloque" / "cierra el bloque"

1. **Complete the retro** in `docs/sprints/current.md` — fill in all three retro questions
2. **Archive the block** — copy `current.md` to `docs/sprints/archive/sprint-NNN-name.md` (use the next sequential number)
3. **Update ROADMAP.md sprint history** — add a row to the "History — Sprints" table with: link to archived file, one-line outcome, ✅ Closed status
4. **Update ROADMAP.md spec history** — if any specs shipped during this block, add them to the "History — Specs" table
5. **Update ROADMAP.md PRD history** — if any PRDs changed state during this block, update their row
6. **Clear `docs/sprints/current.md`** — replace content with an empty block template (name TBD, outcome TBD)
7. **Confirm** — summarize what was archived and what the ROADMAP now shows

---

### Playbook: Open a new block

Triggered by: "empecemos un bloque" / "abramos el siguiente bloque"

1. **Read `docs/sprints/backlog.md`** section "Triaged — next block" — list the available items
2. **Propose items** for the new block — ask the user to confirm or adjust
3. **Define the expected outcome** — one sentence of what "done" looks like for this block
4. **Write `docs/sprints/current.md`** with: block name, started date, phase, expected outcome, committed items, out-of-scope items
5. **Update ROADMAP.md sprint history** — add a row for the new block with 🔄 In progress status
6. **Move confirmed items out of backlog** — remove from "Triaged — next block" section in `docs/sprints/backlog.md`
7. **Confirm** — show the user the new `current.md`

---

### Playbook: Convert a PRD to spec(s)

Triggered by: "convierte este PRD en spec" / "avancemos a spec"

1. **Read the PRD** — identify the chosen option from the "Provisional conclusion" section
2. **Determine scope** — decide if this is one spec or multiple (one spec per coherent deliverable)
3. **Create spec file(s)** at `docs/specs/NNN-title.md` — use the next sequential number(s)
4. **Write each spec** answering: what is being built and why? what does "done" look like? what is explicitly out of scope?
5. **Update the PRD** — change status to "advancing to spec" and add a link to the spec(s) in the "Next step" section
6. **Update ROADMAP.md PRD history** — change the PRD's status in the table
7. **Update ROADMAP.md spec history** — add a row for the new spec(s)
8. **Add to `docs/sprints/current.md`** — if the spec work is part of the current block, add it as a committed item
9. **Confirm** — show links to the new spec(s)

---

### Playbook: Prepare a release

Triggered by: "preparemos un release" / "vamos a hacer un release"

1. **Read `docs/sprints/current.md`** — identify all completed items
2. **Read `CHANGELOG.md`** — find the current unreleased section
3. **Write CHANGELOG entry** — group completed items under feat / fix / chore / docs as appropriate
4. **Update `docs/ROADMAP.md`** — mark the block as closed, update sprint and spec history tables
5. **Update `docs/sprints/current.md`** if the block is closing — run the "Close a block" playbook first
6. **Verify the definition of done** — confirm: typecheck passes, lint passes, tests pass, docs updated
7. **Propose the commit message** — format: `release: [version or milestone name]`
8. **Confirm** before committing — show the user what will be committed

---

## Keeping ROADMAP.md Updated

`docs/ROADMAP.md` is the project's big-picture document. Update it in the same commit the work lands:

| When | What to do |
|---|---|
| A sprint closes | Add a row to the sprint history table |
| A spec ships | Add a row to the spec history table |
| A PRD is created or changes state | Update the PRD table |
| A phase completes | Mark it done in the Phases section |
| Something is discarded | Move it to `docs/sprints/backlog.md` Discarded section with a reason |

**What does NOT go in ROADMAP:**
- Implementation details (those go in specs or ADRs)
- Small bugs or issues (those go in GitHub Issues)
- Technical decisions (those go in `docs/adr/`)
- In-progress or WIP work (ROADMAP reflects only done or planned, not in-between)

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

## Block Cycle

Work is organized into outcome-defined blocks, not fixed-time sprints. The active block always lives in `docs/sprints/current.md`.

### Starting a block

1. Review `docs/sprints/backlog.md` section "Triaged — next block"
2. Define the **expected outcome** (a clear sentence of what "done" means)
3. Commit to the items in the block
4. Explicitly declare what is **out of scope** for this block
5. If a previous block exists, archive it first: copy to `docs/sprints/archive/sprint-NNN-name.md`

### During the block

- Update item status in `current.md` as work progresses
- Urgent bugs or emerging work: add directly to `current.md` as a committed item
- New non-urgent ideas: add to `docs/sprints/backlog.md` section "Untriaged"

### Closing a block

1. Complete the **Retro** section in `current.md` (3 questions: what went well? what slowed us down? what goes to the next block?)
2. Copy `current.md` to `docs/sprints/archive/sprint-NNN-name.md`
3. Clear `current.md` for the next block
4. Move incomplete items to backlog if they are not going into the next block

### Golden rule

**If it is committed in the block and not marked done, it is not done.** `current.md` is the source of truth for the current state of work, not the git log.

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

Examples:
```
feat: stream sensei evaluation via websocket
fix: session body not persisted on exercise start
docs: add ADR for websocket authentication strategy
chore: upgrade hono to 4.x
refactor: extract verdict parsing to EvaluationResult value object
test: add MockLLMAdapter for use case unit tests
```

---

## Documentation Sync Rules

When making changes that affect behavior, update the corresponding docs in the same commit or PR:

| If you change... | Update... |
|---|---|
| New or changed API endpoint | `README.md` |
| New or changed env var | `README.md` + `.env.example` |
| New feature shipped | `CHANGELOG.md` under current version |
| Completed roadmap item | Mark done in `docs/ROADMAP.md` |
| Architectural decision | Add ADR in `docs/adr/` + update `docs/ARCHITECTURE.md` if needed |
| New port or adapter | `docs/ARCHITECTURE.md` ports & adapters table |
| New exercise type | `README.md` exercise types table |
| Auth or security change | `SECURITY.md` if scope changes |

---

## Branching

- `main` — production. Protected. Nothing goes here without a PR.
- `dev` — integration branch for Phase 0 while the creator is the only user. Merge to `main` on each stable increment with a PR for review.
- Feature branches: `feat/short-description`, `fix/short-description`, `docs/short-description`

Branch from `dev` during Phase 0. Branch from `main` once Phase 1 ships.

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
- [ ] Roadmap item marked as complete if applicable
- [ ] Next task captured in a GitHub Issue if applicable
