# PRD-035: Recognition — a visible practice history

> **Status:** In progress under #224. Foundation (#225) and the practitioner (#226) have shipped.
> **Date:** 2026-10-19
> **Context:** [PRD-031](031-belt-progression-rubric.md), [ADR-031](../adr/031-surprise-daily-kata.md), design [#189](https://github.com/rodacato/dojo/issues/189), daily pilot [#193](https://github.com/rodacato/dojo/issues/193).
> **Visual proposal:** [recognition direction](../../design/brand/recognition.md), proposed bands in `design/flows/` (#224), D63–D66 in [DECISIONS](../../design/DECISIONS.md).

## Why now

> *"los logros que son los belts creo están mal orientados, son pobres y no dicen mucho … se siente mal como está ahorita, no me motiva ni veo qué hay que compartir"*

The creator's own practice is the trigger. Recognition should make a sustained practice visible, explain the next step, and produce something the practitioner wants to share. It must preserve the sensei's independence.

The existing ladder has long estimated gaps at one kata per day. These are modeled intervals, not observed retention data. More frequent recognition is a hypothesis to try alongside the daily pilot, not a promise that badges improve learning.

## Foundation: fix before adding recognition

Verified against the current checkout; source files own the live values.

| Defect | Source / consequence |
|---|---|
| Verdict indirectly gates rank | [session.ts](../../apps/api/src/domain/practice/session.ts) marks `needs_work` as `failed`; [PostgresSessionRepository.ts](../../apps/api/src/infrastructure/persistence/PostgresSessionRepository.ts) includes only `completed` sessions in belt history. |
| Daily content cannot reach yellow by itself | Of the 13 [micro seed katas](../../apps/api/src/infrastructure/persistence/katas/micro.ts), 11 have no recognized topic cluster; two map only to `system-design`. Yellow requires two clusters. This describes the seed, not a production database audit. |
| Black requires more clusters than exist | [belt.ts](../../apps/api/src/domain/recognition/belt.ts) requires eight; [topics.ts](../../packages/shared/src/topics.ts) defines seven. |
| Public profile contract differs | [PublicProfilePage.tsx](../../apps/web/src/pages/PublicProfilePage.tsx) reads `badges`; [profile.ts](../../apps/api/src/infrastructure/http/routes/profile.ts) sends `milestones`. |
| Activity definitions differ | Dashboard requires a final evaluation; profile heatmap includes opened sessions; milestone streak uses only `completed` sessions. |
| Catalog and award rules disagree | [BeltsPage.tsx](../../apps/web/src/pages/BeltsPage.tsx) describes ten WHITEBOARD kata for ARCHITECT; [MilestoneEventHandler.ts](../../apps/api/src/infrastructure/events/MilestoneEventHandler.ts) awards after three. Legacy DB and course badge definitions also need reconciliation. |

The milestone streak query's trailing 30-day window needs boundary coverage for a 30-day award. Unify it with the shared activity definition rather than reproducing its date arithmetic.

## What recognition means

| Surface | Honest claim | Does not establish |
|---|---|---|
| Belt and stripes | Sustained practice over time | Technical seniority or certification |
| Paths | Topics practiced on distinct days | Mastery, retention or transfer |
| Milestone collection | A concrete event in the practice history | Personal character or authority over others |

Criterion for every entry: does it recognize a useful behavior, state exactly what happened, and avoid claiming an ability that was not measured?

## One definition of eligible practice

- A submitted response with a final evaluation counts regardless of `passed`, `passed_with_notes` or `needs_work`.
- An opened or abandoned session, an empty submission, and a technical failure without a final evaluation do not count. A recovered evaluation counts once.
- Daily and Advanced both qualify. Rank receives at most one practice-day credit per calendar date; extra kata remain visible in history and do not accelerate rank.
- Paths count distinct eligible dates per cluster, not raw sessions or raw tags. Repeated practice can count on a later date; duplicate evaluations cannot.
- Use one explicit calendar boundary for daily assignment, activity, stripes and rest. V1 should retain UTC unless the daily picker is aligned to a different documented boundary in the same implementation.
- Recognition observes eligible practice; it never changes evaluation, prompts, difficulty or access to the next kata.

## P1 · Rank and the earning moment

Keep white, yellow, green, brown and black. Add four intermediate stripes within each pre-black belt; black is terminal in this version. Stripe awards and the four belt promotions are separate transitions, not "twenty rank states".

Rank is driven by credited practice days and sustained participation. Breadth is shown in Paths, not a mandatory promotion gate: today's surprise topic is chosen by the system, so the learner must not be stuck waiting for a cluster the catalog or picker never serves.

The implementation must publish a deterministic, reachable progression table. A step every one to two weeks early on is a calibration hypothesis. Exact day thresholds and any cooldowns require history simulations before release; illustrative mockups do not define them.

`/belts` shows the current belt, earned stripes, the named next step, and each remaining requirement in plain language. No opaque percentage or composite score. Describe the units as practice days; a time gate must show its earliest date.

After evaluation, show at most one compact recognition receipt below the reasoning and solution. It may appear after NEEDS WORK. It states what was earned and why, offers a secondary share action, and leaves Done as the primary exit. No modal, delay, confetti or interruption of the verdict.

## P2 · A small collection

Start with Practice and Paths. Show earned items and at most three relevant next items; keep a complete catalog available on request. Never render a wall of locked trophies.

| Category | Initial scope | Later / excluded |
|---|---|---|
| Practice | First eligible practice, credited days, a return after a break | Return is a one-time historical moment, not a repeatable absence incentive. |
| Paths | Per-cluster practice on distinct days, with up to three tiers | Names describe practice, not expertise. Coverage must be validated against real content. |
| Forms | Deferred | All current micro seed kata use REVIEW; other formats must not be required for daily progression. |
| Contributions | Deferred to contributor work | Accepted contributions can earn recognition independently of belt rank. |

Do not reward avoiding One more, rating kata, earning a favorable verdict, or repeatedly leaving and returning. Retire SENSEI_APPROVED as an earnable rule; preserve previously granted milestones with their original date and a legacy label. The other milestones are kept unchanged (2026-10-20): SENSEI_APPROVED is the only retirement, shown only to those who earned it. Historical awards must not trigger a flood of earning receipts.

## P3 · Share the earned moment

First slice: a promotion card with belt/stripe, earned date, the practice fact behind it and the instance identity. The image is a receipt for an award, not a claim of measured improvement.

Later: belt on the kata share card, profile OG, selected milestones and a README card. The README card should prioritize lifetime credited days and practiced paths; a current racha is optional and must distinguish practice from rest. Public availability and embed cache behavior need an explicit contract before implementation.

Cards use stored award facts. A later rule change must not rewrite the rank or date on an old promotion card. Example identities and counts in the design are fictional fixtures, visibly identified outside the product frame and on exported share examples.

## P4 · Identity rewards; permissions are separate

Titles chosen from earned entries and a personal seal are later identity options. Their thresholds are not decided here.

Any member may propose a kata when contribution support exists. Review and publication permissions come from operator-granted trust and contribution quality, not automatically from brown or black belt. A role may be visible on a profile, but it must not look like a belt entitlement.

## Daily rhythm and rest

Keep the chosen daily rhythm with automatic, unpurchased rest. Before shipping, specify the allowance, renewal, consecutive-absence behavior, onboarding and day boundary. A rest day can preserve a habit sequence but never creates a practice-day credit or a Paths award.

UI must distinguish actual practiced days, rest and absence. Rank never decays. A long break never blocks return or removes access. Do not publish a protected habit sequence as an unbroken count of days practiced.

## Preserve earned recognition across rule changes

Current belts are recalculated on read; current milestones are persisted. Recalculability alone does not guarantee that a changed rubric preserves rank.

Record granted promotions with their earned date, supporting fact and rule version, or provide an equivalently explicit grandfathering policy. Effective rank cannot fall below an already granted rank when thresholds, topic mappings or the catalog change. Store only the award record needed; a full event-sourcing system is not required.

Backfill must distinguish inferred historical progress from awards actually issued. A threshold revision or rollback may require a migration; "no migration needed" is not an invariant.

## Kata rating remains separate

[FeedbackSection.tsx](../../apps/web/src/components/ui/FeedbackSection.tsx) already saves each tap. Time limit and the sensei's review are visible before Done; clarity and a note sit under More feedback. D62 and the #193 trial depend on these signals.

Keep that instrument during the trial. After its decision, experiment with one optional useful/not-useful response and optional reasons. Working names Rei/pass are not approved product copy: pass is ambiguous beside a sensei verdict. No response is distinct from a negative response. Rating never grants recognition, and dissatisfaction alone never archives a kata automatically.

## Decisions accepted in this revision

| Decision | Chosen | Rejected / reconsider when |
|---|---|---|
| Q1 · Visual mode | ~~Preserve Dojo's Sumi-e identity~~ Superseded by D66: pixel practitioner (easy) + personal dojo (hard) | The Preserve ledger; it was accurate and did not motivate. |
| Q2 · Next step | Visible requirements in actual units | Surprise-only progress; revisit if practice becomes counter chasing. |
| Q3 · Rhythm | Daily, automatic rest, actual-day counts remain honest | Weekly as the primary identity; revisit only if the core practice changes. |
| Q4 · Rewards | Identity; permissions managed separately | Belt-gated proposals/review; no evidence that practice rank measures editorial trust. |
| Q5 · Rating | Preserve D62 during the pilot; try one tap afterward | Immediate replacement of the calibration instrument; revisit after #193. |
| Q6 · Favorable verdicts (2026-10-20) | Exception to P2 for the personal dojo only: its pieces may require PASSED on hard kata, because their difficulty is the point (D66). Guardrails: the sensei never sees recognition (D64), a verdict cannot be re-rolled (retry-evaluation refuses once one exists), and nothing decays. Practitioner pieces and milestones still never read the verdict. | Dojo pieces for any verdict on hard kata; it would erase the difference between the two tracks. Revisit if follow-ups start reading as arguing for a PASSED. |

Per-track belts remain rejected as the main rank. Paths retain topic breadth without forcing seven parallel ladders. Visible requirements supersede PRD-031's hidden-next-step decision when implemented. The visual rule against illustrated trophies in DESIGN.md remains valid; hanko tiers do not require retiring it.

## Delivery slices and validation

| Slice | Acceptance before the next slice |
|---|---|
| 0 · Correct the foundation | A daily-only history can progress; NEEDS WORK counts equally; abandoned sessions do not; topic mappings, contracts and one activity definition are validated. |
| 1 · Rank, receipt, promotion share | Deterministic thresholds with typical, sparse, returning and high-volume histories; duplicate/reload cannot reaward; next-step copy explains the actual gate; existing awards survive rule changes. |
| 2 · Small collection | Catalog/rule parity, keep/retire mapping, distinct-day tiers, legacy preservation and no retrospective toast flood. |
| 3 · Broader identity surfaces | README/profile/share behavior is tested and contribution permissions remain independent. |

The first slice should be used during the daily pilot before expanding the collection. Ask whether the next step is understandable, whether returning after failure or absence still feels worthwhile, and whether the earned card is something the practitioner wants to share. These are product hypotheses, not causal evidence of learning gains.

**Panel synthesis:** Soren supports visible steps and a restrained receipt; Elif keeps practice exposure separate from mastery; Priya challenges shipping the entire collection before using the first slice; Darius requires one eligibility definition and a versioned award policy. **Recommendation:** foundation, then rank/receipt/promotion card. **Risks:** counter chasing, catalog starvation and overstated competence. **Fallback:** retain honest history and granted ranks, remove incentives that distort practice, and preserve the pilot's measurement instrument.
