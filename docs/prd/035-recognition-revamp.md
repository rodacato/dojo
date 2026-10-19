# PRD-035: Recognition revamp — rank, collection, rewards, share

> **Status:** Draft — proposal only, no logic. Q1–Q3 and Q5 decided; Q4 open.
> **Date:** 2026-10-19
> **Supersedes, if accepted:** parts of [PRD-031](031-belt-progression-rubric.md) (thresholds, "no progress bar"), `docs/DESIGN.md:81` (no Duolingo-style badges), brand guide §Belts & Milestones, closes D16.
> **Panel:** Soren (owner), Maya, Elif, Amara

---

## Why now

> *"los logros que son los belts creo están mal orientados, son pobres y no dicen mucho … se siente mal como está ahorita, no me motiva ni veo qué hay que compartir"*

The trigger is the creator's own practice, which the vision names as the model. A fresh reader who saw only the screens reached the same verdict independently: *"a scoreboard with decoration on top: counters with no stated target, mostly volume and attendance milestones, and a share that shows one kata instead of progress."*

## What is actually wrong

Five causes, in the order they must be fixed. The first is not design.

**1. The foundation is broken.** Anything built on top inherits these:

| Defect | Where |
|---|---|
| Black belt is unreachable: it needs 8 distinct clusters, `TopicCluster` has 7 | `belt.ts:30`, `packages/shared/src/topics.ts:90` |
| Public profile reads `profile.badges`; the API sends `milestones`. Tests mock the wrong shape | `PublicProfilePage.tsx:129`, `lib/api/types.ts:87` |
| `CONSISTENT` (30-day streak) only looks at the last 30 days of sessions | `MilestoneEventHandler.ts:306-333` |
| Three streak definitions: dashboard, public profile (counts abandoned sessions), milestones | `dashboard.ts:78`, `profile.ts:30`, milestone handler |
| Three milestone catalogs: `badge_definitions` (never read), a hardcoded web list (ARCHITECT says ten, backend counts three), and the handler | `BeltsPage.tsx:22-39`, migrations 0003/0004 |
| Profile lists course badges that no longer exist | cold read |

**2. Silence.** Since the daily kata became the core practice (ADR-031), the unit is one kata a day. At that cadence the ladder reads: yellow ≈ day 10, green ≈ day 40, brown ≈ day 120, black ≈ day 300. Most milestones are spent by day 50 (`UNDEFINED_NO_MORE`). **Between day ~50 and day ~120 the system says nothing.** That is the "no me motiva", measured.

**3. Opacity.** `/belts` shows four raw counters and never names the next belt or what it needs. The landing does (*"green belt needs 17 more katas, 1 more cluster…"*), so the product breaks the landing's promise on the first visit. The brand rule "no progress bar, the dojo doesn't babysit" is the cause.

**4. It says nothing about you.** Milestones count volume and attendance. Only `SENSEI_APPROVED` hints at skill, and `POLYGLOT` is about kata types, not languages. Nothing describes the *shape* of a developer.

**5. Nothing to share.** The only share is one kata result. No belt on the card (PRD-031 promised it), the profile OG is the generic image, no embed, and no moment of earning: milestones are written silently (`badgeUnlockToast` exists and is unused).

## What does not change

These are the product, not taste, and every option below clears them:

- **The verdict is never currency.** Nothing earns from PASSED. (`IDENTITY.md:89`, PRD-031)
- **No leaderboard, no leagues.** Removed in ADR-020; an instance is a small group, leagues of five are noise.
- **No ratchet down.** Rank never drops.
- **No streak that makes you practice badly.** *"If a user would skip practice to protect a streak, the gamification is wrong."*
- **Sumi-e identity.** Hanko, ink, typographic. No trophies, no confetti, no mascot.

## Duolingo and GitHub: what to take, what to leave

| Mechanic | Source | Verdict | Why |
|---|---|---|---|
| Frequent small steps inside a level | Duolingo levels, BJJ stripes | **Take** | Fixes cause 2 |
| Tiered achievements (×2, ×16, ×128) | GitHub achievements, Duolingo I–X | **Take** | One achievement keeps meaning something for a year instead of firing once |
| The earning moment | Duolingo | **Take, quiet** | A hanko stamped on the results page; no confetti |
| Profile showcase / pinned | GitHub | **Take** | Choose what represents you |
| Embeddable card | github-readme-stats | **Take** | The developer's own README is where a dev shares |
| Streak freeze | Duolingo | **Take as rest days, never bought** | Protects the habit without forcing junk practice |
| XP, gems, currency | Duolingo, LeetCoins | **Leave** | An economy invites farming and needs a store nobody asked for |
| Hearts / lives | Duolingo | **Leave** | Punishes failure; the brand is *"proud of showing up anyway"* |
| Leagues, leaderboards | Duolingo | **Leave** | ADR-020, group size |
| Guilt notifications | Duolingo's owl | **Leave** | The dojo doesn't babysit |

**The thesis: Duolingo's structure, dojo's ink.** Steps, categories, tiers and moments; drawn as hanko and brushwork, voiced as "earned", never "unlocked".

## The system, four pieces

The rank is the piece the other three hang off.

### P1 · Rank — belts with stripes

Keep the five belts. Each belt gets **four stripes** (real BJJ convention, no invented metaphor). Twenty steps instead of five. Same factors (completed, clusters, active days, time at rank), recalibrated so a daily practitioner earns a step roughly every one to two weeks for the first six months, and the cluster count fits the clusters that exist. Exact numbers belong to the implementation PRD, not here.

`/belts` names the next step and what it needs (decision Q2).

The belt marks themselves are #189 (Folded Belt). Stripes need a variant of that mark, so the stripe design waits for it.

### P2 · Collection — categories with tiers

Milestones become a **collection** in five categories. Each entry has up to three tiers, drawn as one, two or three hanko impressions (一 二 三) — the GitHub tier logic in dojo's ink. Names below are working names, not copy.

| Category | What it recognizes | Examples (working names) |
|---|---|---|
| **Practice** | Showing up | Active days 7 / 30 / 100 / 365; weekly goal met N weeks |
| **Paths** | Breadth across topic clusters — PRD-031's deferred *track marks* | One entry per cluster: databases 一 二 三, incident response 一 二 三 |
| **Forms** | Range across kata types | CODE, CHAT, WHITEBOARD, REVIEW, each tiered |
| **Character** | Moments, not counts | Came back the day after a NEEDS WORK; returned after a long break (the *rust* idea, framed as return, not decay); the blind daily without asking for one more, N days |
| **Dojo** | Giving back (later, Phase 3) | Kata contributed and accepted |

Character is where dojo's voice lives, and the cold read singled it out: *"Brutal Truth … has character."* Paths is what makes a profile say something about a developer: the shape, not the volume.

### P3 · Rewards — identity and privilege, no currency

| Reward | Earned at | Why it fits |
|---|---|---|
| Stripes on the avatar ring | Every stripe | Already exists as `BeltRingAvatar` |
| A title under your name, chosen from earned ones | Any tier 三 | GitHub-style showcase without a points system |
| Your own hanko seal, stamped on your share cards | Brown | The brand's own motif becomes yours |
| May propose a kata to the instance | Brown | Codewars' privilege model; the vision's success is people contributing katas back |
| May review proposed katas | Black | Senpai role; earns responsibility, not a trophy |

### P4 · Share — progress, not one kata

1. **Promotion card**: an image when a belt or stripe is earned, with the numbers behind it and the date.
2. **Profile card** embeddable in a GitHub profile README (`/u/:username/card.svg`): belt, stripes, paths, current streak.
3. **Belt on the kata share card**, as PRD-031 already promised.
4. **Profile OG** with real data instead of the generic image.
5. **The earning moment** on the results page: the hanko that was stamped this session, with a share action.

### Related, separate piece · Rating the kata

Not recognition, but it lives on the same results page and was asked for in the same breath. A rating already exists: `FeedbackSection` on `/results` asks three questions (clarity, time, evaluation fairness), each with three options, plus a note, behind a submit button. It is stored in `kata_feedback` and read only by `/admin`. On a five-minute kata answered on a phone, that is a form, not a rating.

**Question:** what is the least the person can do so that the operator learns which katas are worth keeping? Decided: **A** (see Q5).

| Option | Axis position | Right when | Costs |
|---|---|---|---|
| **A · Bow or pass** | One tap. *Rei* (a bow: this kata was worth it) or *pass*. The three existing questions open only after *pass* | Most katas are fine and the operator needs to find the bad ones | Clarity and timing data only arrive for the katas people disliked |
| **B · One row, three taps** | The three existing axes, one tap each, saved per tap, no note, no submit | Every kata needs calibration data, e.g. while the micro-kata pilot is being tuned | Three decisions after every kata; most people will skip it |

*Rei* and *pass* are working names, not copy. The bow is the dojo's own gesture at the end of practice: it carries the theme without an icon of a martial art, which the brand forbids.

**Never part of recognition.** Rating is not counted, tiered or rewarded. A collection entry for "rated N katas" would buy junk ratings.

## Panel

**Soren (UX, owns gamification):** Stripes are the right fix: they solve silence without inventing a metaphor. My worry is the collection turning into fifty grey cards. Show earned and the next three, not the whole catalog.

**Maya (game-feel, ex-Duolingo), against:** Most of Duolingo's retention is the measurement engine, not the badges. Importing the surface without the measurement is cargo cult. Keep the earning moment silent and typographic. Retire anything that would still fire if the person learned nothing.

**Elif (learning science):** Paths are the only piece tied to learning, because breadth across clusters is interleaving. Rest days are correct; spaced practice beats unbroken streaks. Never reward volume per day.

**Amara (community):** The README card is the share that works for developers. A tweet is a moment; a README card is an identity they keep. Kata privileges at brown are community design, not a reward. Do them.

**Synthesis.** Recommend: fix the foundation first, then rank with stripes plus the earning moment, then collection, then share. **Risk:** Maya's. The collection grows into decoration, so every entry has to pass "would this still fire if nothing was learned?" **Rollback:** rank and collection are computed from history (belts already are), so thresholds and catalog can be revised without a migration.

## Phasing

| Phase | Scope | Needs design? |
|---|---|---|
| 0 | Fix cause 1: reachable black, profile crash, one streak, one catalog | No: bugs, a PR on their own |
| 1 | Stripes, recalibrated thresholds, "next step" on `/belts`, earning moment | Yes: `/belts` and results via ui-pen |
| 2 | Collection: categories, tiers, migrate the ten milestones | Yes: collection grid, hanko tiers |
| 3 | Share: promotion card, README card, belt on the share card, profile OG | Yes: Satori cards |
| 4 | Rewards: titles, personal hanko, kata privileges | Waits for Phase 3 of the roadmap (contributions) |

## Decisions

Decided 2026-10-19. The rejected column is what stops each question being asked again.

| # | Question | Chosen | Rejected: what it tested · lost on · what brings it back |
|---|---|---|---|
| Q1 | Visual mode | **Preserve**: Duolingo's structure, dojo's ink | *Overhaul*, illustrated coloured badges · lost on rewriting DESIGN.md and the brand guide for one feature · a full brand redesign |
| Q2 | Does `/belts` show the next step? | **Visible**: "next stripe: 3 more katas, 1 new path" | *Surprise*, only what was earned · lost on silence being the measured cause, and the landing already promises the next step · evidence that people practice to fill the bar instead of to practice |
| Q3 | Streak shape | **Daily with automatic rest days**, never bought | *Weekly*, weeks meeting the goal · lost on the core practice being daily since ADR-031 · Advanced displacing the daily kata as the main practice |
| Q5 | Kata rating | **A · Bow or pass** | *B · One row, three taps* · lost on three decisions after a five-minute kata · the micro-kata pilot needing timing data on every kata |

**Still open:**

| # | Question | Options | Recommended |
|---|---|---|---|
| Q4 | Rewards reach | **Identity + privileges** (titles, seal, propose kata) · **Identity only** | Identity + privileges. Ties rank to the vision's success metric. Can wait until Phase 4 |

These decisions retire `DESIGN.md:81`, the brand guide's "no progress bar" line, and PRD-031's thresholds. Those edits ride with the Phase 1 PR, not this one.

### Rejected as the rank: per-track belts

A belt per topic cluster (*brown in databases, white in incident response*) was considered as P1. It loses on cadence: the daily kata picks the topic, so each of the seven tracks moves at a seventh of the speed, and silence gets worse, not better. It survives as the **Paths** category in P2. It would come back as the rank if Advanced (chosen topics) became the main practice.
