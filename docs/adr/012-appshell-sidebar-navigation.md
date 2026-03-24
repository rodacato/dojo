# ADR-012: AppShell layout + sidebar navigation strategy

**Status:** Accepted (Phase 2)
**Date:** 2026-03-24
**Deciders:** Soren Bachmann (UX/UI), Tomás Ríos (infra/layout), Priya Menon (product scope)

---

## Context

The Stitch design reference shows a persistent left sidebar across most authenticated screens (dashboard, kata selection, results, leaderboard, badges, profile, admin). The current implementation has no shared layout shell — each page renders its own header and full-width content independently.

Sprint 009 requires aligning all core screens with Stitch. The sidebar is the most impactful structural change — it touches routing, responsive behavior, and every authenticated page.

Three approaches were considered:

1. **No sidebar — keep current layout.** Each page manages its own header/nav. Simpler, but diverges significantly from Stitch and limits navigation consistency.

2. **AppShell with sidebar on all authenticated pages.** Wrap all auth routes in a shared layout component. Sidebar always present (collapsible on desktop, bottom nav on mobile).

3. **AppShell with conditional sidebar.** Shared layout wrapper, but sidebar explicitly hidden on focused screens (kata active, eval) where navigation is a distraction.

---

## Decision

**Option 3 — AppShell with conditional sidebar.**

An `AppShell` component wraps all authenticated routes and provides:

- **Sidebar (desktop ≥768px):** Left rail with logo, nav items, version. Collapsible to icon-only mode. State persisted in `localStorage`.
- **Bottom nav (mobile <768px):** 3-4 items, fixed bottom. No hamburger menu — the nav items are few enough to show directly.
- **Focused mode:** Kata active (`/kata/:id`) and eval (`/kata/:id/eval`) render without sidebar or bottom nav. These are focused work screens where navigation is intentional friction.

### Layout structure

```
<AppShell>                    ← wraps all auth routes
  <Sidebar />                 ← hidden on focused screens
  <main>
    <Outlet />                ← page content
  </main>
</AppShell>
```

### Sidebar nav items (Phase 2)

| Item | Icon | Route | Notes |
|---|---|---|---|
| Practice | `<>` | `/start` | Primary action — enter the dojo |
| Dashboard | `dashboard` | `/dashboard` | Home / stats overview |

Additional items (drills, stats, settings, profile) are added when those pages exist. Empty nav items are not rendered.

### Screens without sidebar

| Screen | Route | Reason |
|---|---|---|
| Kata Active | `/kata/:id` | Focused work — no distractions |
| Sensei Eval | `/kata/:id/eval` | Focused evaluation — no escape |
| Landing | `/` | Public — no auth shell |
| Login | `/login` | Public — no auth shell |
| Invite | `/invite` | Public — no auth shell |

### Responsive behavior

| Breakpoint | Sidebar | Bottom nav | Content max-width |
|---|---|---|---|
| ≥1024px | Expanded (icon + label) | Hidden | `max-w-4xl` |
| 768–1023px | Collapsed (icon only) | Hidden | `max-w-3xl` |
| <768px | Hidden | Visible (fixed bottom) | Full width with `px-4` |

---

## Consequences

**Positive:**
- Consistent navigation across all authenticated screens
- Responsive behavior defined once, not per-page
- Focused screens remain distraction-free
- Easy to add nav items as new pages ship

**Negative:**
- Routing changes: all auth routes must be children of `AppShell` in `App.tsx`
- Every page loses its own header — must delegate to AppShell
- Sidebar items that link to unbuilt pages (drills, stats) must be omitted until those pages exist

**Risks:**
- Mobile bottom nav may conflict with the kata active timer bar. Mitigated by hiding bottom nav on focused screens.
- Sidebar collapse animation may cause layout jank on slower devices. Mitigated by using `transform` instead of `width` transitions.

**Rollback:** Remove `AppShell` wrapper from routes and restore per-page headers. Each page already has its own layout — reverting is mechanical.

---

## Implementation notes

- `AppShell` lives in `apps/web/src/components/layout/AppShell.tsx`
- Sidebar in `apps/web/src/components/layout/Sidebar.tsx`
- Bottom nav in `apps/web/src/components/layout/BottomNav.tsx`
- Focused screens opt out via a route-level flag or by being outside the `AppShell` route group
- Sidebar collapse state: `localStorage.getItem('dojo-sidebar-collapsed')`
