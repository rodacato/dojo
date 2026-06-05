# Documentation Map

> **Status:** Canonical · **Last reviewed:** 2026-06-05

This is the entry point for everything in `docs/`. Each document has a lifecycle — knowing which is which is the difference between reading the source of truth and reading a fossil.

---

## Where to start

| If you are... | Read in this order |
|---|---|
| **New to the project** | [`VISION.md`](VISION.md) → [`ROADMAP.md`](ROADMAP.md) → [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| **A contributor** | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) → [`WORKFLOW.md`](WORKFLOW.md) → [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| **An AI agent** | [`../AGENTS.md`](../AGENTS.md) → [`IDENTITY.md`](IDENTITY.md) → [`EXPERTS.md`](EXPERTS.md) |
| **Picking up active work** | [`sprints/current.md`](sprints/current.md) → [`sprints/backlog.md`](sprints/backlog.md) |
| **Authoring a scroll** | [`scrolls/README.md`](scrolls/README.md) → [`scrolls/testcode-pattern.md`](scrolls/testcode-pattern.md) |
| **Looking for *why* a past decision was made** | [`adr/`](adr/) → [`sprints/archive/`](sprints/archive/) → [`research/`](research/) |

---

## Document lifecycle

Every doc lives in one of four states. The folder communicates the state — if you find yourself unsure where to put something, you are probably in the wrong folder.

### Canonical — source of truth (evergreen)

Edit when reality changes. Always reflects current behavior.

| Document | Purpose |
|---|---|
| [`VISION.md`](VISION.md) | Why Dojo exists, philosophy, who it is for |
| [`IDENTITY.md`](IDENTITY.md) | Primary build persona — decision style and defaults |
| [`EXPERTS.md`](EXPERTS.md) | Virtual advisory panel — 11 specialist personas |
| [`ROADMAP.md`](ROADMAP.md) | Active phase status, sprint and spec history |
| [`WORKFLOW.md`](WORKFLOW.md) | Workflow conventions, playbooks, doc sync rules |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | DDD model, bounded contexts, ports, events |
| [`BRANDING.md`](BRANDING.md) | Colors, typography, tokens, voice |
| [`scrolls/README.md`](scrolls/README.md) | Scroll content model and authoring conventions |
| [`scrolls/testcode-pattern.md`](scrolls/testcode-pattern.md) | Active reference for authoring iframe testCode |
| [`scrolls/{language}.md`](scrolls/) | Per-language scroll design (go, python, ruby, rust, typescript) |

### Live — active work

Mutates frequently. Reflects what is being worked on **right now**.

| Document | Purpose |
|---|---|
| [`sprints/current.md`](sprints/current.md) | Active block — committed items and expected outcome |
| [`sprints/backlog.md`](sprints/backlog.md) | Ideas by triage state — untriaged, next, later, explore, discarded |

### History — immutable (never delete)

Append-only record of what happened and why. Links may point to docs that have since moved — that is acceptable; history is preserved for context, not for navigation.

| Folder | What lives here |
|---|---|
| [`adr/`](adr/) | Architecture Decision Records — every architectural choice with its alternatives and consequences |
| [`specs/`](specs/) | Sprint-tied implementation specs |
| [`sprints/archive/`](sprints/archive/) | Closed sprint blocks with retros |
| [`audits/`](audits/) | Time-stamped audits (friend feedback, security reviews, etc.) |

### Exploratory & archived research — disposable

Useful while a decision is forming, then either materializes into a spec or gets archived. Treat as **possibly stale** unless dated within the last sprint.

| Folder | Lifecycle |
|---|---|
| [`prd/`](prd/) | Active exploratory PRDs. Each should end with status: `Materialized in spec-NNN` / `Discarded` / `Archived to research/`. |
| [`research/`](research/) | Background research and plans that informed a past decision and are kept for traceability |
| [`research/prd-archive/`](research/prd-archive/) | PRDs that served their purpose during Phase 0 planning |

---

## Conventions

- **Adding canonical doc?** Update this map.
- **Closing a PRD?** Mark its status at the top and decide: materialize into a spec, discard, or move to `research/prd-archive/`.
- **Making an architectural decision?** Write an ADR in [`adr/`](adr/). Never delete an ADR — supersede it.
- **Finishing a sprint?** Copy [`sprints/current.md`](sprints/current.md) to [`sprints/archive/`](sprints/archive/) and clear `current.md`.
- **Found a doc that does not fit any folder above?** It probably should not exist, or this map needs a new category. Ask first.
