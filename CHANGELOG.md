# Changelog

All notable changes to this project are documented here. First-person decision voice — not feature announcements.

---

## Sprint 011 — Refactoring + Landing + Execution + Interests + E2E (2026-03-26)
**Phase 2 closing → Phase 1 Alpha prep**

The sprint where the codebase got cleaned up, the landing page got rewritten for real visitors, code execution became real, and kata selection got personal.

- **Code health refactoring** — practice.ts split from 1,312 to 492 lines across 4 route files (ADR 013). Verdict/streak query helpers extracted. Frontend components (TodayCard, RecentSessionRow, useRotatingMessage) extracted. Error handling and type safety fixes across the codebase.
- **Contrast fix** — `--color-muted` brightened from #475569 to #64748B to pass WCAG AA (4.5:1 minimum) on all surface backgrounds.
- **Landing page redesign** — Full Stitch rewrite: sticky navbar, dot grid background with mouse proximity effect, typewriter hero, 4-step "How It Works" flow, social proof with practitioner quotes, new "Open Source" section with live GitHub stats, scroll fade-in animations. "What It's Not" section removed per Soren.
- **Sandboxed code execution (Piston)** — ADR 014. CodeExecutionPort with PistonAdapter + MockExecutionAdapter. ExecutionQueue with concurrency limit. WS messages `executing` and `execution_result`. Sensei receives test results as factual evidence (4 prompt variants). Frontend shows results before sensei streaming.
- **Interest-based kata selection** — user_preferences table (level, interests, randomness). Weighted exercise ordering: interests affect category preference, level affects difficulty, randomness controls the mix. DayStart "Customize your practice" panel.
- **E2E smoke tests** — Playwright setup with 4 tests (landing, auth redirect, dashboard, kata flow). API mocked with page.route(). CI job runs in parallel.
- **Pre-launch hardening** — GetExerciseOptions domain violation fixed (UserPreferencesPort), 5 DB performance indexes, connection pool (max 20), 14 new tests (ExecutionQueue, PistonAdapter, GetExerciseOptions), WS error logging + partial stream persistence.

---

## Sprint 010 — Feedback Loop + Share + Admin Review (2026-03-26)
**Phase 2 — Pre-invite polish (closing)**

The sprint where the product learned to listen. Users can now tell me what's broken in an exercise, I can see the signal aggregated by variation, and the share experience finally has a proper landing page instead of a dead link.

- **Kata feedback system** — 3 micro-questions (clarity, timing, evaluation fairness) + optional note, collapsed on Results page. One per session, stored per variation so I can tell which sensei persona is underperforming.
- **Share redesign** — Public page at `/share/:id` with verdict badge, sensei pull quote, exercise info, and "Enter the dojo" CTA. OG image for social previews. ShareButton now copies the public URL.
- **Admin review** — Aggregated feedback on the edit page, breakdown by variation, notes list, admin notes field. Archive action for exercises with consistently bad feedback. Version auto-increments on every edit.
- **Secondary screens** — Login card-centered with watermark, Badges grouped by category (2-col mobile), Leaderboard and Profile cleaned up for AppShell navigation.

---

## Sprint 009 — Design Alignment + Quality of Life (2026-03-24)
**Phase 2 — Pre-invite polish**

The sprint where every screen got a second pass against the Stitch design reference. Six core screens, a sidebar, and a 4x expansion of the exercise catalog.

- **Dashboard** — 12-column grid layout (streak 4col + today 8col, activity 8col + right panel 4col), card-style rows, Material Symbols icons in sidebar/bottom nav.
- **Core screens** — Results, Sensei Eval, Day Start, Kata Selection, Kata Active all aligned with Stitch design direction.
- **Component library** — Modal, Toast, SkeletonLoader, AccentCard, StatCard, GroupButtons, Input/Textarea — all implemented.
- **60+ exercises** — Expanded from 15 to 61 across 10 categories (SQL, design patterns, architecture, common services, frontend, DevOps, algorithms, security, testing, process). Split into per-category files under `exercises/`.
- **Streaming improvements** — Code blocks parsed in eval messages, typing reveal for non-streaming mode.
- **Mobile responsive** — Full audit with critical/high/medium fixes across all pages. `prefers-reduced-motion` global CSS rule.

---

## Sprint 008 — Production Ready (2026-03-22)
**Phase 2 — The Scoreboard**

OG tags, email reminders, Mermaid whiteboard editor, OpenAI-compatible LLM adapter, `LLM_STREAM` toggle, error recovery, expired session handling.

---

## Sprint 007 — Phase 2 Scoreboard (2026-03-20)

Leaderboard (monthly/all-time), badge system (10 badges, 2 prestige), weak areas dashboard, practice patterns.

---

## Sprint 006 — Phase 1 Social (2026-03-18)

Public profiles, invitation system, share cards (satori PNG generation), badge definitions.

---

## Sprint 005 — Hardening + Phase 1 (2026-03-16)

CSP headers, 404 page, invitation flow, admin edit exercise, Resend email integration, request access form.

---

## Sprint 004 — Polish & Branding (2026-03-14)

Logo (torii gate mark), favicon, OG image, landing page visual polish, results permalink, dashboard stats.

---

## Sprint 003 — Production Deploy (2026-03-12)

First production deploy (Hetzner + Cloudflare Tunnel), landing page, UX error states, bearer token auth.

---

## Sprint 002 — Core Loop (2026-03-10)

HTTP routes, WebSocket evaluation streaming, Anthropic adapter, 16 seed kata, 8 frontend screens, admin UI.

---

## Sprint 001 — Technical Foundation (2026-03-08)

Monorepo (Turborepo), DDD scaffold (bounded contexts, ports, adapters), PostgreSQL + Drizzle, GitHub OAuth, CI pipeline, shared package.
