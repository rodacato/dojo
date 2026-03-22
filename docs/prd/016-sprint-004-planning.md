# PRD-016: Sprint 004 Planning — Polish, Branding & Dogfooding

> **Status:** confirmed
> **Date:** 2026-03-22
> **Author:** Claude (Lucía Navarro guiding — sprint planning, Soren Bachmann + Priya Menon consulted)

---

## Idea in one sentence

Make Phase 0 feel finished: branding, visual polish, and quality-of-life features so the creator can dogfood daily without friction.

---

## Why now

Sprint 003 proved the core loop works end-to-end in production. But "it works" and "I want to use it daily" are different things. The creator completed a kata but:

- Can't revisit results after leaving the results page
- Dashboard shows minimal information after completing the daily kata
- No logout button
- No branding — generic site with no logo, favicon, or OG image
- Landing page has copy but no visual polish
- No profile page

Phase 1 (inviting friends) requires the product to look and feel like something worth sharing. This sprint bridges that gap.

---

## Expert panel input

### Priya Menon (Product Strategy)

"Before inviting anyone, the creator needs to be using this daily and finding it valuable. The signals to watch:
1. Does the creator come back tomorrow without being reminded?
2. After a kata, does the creator want to review what the sensei said?
3. Does the dashboard make the creator feel progress?

If all three are yes after 1-2 weeks of daily use, Phase 1 starts. This sprint should build the features that make those signals measurable."

### Soren Bachmann (UX/Design)

"The branding doc is solid — the identity is clear. What's missing is execution:
1. **Logo as SVG component** — the `dojo_` text is rendered in CSS right now. It needs to be a proper SVG with the cursor animation baked in, reusable in favicon, OG image, and share cards.
2. **Results page needs a permalink** — the creator saw their results once and lost them. The dashboard's recent sessions should link directly to `/kata/:id/result`.
3. **Dashboard post-completion state is wrong** — after completing a kata, the dashboard says 'Today's kata complete' but doesn't show what happened. Show the verdict, the exercise name, and a link to the full results.
4. **Logout is basic hygiene** — put it in the dashboard header, not hidden.
5. **OG image** — when someone shares `dojo.notdefined.dev` on Twitter/Slack, it should look intentional, not like a dev project."

### Amara Diallo (Community/Growth)

"The OG image and share card are the first thing anyone sees when the link is shared. They're not vanity — they're the product's first impression. Get them right before inviting anyone. The favicon matters too — it's what appears in bookmarks and tabs."

---

## Sprint 004 scope

### Branding & Visual Identity

| Item | Description |
|---|---|
| SVG logo component | `dojo_` as reusable SVG with animated cursor, used in nav, landing, favicon |
| Favicon | `▌` cursor in indigo on dark background, 16x16 + 32x32 + apple-touch-icon |
| OG meta tags | Title, description, OG image for link previews on social/Slack |
| OG image | Static 1200x630 image — `dojo_` logo, tagline, dark background |
| Landing page visual polish | Refine spacing, typography hierarchy, section transitions per BRANDING.md |

### Dashboard & Results

| Item | Description |
|---|---|
| Results permalink | Recent sessions in dashboard link to `/kata/:id/result` |
| Today card — post-completion | Show verdict badge, exercise title, link to results (not just "Today's kata complete") |
| Kata history page | `/history` — paginated list of all completed katas with verdict, date, link to results |
| Profile section | Username, avatar, total katas, member since — in dashboard header or `/profile` |

### Quality of Life

| Item | Description |
|---|---|
| Logout button | Visible in dashboard header — calls `logout()` from AuthContext |
| Results page — return path | "Return to dashboard" CTA on results page (currently exists but verify) |
| Session detail persistence | Results page loads data from API even if navigated to directly (not just from eval redirect) |

### Out of this sprint

- Share cards (Phase 1 — needs more design work)
- Badges (Phase 2)
- Email/push notifications (requires infrastructure not yet in place)
- Mobile tab switcher for CODE kata (deferred)
- Skeleton loaders (deferred)

---

## Next step

- [x] Expert panel consultation
- [ ] Create specs and add to sprint current.md
