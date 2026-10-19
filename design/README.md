# Design — Pencil workflow

Everything about the app's design lives here. Read this before touching a `.pen`. It doubles
as context for AI agents.

**Two rules that matter most:**

1. The **code is the source of truth** for design and layout — not old designs, not stale
   screenshots.
2. **Don't dedupe or promote things into the kit unless you were asked.** Spotting a
   resemblance is a note, not a task — there's no live propagation, so every kit change is
   manual work across every consumer.

## What's here

| Path | What it is |
|---|---|
| `ui-kit.lib.pen` | **The design library** — tokens + components, mirrored 1:1 from the code |
| `ui-kit.CHANGELOG.md` | Kit versions and what each bump changed |
| `flows/*.pen` | **One file per domain** (a user journey with enough weight to justify one) |
| `_playground.pen` | Experiments and design ahead of code — vendors the kit like a flow; today: the daily kata dashboard entry (D53, D54), Advanced, admin and Engawa on mobile |
| `DECISIONS.md` | The numbered findings registry the `.pen` briefs cite |
| `CODE_CHANGES.md` | Work order for design-decided consolidations pending in code |
| `exports/` | Canvas PNGs for PM/PO/PR review — **committed** (they must travel) |
| `references/` | Local-only device captures — **never commit: real user data** (gitignored) |
| `brand/` | **Brand sources and guide** — start at [`brand/README.md`](brand/README.md) (voice, logo, sources, generated-asset map) |

### The flows

| File | Screens | Kit | Domain entry point |
|---|---|---|---|
| `public.pen` | 13 | 0.4.0 | Landing, invite, auth callback, legal, changelog, open source, public profile and share, 404 and error |
| `app-core.pen` | 10 | 0.4.0 | Signed-in shell: Dashboard, History, Belts, Settings, Kumite |
| `kata.pen` | 20 | 0.5.0 | Katas list, active kata (code, chat, whiteboard, point on mobile), evaluation, results |
| `learn.pen` | 11 | 0.4.0 | Scrolls catalog and player, Engawa playground |
| `admin.pen` | 11 | 0.4.0 | `/admin/*`: katas catalog and authoring, scrolls, invitations, errors, health |

**This table is present tense — it never carries history.** "Migrated on <date>, six
components consolidated" belongs in that flow's `Log` frame, not here.

Every flow opens each row band with a **brief** frame (at the left of the band): purpose,
entry points, screens, business rules, copy source, states not drawn, open findings (`D<n>`
numbers only), history pointer — the same eight sections in every flow. **Read the brief
before editing a flow.** Each file also carries one **`Log`** frame below its bands: one
dated line per change, newest first.

| Where | Owns |
|---|---|
| **Brief frame** (`.pen`) | the flow's **present state** |
| **Log frame** (`.pen`) | **what changed and when** — one line each |
| `DECISIONS.md` | the **why** — findings, open questions, who decides |
| `CODE_CHANGES.md` | landing decided changes in code |
| `ui-kit.CHANGELOG.md` | kit versions and open kit gaps |
| this `README.md` | the method + the inventory — **no history** |

A fact written in two of them belongs in one; the others cite it.

**Kit scope.** The kit mirrors `apps/web/src/components/ui` plus the layout pieces; routes are
in `apps/web/src/App.tsx`. The logo is the Open Gate mark from `apps/web/src/brand/logo.json` (PR #151, D2).
Local-only captures go in `references/`.

## Source of truth

**code > production capture > legacy.** In that order, every time.

- Derive the **domain list** from the tab bar + navigator code, never from an old design.
- **Never invent copy** — every string must exist in the code.
- Build states by finding their owner in the code; hunt the states a normal session never
  reaches (no data, no permission, failed request) — that's where design gaps AND code bugs
  live.

## Canvas conventions

- Base frame: 1440×900 desktop (mobile variants 390 wide). Screens are drawn in the `sumi` theme. `clip: true` on every screen frame.
- Naming: `[Flow] / [Screen] / [State]` — **no numeric prefix; order is position, not name.**
- **Tokens only** — zero hex in a flow. A value the kit lacks is a kit gap: log it.
- Touch targets ≥ 44pt/48dp; AA contrast through tokens.
- Bottom sheets anchor by math: `y = screenH − sheetH`.

### Layout — a docs column plus row bands

One **row band per journey variant** (happy path · error/alternate paths · desktop), read
left → right, each opening with its brief. One `Log` frame per file below every band.
Positions are **computed, never picked**, from five variables declared in the `.pen`:

| Variable | This project | What it is |
|---|---|---|
| `grid-x0` | `0` | Left edge of the docs column (briefs + Log) |
| `grid-brief-w` | `640` | Width of every brief and of the Log |
| `grid-gutter` | `120` | Horizontal gap between artboards |
| `grid-y0` | `0` | Top of the first band |
| `grid-row-gap` | `260` | Vertical gap between bands |

Inserting a screen mid-journey: drop it at the `x` it belongs to (overlap is fine), then
**reflow the band** — one call sorts by current `x` and re-snaps to the grid. It never
reorders, so drift is always cheap to fix.

## The kit + vendoring

Core/shared components → the kit. Feature-local components → the flow. Flows **vendor** the
kit at a pinned `kit-version-source` (Pencil can't cross-reference files); bumps follow the
CHANGELOG rules. Being behind is fine; **diverging is not** — install every token in every
flow even when nothing renders differently.

## Team workflow

1. Design changes go through PRs, like code — atomic with the implementing code when possible.
2. One person per `.pen` at a time. Kit changes get review.
3. No auto-save: **save often, commit often**.
4. Nothing moves from `_playground.pen` to `flows/` without cleanup + approval.
5. Export PNGs of changed flows for PM/PO review.

## Fidelity loop (design ↔ code)

1. Open the flow, read its brief. 2. Design with the vendored components. 3. Implement:
"the `.pen` components map 1:1 to `apps/web/src/components/ui`". 4. Screenshot the rendered app,
overlay at 50% opacity on the design, fix drift in the design first, then the code.
