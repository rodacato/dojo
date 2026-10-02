# Documentation Map

> **Status:** Canonical · **Last reviewed:** 2026-10-02

This is the entry point for everything in `docs/`. Each document has a lifecycle — knowing which is which is the difference between reading the source of truth and reading a fossil.

---

## Where to start

| If you are... | Read in this order |
|---|---|
| **New to the project** | [`VISION.md`](VISION.md) → [`ROADMAP.md`](ROADMAP.md) → [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| **A contributor** | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) → [`WORKFLOW.md`](WORKFLOW.md) → [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| **An AI agent** | [`../AGENTS.md`](../AGENTS.md) → [`IDENTITY.md`](IDENTITY.md) → [`EXPERTS.md`](EXPERTS.md) |
| **Picking up active work** | The repository's GitHub issues and open milestones — see [`WORKFLOW.md`](WORKFLOW.md#tracking-work) |
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
| [`ROADMAP.md`](ROADMAP.md) | Direction, phases, and the spec / PRD / ADR history |
| [`WORKFLOW.md`](WORKFLOW.md) | Workflow conventions, playbooks, doc sync rules |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | DDD model, bounded contexts, ports, events |
| [`BRANDING.md`](BRANDING.md) | Voice, vocabulary, IA, UX principles, microcopy |
| [`DESIGN.md`](DESIGN.md) | Design system — tokens, themes (Slate Indigo + Sumi-e), motifs, components, motion |

### Live — active work

There is no live work document in `docs/`. What is planned, in progress and done lives in GitHub issues and milestones; ideas that are not ready to be public stay as cards on the maintainer's private project board. See [`WORKFLOW.md`](WORKFLOW.md#tracking-work).

### History — immutable (never delete)

Append-only record of what happened and why. Links may point to docs that have since moved — that is acceptable; history is preserved for context, not for navigation.

| Folder | What lives here |
|---|---|
| [`adr/`](adr/) | Architecture Decision Records — every architectural choice with its alternatives and consequences |
| [`specs/`](specs/) | Sprint-tied implementation specs |
| [`sprints/archive/`](sprints/archive/) | Closed sprint blocks with retros. Sprint docs were retired in September 2026; sprint 034 is the last |
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
- **Tracking work?** Open a GitHub issue. Never a document in `docs/`.
- **Found a doc that does not fit any folder above?** It probably should not exist, or this map needs a new category. Ask first.
