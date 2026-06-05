# PRD-032: Sprint 023 — Dojo language pass

> **Status:** advancing to spec
> **Date:** 2026-06-05
> **Author:** Claude (Kira deciding; Darius + Soren + Tomás + Yemi advising)

---

## Sprint goal in one sentence

Make the dojo language coherent end-to-end — routes, nav, code, brand voice, visual — and ship `/belts` with a real progression rubric, without breaking the kata loop.

---

## Inputs

- [PRD-030](030-dojo-terminology-routes.md) — language pass, Option A locked
- [PRD-031](031-belt-progression-rubric.md) — belt rubric, Option C locked
- Hard carry-forwards from [sprints/current.md](../sprints/current.md):
  - First friend invite dispatch (humans-only; no sprint code blocker)
  - Smoke-suite staging environment

---

## Scope — what ships

### 1. Routes & nav (web)
- `/kata` → `/katas` (index); `/kata/:id*` → `/katas/:id*` (detail + eval + result)
- `/learn` → `/scrolls`; `/learn/:slug` → `/scrolls/:slug`
- `/playground` → `/engawa`; `/playground/:language` → `/engawa/:language`
- `/badges` → `/belts`
- `/leaderboard` → **deleted**; new `/kumite` route ships as "coming soon" placeholder explaining what kumite will be
- `/dashboard`, `/start`, `/settings`, `/history`, `/u/:username`, `/share/*`, `/invite/:token`, `/admin/*` → **unchanged**
- Sidebar labels updated to match. Old routes deleted (no aliases, no 301s — zero users)
- Share-card route `/share/course/:slug/:userId` → `/share/scroll/:slug/:userId`

### 2. Domain code — ubiquitous language
- `Exercise` aggregate → `Kata` (domain, application, ports, repository adapters, events)
- `Course` aggregate → `Scroll` (per ADR-015 bounded context)
- `Badge` aggregate → `Belt` (note: the *concept* changes — Belt is a single rank per user, not a collection of earned items; if any "achievements" survive as separate concept, name TBD in spec)
- Database table names: **keep** (`exercises`, `courses`, `badges`) — DB rename has migration risk without product win. Domain ↔ DB mapping handled at repository adapter layer
- Zod schemas in `packages/shared` renamed in lockstep with domain
- Frontend types follow shared schemas
- Test fixtures, seed scripts, factories renamed

### 3. Belt system (PRD-031)
- New `BeltRank` value object with 5 ranks
- `BeltCalculator` (pure function) — takes a user's session/attempt history + topic clusters → returns current belt rank
- `topicCluster()` helper in `packages/shared` — maps topic slug → cluster name from comment headers in `topics.ts`
- Computed on read (no separate `user_belts` table for v1; recomputed from existing data)
- `/belts` page redesigned around progression: shows current belt prominently, the 4 factors (volume, diversity, active days, cooldown), what advancement looks like — **no progress bar** to next belt (per PRD-031 "the dojo doesn't babysit")
- Sidebar avatar: colored ring matching current belt
- Public profile: belt rank visible
- Share card: belt variant
- Leaderboard surface (now `/kumite`) does **not** show belts

### 4. Brand voice
- `BRANDING.md` updated with vocabulary glossary (dojo, sensei, kata, scroll, engawa, belt, kumite — each with one-sentence definition and on/off-brand examples)
- Sensei system prompts revised — moderate dojo register, not heavy (lock per PRD-030 calibration test)
- **Calibration test:** before merging the new sensei prompts, run the same 10-kata fixed set through old prompts + new prompts, compare verdict distributions. If pass-rate shift is > ±10 points on any difficulty bucket, revise prompts. (Hiroshi-style contract; ship behind validation.)
- Microcopy review across landing, kata flow, results, profile — Soren passes

### 5. Visual
- Belt color tokens in design system (5 swatches matching ring colors + share-card backgrounds)
- Sidebar avatar ring component
- `/belts` page layout (Soren-led)
- `/kumite` "coming soon" panel — visually consistent, not a 404
- Share card belt variant
- Favicon, logo, landing untouched

### 6. Documentation
- `AGENTS.md` — vocabulary references updated
- `BRANDING.md` — glossary section (see §4)
- `ARCHITECTURE.md` — aggregate names updated (`Exercise → Kata`, `Course → Scroll`)
- `README.md` — route references updated, no marketing copy changes
- `CHANGELOG.md` — entry for the language pass
- Old ADRs / archived sprints / archived specs: **not** edited. They're history; rewriting them is theater.
- New ADR: `adr/020-ubiquitous-language-pass.md` — records the rename decision, the no-backward-compat choice, and the DB-table preservation

### 7. Carry-forward — smoke-suite staging environment
- Stand up staging deploy with `LLM_ADAPTER_FORMAT=mock` + Turnstile dummy keys
- `complete-kata` and `playground-anon-run` smoke specs run on every deploy, not just prod
- Wire into existing CI smoke job

---

## Scope — what does NOT ship

- **Kumite feature itself** — only the route reservation + placeholder copy. Separate PRD when ready.
- **Per-track belt marks** — v1.1 backlog.
- **Belt rust indicator** — v1.1 backlog.
- **DB table renames** — `exercises`, `courses`, `badges` stay; mapping at adapter layer.
- **Aggressive sensei voice rewrite** — moderate register only, behind calibration gate.
- **First friend invite dispatch** — humans-only, not a code task. Adrian sends when ready.
- **`/dashboard` rename, `/start` rename** — confirmed stay per PRD-030.

---

## Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Code rename touches more files than estimated (~80-150), sprint overruns | Medium | Critical-path order below; cut visual polish before cutting code rename |
| Sensei verdict distribution shifts on new prompts (Yemi's calibration concern) | Medium | Calibration test gates the prompt merge; revert prompt-only without reverting routes if needed |
| Belt rubric thresholds turn out wrong on first real cohort use | High | Rubric is recalculable from existing data; no migration needed to revise |
| `/engawa` discoverability blocks anonymous Phase 4 traffic later | Low (no Phase 4 traffic yet) | Reversible; revisit when public-traffic data exists |
| `Exercise → Kata` rename breaks production deploys mid-sprint | Low (no users) | Single feature branch, merge when green; no need for incremental rollout |
| Belt `topicCluster` mapping is brittle as new topics are added | Medium | Pure function in shared; topic header → cluster mapping covered by a `topics.test.ts` that fails if a topic is uncategorized |

---

## Critical-path order

Day 1–2: **Domain code rename** (`Exercise → Kata`, `Course → Scroll`, `Badge → Belt`). Largest blast radius. If this stalls, nothing else matters. Do it first while the head is fresh.

Day 3: **Routes + nav rename**. Mechanical once code is renamed.

Day 4–5: **Belt rubric implementation** — `BeltCalculator`, `topicCluster` helper, `/belts` page wired to real data.

Day 6: **Sensei prompt update + calibration test**. Gate is the test passing.

Day 7: **Visual polish** — belt rings, share card belt variant, `/kumite` placeholder.

Day 8: **Docs, ADR-020, CHANGELOG, staging smoke environment**.

Day 9–10: **Buffer + dogfooding** — Adrian uses the renamed product end-to-end for two days before considering the sprint closed. Anything that feels wrong in real use gets fixed or noted as v1.1.

If running long after day 7, **cut visual polish before cutting the code rename or belt rubric**. A working belt with a placeholder ring is better than a polished badge page.

---

## Definition of done

- [ ] All five route renames live (old routes 404)
- [ ] All domain code renames merged; `grep -r "Exercise\|Course\|Badge" apps/api/src/domain apps/api/src/application` returns zero matches outside DB mapping layers
- [ ] `/belts` page shows the user's real current belt computed from session history
- [ ] Topic cluster helper covers every topic in [packages/shared/src/topics.ts](../../packages/shared/src/topics.ts) (test enforced)
- [ ] Sensei calibration test passes (verdict-distribution drift ≤ ±10 points per difficulty bucket)
- [ ] `/kumite` placeholder renders, links from nowhere except direct URL access for now
- [ ] `BRANDING.md` glossary published
- [ ] ADR-020 written and merged
- [ ] CHANGELOG updated
- [ ] Staging smoke environment runs full smoke suite on every deploy
- [ ] Adrian completes ≥ 3 kata end-to-end on the new build over ≥ 2 days without filing a P0 bug

---

## Next step

- [ ] Adrian approves sprint scope (or asks for cuts)
- [ ] Spec drafted: `docs/specs/NNN-dojo-language-pass.md` — implementation-level detail on the code rename (file inventory, repository adapter mapping strategy, test-fixture rename plan)
- [ ] Move sprint pointer: [sprints/current.md](../sprints/current.md) updated to reference this PRD
- [ ] Kickoff: day 1 starts with code rename, not with routes
