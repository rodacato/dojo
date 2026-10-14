# ui-kit.lib.pen — Changelog

Pencil can't reference components across `.pen` files, so each `flows/*.pen` **vendors** the
kit at a pinned version via file copy — it does NOT link live. Bumping here means flows on an
older version may need a re-sync.

**Version markers:** `kit-version` variable lives in `ui-kit.lib.pen`; each flow records the
version it vendored in `kit-version-source`.

**Bump rules:** patch = token value tweak · minor = new/changed token or component ·
major = breaking rename/removal. Additive bumps don't force re-syncs — being behind is fine,
diverging is not. A changed token VALUE forces every consumer.

---

## 0.2.0 — Open Gate logo

- `LogoMark` draws the Open Gate mark from `apps/web/src/brand/logo.json` (viewBox 100, round stroke), replacing the torii. The wordmark keeps the mark in `primary` and the `dojo_` cursor in `accent`.
- Vendored by all five flows (kit-version-source `0.2.0`).

## 0.1.1 — code sync after the UI review

- `ErrorState/Content` centers its content, as the code does (`text-center`).
- Sidebar items read "sign out", matching PR #155.
- Vendored by all five flows (kit-version-source `0.1.1`).

## 0.1.0 — initial

**Tokens:** semantic roles for the three themes (slate, sumi, washi) plus fonts (Inter,
JetBrains Mono) and radii. Every value lifted from `apps/web/src/styles/main.css`.

**Components:** the primitives in `apps/web/src/components/ui` (Button, Input, Toggle, Badge,
Banner, Toast, Timer, Pagination, chips, belt/hanko/achievement pieces, logo) plus layout
pieces (Sidebar, BottomNav, PublicNav, PublicFooter), ErrorState, ConfirmModal, skeletons.

**Vendored by:** `flows/public.pen`, `app-core.pen`, `kata.pen`, `learn.pen`, `admin.pen`
(kit-version-source `0.1.0`).

**Patched before first commit (no bump):** torii path scales with its parent (D27) and `tint-surface-30/40` added (D26). Both were already in the flow copies, so the kit now matches them.

### Gaps surfaced by the flows → candidates for 0.2.0

| Need | Real value | Used instead | Note |
|---|---|---|---|
| EmptyState actions slot | buttons under the copy | local frame | D29 |
| VerdictBlock topics/CTA slots | Results screen | local frame | D32 |
| Timer/SM danger state | red time | local override | D33 |
| AdminSidebar | `AdminLayout.tsx` | local frame in `admin.pen` | D41 |
| Hanko multi-line, GroupButtons >3 options | Settings, Katas | local frames | D30, D31 |
