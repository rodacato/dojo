# Documentation Map

> **Status:** Canonical · **Last reviewed:** 2026-11-06

This is the entry point for everything in `docs/`. Each document has a lifecycle — knowing which is which is the difference between reading the source of truth and reading a fossil.

---

## Where to start

| If you are... | Read in this order |
|---|---|
| **New to the project** | [`VISION.md`](VISION.md) → [`ROADMAP.md`](ROADMAP.md) → [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| **A contributor** | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) → [`WORKFLOW.md`](WORKFLOW.md) → [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| **An AI agent** | [`../AGENTS.md`](../AGENTS.md) → [`IDENTITY.md`](IDENTITY.md) → [`EXPERTS.md`](EXPERTS.md) |
| **Picking up active work** | The repository's GitHub issues and open milestones — see [`WORKFLOW.md`](WORKFLOW.md#tracking-work) |
| **Looking for *why* a past decision was made** | [`adr/`](adr/) → [`research/`](research/) |

---

## Document lifecycle

Every doc lives in one of four states. The folder communicates the state — if you find yourself unsure where to put something, you are probably in the wrong folder.

### Canonical — source of truth (evergreen)

Edit when reality changes. Always reflects current behavior.

| Document | Purpose |
|---|---|
| [`VISION.md`](VISION.md) | Why Dojo exists, philosophy, who it is for |
| [`IDENTITY.md`](IDENTITY.md) | Primary build persona — decision style and defaults |
| [`EXPERTS.md`](EXPERTS.md) | Virtual advisory panel — 19 personas (7 core, 12 situational) |
| [`ROADMAP.md`](ROADMAP.md) | Direction, what is built, and what dojo will not do |
| [`WORKFLOW.md`](WORKFLOW.md) | Workflow conventions, playbooks, doc sync rules |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | DDD model, bounded contexts, ports, events |
| [`design/brand/README.md`](../design/brand/README.md) | Brand guide — voice, vocabulary, IA, UX principles, microcopy, logo and brand assets |
| [`DESIGN.md`](DESIGN.md) | Design system — tokens, themes (Sumi and Washi, one vermillion accent), layout, motifs, components, motion |
| [`scrolls/`](scrolls/) | Scroll protocol, authoring guide and conformance suite for external scroll apps |

### Live — active work

There is no live work document in `docs/`. What is planned, in progress and done lives in GitHub issues and milestones; ideas that are not ready to be public stay as cards on the maintainer's private project board. See [`WORKFLOW.md`](WORKFLOW.md#tracking-work).

### History — append-only

Append-only record of what happened and why. Links may point to docs that have since moved — that is acceptable; history is preserved for context, not for navigation.

| Folder | What lives here |
|---|---|
| [`adr/`](adr/) | Architecture Decision Records — every architectural choice with its alternatives and consequences |
| [`specs/`](specs/) | Implementation specs up to sprint 023. Retired: an issue and its pull request now carry what a change builds. Specs of features that were removed may be deleted; git keeps them |

### Exploratory & archived research — disposable

Useful while a decision is forming, then either becomes an issue (and an ADR, when architectural) or gets archived. Treat as **possibly stale** unless its status line says otherwise.

| Folder | Lifecycle |
|---|---|
| [`prd/`](prd/) | Active exploratory PRDs. Each ends with a status — `Decided in ADR NNN`, `Decided in part in ADR NNN`, `Shipped` or `Discarded` — and moves to `research/prd-archive/` once no open issue depends on it. |
| [`research/`](research/) | Research that compares mechanisms, the market or prior art, with no product perspectives. Live while it feeds a decision; closes in a PRD, an ADR or a "Reference only" note |
| [`research/prd-archive/`](research/prd-archive/) | Closed PRDs — shipped, superseded or discarded — including the sprint plans from before work moved to GitHub issues |

---

## Conventions

- **Adding canonical doc?** Update this map.
- **Closing a PRD?** Follow the [Close a PRD](WORKFLOW.md#playbook-close-a-prd) playbook.
- **Making an architectural decision?** Write an ADR in [`adr/`](adr/). Never delete an ADR — amend it for a refinement, or supersede it (in part) with a new one; see [WORKFLOW](WORKFLOW.md#3-adr-for-architectural-decisions).
- **Tracking work?** A draft card or a GitHub issue — see [Two lanes](WORKFLOW.md#two-lanes). Never a document in `docs/`.
- **Found a doc that does not fit any folder above?** It probably should not exist, or this map needs a new category. Ask first.
