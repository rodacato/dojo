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

## 0.7.0 — the Paper public pieces

**Components:** `PublicNav/Mobile` and `PublicNav/Desktop` are redrawn in Paper: wordmark, the four links on desktop, `Sign in` (off by default, on for the landing) and the `Enter the dojo` CTA. `PublicFooter/Desktop` is redrawn and `PublicFooter/Mobile` is new: mark and host, the four links, `Runs on Dojo, open source →` and the tagline (both off by default, on for the landing). New: `Text/Display`, `Text/H2` and `Text/Body` (Mobile and Desktop), `Text/H3`, `Text/Eyebrow`, `Text/Note`, and `ErrorPanel/Mobile` and `ErrorPanel/Desktop` (Paper Gate watermark, pill, title, optional sub, body, two actions, optional strip). None of them is in `components/ui` yet; the code follows them.

**Vendored by:** `public.pen` (kit-version-source `0.7.0`), where every screen uses them. The other flows stay behind; their old nav and footer copies still draw the previous design.

## 0.6.0 — Paper Gate logo, Washi and Sumi only

**Tokens:** the `slate` theme is gone. Every themed variable keeps its `sumi` and `washi` values, and the Foundations panel for Slate is deleted. The app dropped Slate in the same change, so the kit no longer describes a theme nobody can pick.

**Components:** `LogoMark` draws the Paper Gate from `apps/web/src/brand/logo.json`: one filled path made of the four pieces (lintel, crossbar, two posts), replacing the stroked Open Gate. Inside `LogoWordmark` the mark is `accent`, as `Logo.tsx` renders it; the kit had it in `primary` since 0.2.0.

**Vendored by:** `public.pen` (kit-version-source `0.6.0`), patched in place with this entry's diff; it does not carry `CodeLine`, which no public screen draws. The other flows stay behind until they are reworked: a flow on an older kit shows the old mark.

## 0.5.0 — CodeLine for the point kata

**Components:** `CodeLine/Default`, `CodeLine/Selected` and `CodeLine/Focus`, mirrored from `apps/web/src/components/ui/CodeLine.tsx`. Each is a 44px tappable row: 36px gutter with a 12px number, 13px mono code, 3px left border that turns primary with an elevated fill when selected, and a 1px accent ring on focus. The playground's proposed copy had a 37px gutter, an 11px number and a bottom rule; the code has neither, so the kit follows the code.

**Vendored by:** `kata.pen` (kit-version-source `0.5.0`), the only flow that draws a point kata. The other flows stay on `0.4.0`: the bump is additive.

## 0.4.0 — readable status text and a REVIEW hue of its own

**Tokens:** `color-success-text` and `color-warning-text` (washi `#4A6640` and `#7A5A12`, 5.22 and 5.16 on surface; slate and sumi equal the base). `color-type-review` is `#0EA5E9` in slate and `#3F6AA8` in sumi and washi, and `tint-type-review-20` and `-40` are now themed (they were a single slate value). Foundations lists the new swatches and ratios.

**Components:** text that was success or warning uses the new tokens (badges, banners, toasts, timer, chips, verdict). The `VerdictBlock` ink stroke takes the verdict colour. The kit demos in Foundations keep the base tokens on purpose.

**Vendored by:** all five flows (kit-version-source `0.4.0`). Kata Results draws Copy share link as ghost (D50).

## 0.3.0 — accent discipline and readable text

**Tokens:** `color-accent-text` and `color-danger-text` (derived, so text on a surface clears AA; sumi 4.53 and 4.56), plus `tint-type-review-20`, `tint-type-review-40` and `tint-primary-30`. The approved brand values do not change (D42, D46).

**Components:** accent is only the filled action, links, focus and the mark. Selected states (sidebar and bottom nav, group buttons, chips, toggle, pagination) go neutral with a primary border or bar; the review badge uses its own type token; info banners and toasts, the user chat bubble and the AccentCard rail are neutral. Readable text that was `muted` is now `secondary`; `muted` stays on placeholders. Foundations lists the new tokens and their measured ratios.

**Vendored by:** all five flows (kit-version-source `0.3.0`). Flow screens were swept the same way: streak and chip numbers, eyebrows and selected controls neutral, links on `accent-text`, error text on `danger-text`.

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
