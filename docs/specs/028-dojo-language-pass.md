# Spec 028: Sprint 023 — Dojo language pass implementation

> **Status:** ready-to-implement
> **Depends on:** [PRD-030](../prd/030-dojo-terminology-routes.md), [PRD-031](../prd/031-belt-progression-rubric.md), [PRD-032](../prd/032-sprint-023-planning.md)
> **Sprint:** 023
> **Inventoried files:** ~188 (~110 code, ~78 docs)

---

## Overview

Single big-bang rename across five layers, no backward compatibility, zero users. Sprint plan in [PRD-032](../prd/032-sprint-023-planning.md). This spec is the implementation contract: every identifier mapping, file rename, DB-to-domain mapping at the adapter layer, and the order of operations.

```
Day 1-2:  Shared + Domain rename (foundation; everything else depends on it)
Day 3:    Application use cases + file renames
Day 4:    Infrastructure (repositories + routes + container + event handler)
Day 5:    Belt feature (Belt value object, BeltCalculator, topicCluster helper)
Day 6:    Sensei prompt update + calibration test gate
Day 7:    Frontend (pages, App.tsx, API client, Sidebar, components)
Day 8:    Visual polish (belt rings, share card variant, /kumite placeholder)
Day 9:    Docs (BRANDING glossary, ARCHITECTURE, ADR-020, CHANGELOG) + staging smoke env
Day 10:   Dogfooding buffer
```

---

## Part 0 — Correction to PRD-030 (Badge mapping)

PRD-030 listed `Badge → Belt` with a TBD note. Resolved here:

- **`Badge` is renamed to `Milestone`.** Current Badge records (FIRST_KATA, POLYGLOT, CONSISTENT, 5_STREAK, COURSE_*) are achievement events, not rank. "Milestone" captures their semantics honestly.
- **`Belt` is a new value object** computed on read from session/attempt history per [PRD-031](../prd/031-belt-progression-rubric.md). Orthogonal to Milestones.
- **`/belts` page surface:** headline = current belt rank; secondary section = milestones earned.
- **DB tables:** `user_badges` stays. Mapping in `PostgresMilestoneRepository` adapter (see Part 4).
- **Existing milestone IDs** (`FIRST_KATA`, `POLYGLOT`, etc.) stay as stored strings — no migration.

---

## Part 1 — Shared package (Day 1)

### 1.1 Identifier renames in `packages/shared/src/types.ts`

| Old | New |
|---|---|
| `ExerciseDTO` | `KataDTO` |
| `ExerciseType` | `KataType` |
| `ExerciseStatus` | `KataStatus` |
| `CourseDTO` | `ScrollDTO` |
| `CourseDetailDTO` | `ScrollDetailDTO` |
| `CourseProgressDTO` | `ScrollProgressDTO` |
| `CourseStatus` | `ScrollStatus` |

Fields inside types: `exerciseId` → `kataId`, `courseId` → `scrollId`, `topicsToReview` stays.

### 1.2 Schemas in `packages/shared/src/schemas.ts`

| Old | New |
|---|---|
| `exerciseTypeSchema` | `kataTypeSchema` |
| `exerciseStatusSchema` | `kataStatusSchema` |
| `exerciseDTOSchema` | `kataDTOSchema` |
| `courseStatusSchema` | `scrollStatusSchema` |
| `courseDTOSchema` | `scrollDTOSchema` |

### 1.3 New helper: `topicCluster()` in `packages/shared/src/topics.ts`

Belt diversity factor uses topic clusters (the comment-section headers in `topics.ts`), not raw slugs. Add:

```ts
export type TopicCluster =
  | 'database' | 'api-design' | 'typescript' | 'react'
  | 'security' | 'testing' | 'architecture' | 'devops'
  // …continue mapping every comment header in TOPICS to a kebab-case cluster slug

const TOPIC_TO_CLUSTER: Record<Topic, TopicCluster> = { /* …filled exhaustively */ }

export function topicCluster(topic: Topic): TopicCluster {
  return TOPIC_TO_CLUSTER[topic]
}

export function topicClustersFor(topics: Topic[]): Set<TopicCluster> {
  return new Set(topics.map(topicCluster))
}
```

Test (`topics.test.ts`): fails if any `Topic` is missing from `TOPIC_TO_CLUSTER`. Enforces clusters stay complete as topics grow.

### 1.4 New types for Belt

```ts
export type BeltRank = 'white' | 'yellow' | 'green' | 'brown' | 'black'

export interface BeltDTO {
  rank: BeltRank
  factors: {
    completed: number
    distinctClusters: number
    activeDays30: number
    daysAtRank: number
  }
}

export interface MilestoneDTO {
  id: string   // FIRST_KATA, POLYGLOT, etc. — preserved as-is
  earnedAt: string  // ISO
  contextRef: string | null  // session id or scroll slug
}
```

---

## Part 2 — Domain (Day 1-2)

Bounded contexts stay: `content`, `learning`, `practice`, `recognition`, `shared`.

### 2.1 File renames

| Old | New |
|---|---|
| `domain/content/exercise.ts` | `domain/content/kata.ts` |
| `domain/learning/course.ts` | `domain/learning/scroll.ts` |
| (no aggregate file for Badge today) | `domain/recognition/milestone.ts` (new — small value object), `domain/recognition/belt.ts` (new) |

### 2.2 Identifier renames

**Content:**
- `class Exercise` → `class Kata` (file `kata.ts`)
- `interface ExerciseProps` → `KataProps`
- `ExerciseType`, `ExerciseStatus` in `values.ts` → `KataType`, `KataStatus`
- `ExercisePublished` event in `events.ts` → `KataPublished`
- `ExerciseRepositoryPort` in `ports.ts` → `KataRepositoryPort`
- `ExerciseFilters` → `KataFilters`
- `ExerciseId` brand in `shared/types.ts` → `KataId`
- `ExerciseNotFoundError` in `shared/errors.ts` → `KataNotFoundError`

**Learning:**
- `interface Course` → `interface Scroll`
- `CourseStatus` → `ScrollStatus`
- `CourseCompleted` event → `ScrollCompleted`
- `CourseRepositoryPort` → `ScrollRepositoryPort`
- `CourseProgressPort` → `ScrollProgressPort`
- `NudgeRepositoryPort` → stays (not Course-specific)

**Recognition:**
- `BadgeEarned` event → `MilestoneEarned`
- `interface MilestoneRepositoryPort` (new — replaces the implicit DB-direct pattern from `BadgeEventHandler`)
- `interface BeltRepositoryPort` is NOT needed (Belt is computed; no persistence)

**Cross-context errors:**
- Update `mainEntry` HTTP error mapping (`'EXERCISE_NOT_FOUND'` → `'KATA_NOT_FOUND'`)

### 2.3 Domain test renames

`session.test.ts` keeps its name (Session unchanged) but updates imports and any inline `Exercise` references.

---

## Part 3 — Application (Day 3)

### 3.1 File renames

| Old | New |
|---|---|
| `application/content/CreateExercise.ts` | `application/content/CreateKata.ts` |
| `application/content/GetExerciseById.ts` | `application/content/GetKataById.ts` |
| `application/learning/GetCourseBySlug.ts` | `application/learning/GetScrollBySlug.ts` |
| `application/learning/GetCourseList.ts` | `application/learning/GetScrollList.ts` |
| `application/learning/GetCourseProgress.ts` | `application/learning/GetScrollProgress.ts` |
| `application/learning/TrackProgress.ts` | stays (name agnostic — internally renames `courseRepo` → `scrollRepo`) |
| `application/learning/MergeAnonymousProgress.ts` | stays |
| `application/learning/GenerateNudge.ts` | stays |
| `application/practice/GetExerciseOptions.ts` | `application/practice/GetKataOptions.ts` |
| `application/practice/StartSession.ts` | stays |
| `application/practice/GenerateSessionBody.ts` | stays |
| `application/practice/SubmitAttempt.ts` | stays |
| `application/practice/GetSession.ts` | stays |
| (new) | `application/recognition/CalculateBelt.ts` |
| (new) | `application/recognition/ListUserMilestones.ts` |

Test files follow the source file rename in lockstep.

### 3.2 Use case class renames

Every `Exercise*` class in application → `Kata*`. Every `Course*` → `Scroll*`. Internal field renames (`exerciseRepo` → `kataRepo`, `courseRepo` → `scrollRepo`).

### 3.3 New: `CalculateBelt` use case

```ts
class CalculateBelt {
  constructor(
    private sessionRepo: SessionRepositoryPort,
    private kataRepo: KataRepositoryPort,
  ) {}

  async execute(userId: UserId): Promise<BeltDTO> {
    // 1. fetch completed sessions in user history
    // 2. fetch the katas referenced by those sessions (for topic clusters)
    // 3. compute factors: completed count, distinct topic clusters,
    //    active days in trailing 30, days at current rank (from earnedAt stored on belt transition)
    // 4. determine rank by walking the threshold table from PRD-031
    // 5. return BeltDTO
  }
}
```

Pure computation — no persistence write. Belt rank is derived state.

> **Tradeoff note:** "Days at current rank" requires either persisting belt transitions (small new table) or recomputing the user's rank at every historical session, finding the first session where they crossed the threshold. For v1, recompute. If perf bites, persist transitions later. No migration debt — derivable.

### 3.4 New: `ListUserMilestones` use case

Reads from `MilestoneRepositoryPort`, returns ordered list of `MilestoneDTO`.

---

## Part 4 — Infrastructure (Day 4)

### 4.1 Repository adapter renames

| Old file | New file |
|---|---|
| `persistence/PostgresExerciseRepository.ts` | `persistence/PostgresKataRepository.ts` |
| `persistence/PostgresCourseRepository.ts` | `persistence/PostgresScrollRepository.ts` |
| `persistence/PostgresCourseProgressRepository.ts` | `persistence/PostgresScrollProgressRepository.ts` |
| (new) | `persistence/PostgresMilestoneRepository.ts` |

Class names follow file names. They implement the renamed ports from Part 2.

### 4.2 DB ↔ domain mapping (critical)

DB tables stay: `exercises`, `courses`, `user_badges`, `course_progress`, etc.

Each repository adapter is the **only place** that knows about the legacy table names. Inside `PostgresKataRepository`:

```ts
import { exercises as katasTable } from '../drizzle/schema'

// queries use katasTable; the rest of the codebase never imports 'exercises'
```

The Drizzle schema file (`persistence/drizzle/schema.ts`) is the legacy DB definition — it stays as-is (table names, column names). Repository adapters alias on import (`as katasTable`).

**Single exception:** `schema.ts` itself may keep `exercises`, `courses`, `userBadges` as the export names. The aliasing-on-import pattern keeps the rest of the codebase clean without forcing a migration.

### 4.3 Seed file renames

| Old | New |
|---|---|
| `persistence/exercises/` (directory) | `persistence/katas/` |
| `persistence/exercises/index.ts` | `persistence/katas/index.ts` |
| All 13 files inside | renamed in lockstep (e.g., `backend.ts` stays, just internal `Exercise` → `Kata`) |
| `persistence/seed.ts` | stays |
| `persistence/seed-courses.ts` | `persistence/seed-scrolls.ts` |
| `persistence/seed-courses-python.ts` | `persistence/seed-scrolls-python.ts` |
| `persistence/seed-courses-sql-deep-cuts.ts` | `persistence/seed-scrolls-sql-deep-cuts.ts` |

### 4.4 HTTP route renames

| Old file | New file | Path prefix change |
|---|---|---|
| `http/routes/admin-exercises.ts` | `http/routes/admin-katas.ts` | `/admin/exercises` → `/admin/katas` |
| `http/routes/admin-courses.ts` | `http/routes/admin-scrolls.ts` | `/admin/courses` → `/admin/scrolls` |
| `http/routes/learn.ts` | `http/routes/scrolls.ts` | `/learn` → `/scrolls` |
| `http/routes/practice.ts` | stays | internal endpoint names update (e.g., `/exercises/:id` → `/katas/:id` if any) |
| `http/routes/share.ts` | stays | `/share/course/...` → `/share/scroll/...` inside |
| `http/routes/profile.ts` | stays | belt + milestone endpoints added here |
| `http/routes/ws-handlers.ts` | stays | internal renames only |
| `http/routes/auth.ts` | stays | unaffected |
| (new) | `http/routes/belts.ts` | `GET /belts` endpoint |
| (new) | `http/routes/milestones.ts` | `GET /milestones` endpoint |

### 4.5 Event handler rename

| Old | New |
|---|---|
| `events/BadgeEventHandler.ts` | `events/MilestoneEventHandler.ts` |
| `registerBadgeHandlers()` | `registerMilestoneHandlers()` |
| `COURSE_BADGE_BY_SLUG` | `SCROLL_MILESTONE_BY_SLUG` |
| Constant values like `'COURSE_TYPESCRIPT_FUNDAMENTALS'` | stay as-is (stored in DB) |

Event handler logic stays: subscribes to `SessionCompleted` and `ScrollCompleted` (renamed from `CourseCompleted`), writes to `user_badges` table.

### 4.6 Container wiring (`infrastructure/container.ts`)

Update imports and exported variables:

| Old | New |
|---|---|
| `exerciseRepo` | `kataRepo` |
| `courseRepo` | `scrollRepo` |
| `getExerciseById` | `getKataById` |
| `getCourseBySlug` | `getScrollBySlug` |
| (new) | `calculateBelt`, `listUserMilestones`, `milestoneRepo` |

### 4.7 Router wiring (`infrastructure/http/router.ts`)

Update import paths and `app.route('/admin/courses', ...)` mounts. Old paths removed entirely (no aliases).

### 4.8 Sensei prompt update (`apps/api/src/prompts/sensei.ts`)

Moderate dojo register. Examples (lock register here, don't over-flavor):

- "evaluate the kata" instead of "evaluate the exercise"
- "the sensei notes" instead of "the sensei observes" / "the master observes"
- Keep technical verdict structure unchanged

**Calibration gate (Day 6):** before merging the prompt change, run the existing test set of 10 kata attempts through old and new prompts. If `PASS` rate drifts > ±10 points in any difficulty bucket, revert prompt changes only — routes and code rename are independent and stay.

---

## Part 5 — Belt feature wiring (Day 5)

### 5.1 Schema additions: none

Belt is computed. No new tables.

### 5.2 `/belts` API endpoint

`GET /belts` (authed) → `{ belt: BeltDTO, milestones: MilestoneDTO[] }`

Uses `CalculateBelt` + `ListUserMilestones` use cases.

### 5.3 v1 threshold values (from [PRD-031](../prd/031-belt-progression-rubric.md))

Hardcoded in `domain/recognition/belt.ts` constants — easy to revise without migrations:

```ts
const BELT_THRESHOLDS: Record<Exclude<BeltRank, 'white'>, {
  completed: number; distinctClusters: number;
  activeDays30: number; daysAtPrevRank: number;
}> = {
  yellow: { completed: 10,  distinctClusters: 2, activeDays30: 5,  daysAtPrevRank: 0   },
  green:  { completed: 40,  distinctClusters: 4, activeDays30: 10, daysAtPrevRank: 21  },
  brown:  { completed: 120, distinctClusters: 6, activeDays30: 15, daysAtPrevRank: 60  },
  black:  { completed: 300, distinctClusters: 8, activeDays30: 18, daysAtPrevRank: 120 },
}
```

### 5.4 Visibility rules (from PRD-031)

| Surface | Belt | Milestones |
|---|---|---|
| `/dashboard` | rank shown | recent ones in a strip |
| `/belts` | headline | full list |
| Sidebar avatar | colored ring matching belt | — |
| `/u/:username` | rank shown | full list |
| Share card | belt variant | — |
| `/kumite` placeholder | hidden | — |
| Active kata screen | hidden | — |

---

## Part 6 — Frontend (Day 7)

### 6.1 Page file renames

| Old | New |
|---|---|
| `pages/BadgesPage.tsx` | `pages/BeltsPage.tsx` |
| `pages/CoursePlayerPage.tsx` | `pages/ScrollPlayerPage.tsx` |
| `pages/CourseSharePage.tsx` | `pages/ScrollSharePage.tsx` |
| `pages/LearnPage.tsx` | `pages/ScrollsPage.tsx` |
| `pages/PlaygroundPage.tsx` | `pages/EngawaPage.tsx` |
| `pages/KataSelectionPage.tsx` | stays |
| `pages/KataActivePage.tsx` | stays |
| `pages/admin/AdminExercisesPage.tsx` | `pages/admin/AdminKatasPage.tsx` |
| `pages/admin/AdminNewExercisePage.tsx` | `pages/admin/AdminNewKataPage.tsx` |
| `pages/admin/AdminEditExercisePage.tsx` | `pages/admin/AdminEditKataPage.tsx` |
| `pages/admin/AdminCoursesPage.tsx` | `pages/admin/AdminScrollsPage.tsx` |
| (new) | `pages/KumitePlaceholderPage.tsx` |

### 6.2 Route changes in `apps/web/src/App.tsx`

| Old path | New path |
|---|---|
| `/kata` | `/katas` |
| `/kata/:id` | `/katas/:id` |
| `/kata/:id/eval` | `/katas/:id/eval` |
| `/kata/:id/result` | `/katas/:id/result` |
| `/learn` | `/scrolls` |
| `/learn/:slug` | `/scrolls/:slug` |
| `/playground` | `/engawa` |
| `/playground/:language` | `/engawa/:language` |
| `/badges` | `/belts` |
| `/share/course/:slug/:userId` | `/share/scroll/:slug/:userId` |
| `/admin/exercises*` | `/admin/katas*` |
| `/admin/courses` | `/admin/scrolls` |
| `/dashboard`, `/start`, `/settings`, `/history`, `/u/:username`, `/share/:id`, `/invite/:token`, `/auth/callback`, `/error`, `/terms`, `/privacy`, `/changelog`, `/open-source`, `/admin/invitations`, `/admin/errors` | unchanged |
| (new) | `/kumite` → `KumitePlaceholderPage` |
| `/leaderboard` | **deleted** — no replacement route |

### 6.3 Sidebar (`components/layout/Sidebar.tsx`)

```ts
{ to: '/dashboard', label: 'dashboard', icon: DashboardIcon },
{ to: '/start',     label: 'practice',  icon: CodeIcon },
{ to: '/scrolls',   label: 'scrolls',   icon: LearnIcon },     // was /learn
{ to: '/engawa',    label: 'engawa',    icon: TerminalIcon },  // was /playground
{ to: '/kumite',    label: 'kumite',    icon: ???           }, // new (placeholder)
{ to: '/belts',     label: 'belts',     icon: BadgesIcon },    // was /badges + leaderboard role absorbed for identity
```

Leaderboard nav entry removed. `BottomNav` same renames.

### 6.4 API client renames in `apps/web/src/lib/api*`

Endpoint URL strings updated to match Part 4.4. Type imports follow the shared rename from Part 1.

### 6.5 Component handling

| Component | Action |
|---|---|
| `components/ui/Badge.tsx` | **Stays** — visual primitive (chip/pill), not the domain Badge. Used for status pills. |
| Any `BadgeList`, `BadgeCard` showing earned items | Rename to `MilestoneList`, `MilestoneCard` |
| (new) | `BeltRing`, `BeltChip`, `BeltShareCard` — Soren-led visual |

### 6.6 `/kumite` placeholder

Single page, on-brand copy explaining what kumite will be (1v1 sparring), no signup form, link back to `/dashboard`. Mirrors visual register of dashboard so it doesn't read as a 404. Hidden from sidebar v1.0 (debatable — but the placeholder being browsable via direct URL is enough for the "reserve the language" goal without distracting from the practice loop).

> **Decision in spec:** kumite placeholder IS in sidebar with a "soon" chip, since the whole point per PRD-030 is consolidating the theme. Sidebar order: dashboard / practice / scrolls / engawa / kumite (soon) / belts.

---

## Part 7 — Documentation (Day 9)

| File | Update |
|---|---|
| `AGENTS.md` | Vocabulary references — `kata`, `scroll`, `belt`, `milestone`, `engawa`, `kumite` |
| `docs/BRANDING.md` | New glossary section with each term + one-sentence definition + on/off-brand examples |
| `docs/ARCHITECTURE.md` | Aggregate names updated |
| `README.md` | Route references; landing-page copy untouched |
| `CHANGELOG.md` | Single entry for the language pass |
| `docs/EXPERTS.md` | No change — expert vocabulary stays generic |
| `docs/adr/020-ubiquitous-language-pass.md` | **New ADR** — records the rename, no-backward-compat choice, DB-table preservation strategy, Badge→Milestone+Belt split |
| Archived sprints / archived specs | **Not edited** — historical |

---

## Part 8 — Staging smoke environment (Day 9, carry-forward from S022)

- Provision staging deploy with `LLM_ADAPTER_FORMAT=mock` + Turnstile dummy keys
- Existing `complete-kata` and `playground-anon-run` smoke specs run on every deploy (not just prod)
- Smoke specs themselves: file rename only — `playground-anon-run` → `engawa-anon-run`, internal selectors updated for new routes

---

## Definition of done (from [PRD-032](../prd/032-sprint-023-planning.md))

- [ ] All five route renames live; old routes return 404
- [ ] `grep -r "Exercise\|Course\|Badge" apps/api/src/domain apps/api/src/application` returns zero matches (excluding `schema.ts` alias imports in adapters)
- [ ] `/belts` page shows real computed belt + milestones
- [ ] `topicCluster()` test enforces all topics categorized
- [ ] Sensei calibration: verdict drift ≤ ±10 pts per difficulty bucket
- [ ] `/kumite` placeholder renders, in sidebar with "soon" chip
- [ ] `BRANDING.md` glossary published, ADR-020 written
- [ ] Staging smoke suite runs on every deploy
- [ ] Adrian completes ≥ 3 katas end-to-end over ≥ 2 days, no P0

---

## Rename traps to remember

1. **`components/ui/Badge.tsx`** is a visual primitive, NOT the domain badge. Leave the file name.
2. **DB tables** (`exercises`, `courses`, `user_badges`) stay; alias on import in repository adapters only.
3. **Milestone IDs** (`FIRST_KATA`, `POLYGLOT`, …) are stored DB strings — stay as-is.
4. **Drizzle `schema.ts`** is the only file with legacy names as exports. Everything else aliases.
5. **Calibration gate** is independent of route rename: if prompt drift exceeds ±10 pts, revert prompts only.
6. **No backward compat:** delete old route paths entirely. No 301s, no aliases, no warnings — zero users.
