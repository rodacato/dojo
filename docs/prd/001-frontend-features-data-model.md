# PRD-001: Frontend Features & Data Model Gaps

> **Status:** exploring
> **Date:** 2026-03-21
> **Author:** Claude (Kira + panel: Darius, Tomás, Soren, Priya)

---

## Idea in one sentence

Map every screen to concrete features and identify what the current domain model is missing to support them.

---

## Source material

- 24 initial Stitch mockups (not maintained in-repo — historical reference only)
- Domain model from `docs/ARCHITECTURE.md`
- Existing DB schema: users, exercises, variations, sessions, attempts (specs 003, 006)

---

## Feature inventory by screen

### Phase 0 — Core Loop (required for MVP)

| Screen | Route | Key frontend features | Data needed |
|---|---|---|---|
| Login / Landing | `/login` | GitHub OAuth CTA, redirect if auth | `user` session cookie |
| Day Start — Daily Ritual | `/start` | Mood selector, time selector, streak counter, 30-day heatmap strip, disabled CTA until both selected | `streak`, session history for heatmap |
| Kata Selection | `/kata` | 3 exercise cards, type/difficulty/language badges, hover state | `Exercise[]` (3, filtered) |
| Kata Active — CODE | `/kata/:id` | Split panel, code editor (no autocomplete), countdown timer, color states | `Session.body`, `Session.startedAt`, `Exercise.duration` |
| Kata Active — CHAT | `/kata/:id` | Textarea, word count, mono/sans toggle, countdown timer | same as CODE |
| Kata Active — WHITEBOARD | `/kata/:id` | Mermaid editor + preview, tab switcher, countdown timer | same + `WhiteboardPort` |
| Sensei Evaluation | `/kata/:id/eval` | Streaming chat, follow-up input (max 2), verdict card, disabled states, blinking cursor | `Attempt[]`, `EvaluationResult` (streaming) |
| Results & Analysis | `/kata/:id/result` | Verdict display, prose analysis, topics chips, share preview, "+N positions" stat | `EvaluationResult`, relative leaderboard delta |
| Dashboard | `/dashboard` | Streak number, today card (2 states), recent activity list (4 rows) | `streak`, `todaySession`, `recentSessions[]` |
| Admin — Exercise List | `/admin` | Dense table, filters, pagination, actions | `Exercise[]` with `sessionCount`, `avgScore` |
| Admin — New Exercise | `/admin/exercises/new` | Multi-field form, chip inputs, draft/publish toggle | `Exercise` + `Variation` (create/update) |

### Phase 1 — Social

| Screen | Route | Key features | Data needed |
|---|---|---|---|
| Public Profile | `/u/:username` | Stats (4 cards), 90-day heatmap, recent kata list, earned badges | `UserStats`, `ActivityDay[]`, `Badge[]` |
| Share Card | OG image | Server-generated 1200×630px image | `Session`, `EvaluationResult`, pull quote |
| Leaderboard | `/leaderboard` | Ranked table, period filter (month/all), current user highlight | `LeaderboardEntry[]` |
| Invite — Request Access | `/invite` | Form (GitHub handle + optional why) | `AccessRequest` (new entity) |
| Invite — Redeem Token | `/invite?token=` | Token validation, invited-by display, GitHub OAuth CTA | `InviteToken` (new entity) |

### Phase 2 — Gamification

| Screen | Route | Key features | Data needed |
|---|---|---|---|
| Badges Collection | `/badges` | Earned/locked grid, filter, prestige badge | `Badge[]` with earned state |
| Extended Dashboard | `/dashboard` | Weak areas, practice patterns, sensei suggestions | Cross-session LLM analysis (new) |

### Public Pages (Phase 0 / launch)

| Screen | Route | Notes |
|---|---|---|
| Landing Page | `/` | Static + dynamic effects, request access form, GitHub stats |
| Open Source | `/open-source` | Static, GitHub stats bar |
| Changelog | `/changelog` | Driven by `CHANGELOG.md` or DB entries |
| 404 | `*` | Static |
| Terms of Service | `/terms` | Static |
| Privacy Policy | `/privacy` | Static |

---

## Data model gaps

### What exists (from specs 003 + 006)

- `users` — id, github_id, username, avatar_url, created_at
- `exercises` — id, title, description, duration, difficulty, type, status, language[], tags[]
- `variations` — id, exercise_id, owner_role, owner_context
- `sessions` — id, user_id, exercise_id, variation_id, body, status, started_at, completed_at
- `attempts` — id, session_id, user_response, verdict, analysis, topics_to_review[], is_final_evaluation, submitted_at, llm_response (JSON)
- `user_sessions` — auth sessions (cookie → user_id)

### What is missing

#### 1. Streak tracking

The Day Start screen and Dashboard both show a streak counter and 30-day heatmap. This requires:

```sql
-- Option A: derive from sessions table (no new table needed)
-- streak = consecutive days with at least one completed session
-- heatmap = group sessions by date, count per day
-- ✅ Preferred — no schema change, computed at query time
```

**Verdict:** No new table needed. The query is a `DATE_TRUNC('day', completed_at)` group with a gap-detection window function. Amara Osei should review the UX implications of "reset on miss" vs. "grace day."

> ⚠ Open question: Does a `needs_work` verdict count toward the streak, or only `passed` / `passed_with_notes`? Decision has product philosophy implications (see Priya).

#### 2. Badge system

The current schema has no badge tables. Needed for Phase 1 (Public Profile shows earned badges).

```sql
badge_definitions (id, slug, name, description, category, is_prestige)
user_badges (id, user_id, badge_definition_id, earned_at, session_id)
```

**Verdict:** Can defer to Phase 1. In Phase 0, the `FIRST KATA` and `5 STREAK` badges are the only two that matter — these can be computed on-the-fly from `sessions` count without a new table.

#### 3. Invite / access system

Needed for Phase 1 social opening. Two new tables:

```sql
access_requests (id, github_handle, why, status, created_at)
invite_tokens (id, token, created_by_user_id, redeemed_by_user_id, redeemed_at, created_at)
```

**Verdict:** Defer to Phase 1. For Phase 0 (creator only), no invite system is needed.

#### 4. Admin stats on exercises

The Admin — Exercise List screen shows `sessions count` and `avg score` per exercise. These are derived columns, not stored:

```sql
-- session_count: COUNT(sessions) WHERE exercise_id = ?
-- avg_score: computed as % of sessions with verdict = 'passed' or 'passed_with_notes'
```

**Verdict:** No schema change. Add a view or use a CTE in the query.

> ⚠ Open question: `avg_score` is displayed as a percentage. Is it (passed + passed_with_notes) / total, or just passed / total? The distinction matters for how honest the metric is.

#### 5. Leaderboard data

Leaderboard ranks by consistency. The `sessions` table has everything needed:

```sql
-- streak: derived (consecutive days with completed sessions)
-- kata_count: COUNT(sessions) WHERE status = 'completed'
-- pass_rate: COUNT(verdict IN ('passed', 'passed_with_notes')) / COUNT(sessions)
-- last_active: MAX(completed_at)
```

**Verdict:** No new table. The leaderboard query joins `users` + aggregates from `sessions`.

#### 6. Activity heatmap (Public Profile)

90-day view by practiced/passed/empty. Derived from `sessions`:

```sql
SELECT DATE_TRUNC('day', completed_at) as day,
       COUNT(*) as total,
       COUNT(CASE WHEN verdict IN ('passed', 'passed_with_notes') THEN 1 END) as passed
FROM sessions
WHERE user_id = ? AND completed_at > NOW() - INTERVAL '90 days'
GROUP BY 1
```

**Verdict:** No schema change.

#### 7. Cross-session LLM analysis (Phase 2)

The Extended Dashboard requires analyzing patterns across a user's full history ("where you struggle", "how you practice"). This is the most significant data gap:

```sql
-- Option A: store a cached analysis summary per user, regenerated periodically
user_insights (id, user_id, weak_topics[], practice_patterns JSONB, generated_at)

-- Option B: compute on the fly from topics_to_review[] across all attempts
-- Expensive but no schema change
```

**Verdict:** Defer to Phase 2. Phase 0 can skip this entirely.

#### 8. Mood / duration — not persisted (by design)

From `docs/ARCHITECTURE.md`: "Mood and time are filters, not persisted data." This is an intentional decision. The Day Start screen captures these as query parameters passed to `GET /exercises`, never written to the DB.

---

## Summary: schema changes needed per phase

| Phase | Schema change | Priority |
|---|---|---|
| Phase 0 | None — streak and admin stats are derived queries | ✅ Ready |
| Phase 1 | `badge_definitions`, `user_badges`, `access_requests`, `invite_tokens` | Medium |
| Phase 2 | `user_insights` (cross-session LLM analysis cache) | Low |

---

## Component inventory (for Soren / frontend build)

From the Style Guide screen, the following primitives exist in the design system:

**Buttons:** Primary / Ghost / Text link / Destructive — all sizes and states
**Inputs:** Text / Textarea / Number / Chip input / Select
**Group buttons:** Segmented control (mood selector, time selector, filter tabs)
**Badges:** TYPE (CODE/CHAT/WHITEBOARD) / DIFFICULTY / VERDICT / ADMIN STATUS
**Chips:** default, removable, filter, warning, suggestion, topic
**Cards:** content, accent (left border `#6366F1`), stat, code block
**Modals:** dojo flow (no close on outside click) vs informational
**Toasts:** error, warning, info only
**Achievement badges:** earned (glow) vs locked (muted, no lock icon)
**Timer:** countdown with 3 color states (normal → amber ≤20% → red ≤10%)
**Activity heatmap:** dot grid, 3 states (empty `#334155` / practiced `#6366F1` / passed `#10B981`)
**Streaming indicator:** blinking cursor `▌` with "Evaluating..." text

> ⚠ Open question: The code editor (Kata Active — CODE) requires "no autocomplete, line numbers, blinking cursor." Options: CodeMirror 6 (configurable, lightweight), Monaco (heavy but familiar), plain `<textarea>` with a monospace overlay. Tomás should weigh in on bundle size vs. editor experience.

---

## Provisional conclusion

The existing domain model is more complete than expected — almost all screen data is derivable from the current 6-table schema without additions. The only Phase 0 gap is the code editor component choice. The system is architecturally ready to build the frontend.

**Phase 0 can proceed without any schema migrations.**

---

## Next step

- [ ] Convert the component inventory to implementation tasks in sprint-002
- [ ] Resolve open questions (streak counting rule, avg_score definition, code editor choice) before implementing those specific screens
- [ ] Advance to spec when sprint-002 frontend work begins
