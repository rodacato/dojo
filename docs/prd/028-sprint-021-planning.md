# PRD-028: Sprint 021 — Stability for the friends cohort

> **Status:** advancing to spec
> **Date:** 2026-04-21
> **Author:** Lucía Navarro (S4) — panel input: Priya Menon (C1), Soren Bachmann (C6), Amara Diallo (C7), Tomás Ríos (C3), Marta Kowalczyk (C5), Yemi Okafor (C4), Hiroshi Nakamura (S1), Joel Ferreira (S3) withdrawn post-scope-clarification, Valentina Cruz (S2, situational)

---

## Scope clarification (2026-04-21)

User clarified after initial panel draft: *"yo y mis amigos seran los usuarios por almenos 2-3 meses para asegurarme de probar todo y una experiencia consistente, así que no te preocupes por el marketing, si no por que el sitio esté estable y usable."*

This reframes the sprint. It is **not** launch readiness — it is **stability readiness for a small invited cohort over a 2-3 month runway**. Marketing-adjacent concerns are explicitly out: no OG preview QA for Twitter/LinkedIn, no landing-page-for-strangers polish, no launch positioning, no market study. The target is roughly *"the creator + ~5-10 invited friends can use the product for 2-3 months without the creator having to intervene to unblock them."*

The panel discussion below was drafted before this clarification; the *findings* still hold, the *recommended scope* is tightened accordingly (see Provisional conclusion).

---

## Idea in one sentence

Take Dojo from "works for the creator" to **"stable and usable enough that 5-10 invited friends can practice for 2-3 months without the creator having to unblock them"**, by closing S020 verification loose ends plus a focused audit from the *invited-friend* perspective.

---

## Why now

The user's revised framing: *stable and usable for the creator + ~5-10 invited friends over 2-3 months. No marketing.*

Three things make this the right sprint:

1. **S020 closed with a list of known-small-but-real loose ends** that will bite within the 2-3 month runway if ignored. The retro named them: errors retention cron, Sentry dashboards/alerts, Piston runtime reprovision script, UX gaps F-4..F-6 + P-1..P-6. Most aren't user-facing in the first session, but the Piston auto-reprovision *is* (one accessory recreate silently wipes runtimes — the same class of bug that burned us in S020).
2. **S020 showed the system is quietly fragile.** Piston was crashlooping for 3 weeks because nothing was watching. Sentry was silently blocked by CSP. Errors were silently swallowed. Over 2-3 months of 5-10 active users, these "it works most of the time" bugs become "the creator is debugging every weekend." Hiroshi's exact red flag.
3. **We do not know what an invited friend actually experiences.** Every flow shipped S014-S020 has been tested by the creator, who knows the system. No audit exists from the perspective of *"my friend sent me a link and I'm trying to do my first kata on a Tuesday night."* That audit is the single highest-leverage thing we can do before the invites go out.

This sprint is intentionally **not** about Phase 2 features and **not** about launch. It is about making Phase 1 Alpha stable enough that the creator isn't pulled into every small friction point for the next 2-3 months.

---

## Perspectives — the panel debates

### Priya Menon (C1) — product strategy

> "Before we talk about ops or UX, we have to answer: who is the first user we're publishing to, and what would make them come back in 7 days? 'Publicity' is not a phase — it's an audience. If we publicize to general developer Twitter, the bar is different than if we publicize to a handful of engineers the creator already knows. The sprint answers one question at a time: first *functional*, then *friendly*, then *compelling enough to return*. Those three are not interchangeable."

### Soren Bachmann (C6) — UX/UI

> "I can give you the audit — I gave you one in S020 and we shipped 5 of 13 findings. What I need is time for a **second audit specifically on the first 30 minutes**. Not every screen; just the funnel: landing → OAuth → dashboard → pick kata → complete kata → see result → find next thing to do. That's ~8 screens, 1 day of audit, 3-5 days of fixes. The deferred F-4..F-6 and P-1..P-6 can ride along where relevant, skip where not — don't let the backlog drive the scope, let the first-30-min experience drive it."

### Amara Diallo (C7) — growth / community

> "Publicity without a come-back mechanism is a leaky bucket. Three things must be real before we post anywhere: (1) the share card has to be **good** — the user's name, the course, the verdict, the dojo brand. We have this for kata; the course version shipped in S020 but nobody has actually verified it looks right on Twitter/LinkedIn/Discord OG renderers. (2) The reminder email has to actually send — we wired Resend in S005 but I don't know if anyone has received one in production. (3) There has to be an answer to 'what next?' after the first kata. Right now a user completes a kata and is dropped on a results page with no strong nudge."

### Tomás Ríos (C3) — infra

> "The ops debt list is small and real, but none of it is user-facing on the happy path. Piston auto-provisioning is the only one I'd put on the critical path — if that container gets recycled by the host, runtimes vanish and code execution returns empty `runtimes: []` silently. Everything else (errors cron, Sentry alerts, CSP multi-region) can slide a sprint. What I *would* put on the critical path is: a synthetic check that hits `/health/piston`, `/health`, and a test kata execution every 5 minutes and alerts if any fail. We have the error reporter; we don't have a liveness watcher."

### Marta Kowalczyk (C5) — security

> "Before publicity, two things get reviewed regardless of what else ships: (1) every public endpoint's rate limit under a non-authenticated user, because the first thing a curious developer does is hit the API directly, and the second thing a malicious one does is scan it. (2) Privacy / Terms pages — legally required in several jurisdictions before collecting emails for a waitlist, and publicly-listed email addresses in the `users` table without a Privacy policy is a surface I won't sign off on. Neither is blocking; both should land this sprint."

### Yemi Okafor (C4) — sensei / LLM

> "The single fastest way to disappoint a user is an inconsistent sensei. If the evaluation is too harsh on their first kata, they leave. If it's too soft, they don't trust it. I want a **calibration pass** — ~10 kata runs across difficulty levels and types, logged, with verdict distribution measured. If `PASS` is > 80% or < 30% at a given difficulty, the prompts need adjustment. This is half a day of work, massive leverage on retention."

### Hiroshi Nakamura (S1) — testing

> "The E2E coverage has 10 tests. There are 66 web pages/components and 100+ API endpoints. Before going public, at minimum we need smoke tests for: sign-in, complete-a-kata, complete-a-course-step, view-dashboard, view-profile. Each ~30 lines of Playwright. Four of those five flows already have tests; adding the missing ones and running the suite on production (not just CI) gives an actual 'ready to show' signal."

### Joel Ferreira (S3, situational) — launch strategy

> "If this sprint is positioning for a real public launch, I'd push back on one thing: don't launch with only courses or only kata — launch with a clear narrative of **'this is the opinionated thing we believe about practice'**. The market study from S020 is still blank. Without at least 5-10 qualitative responses, the copy for the landing page / HN post / Twitter thread is guesswork. I'd say: either run the market study in-sprint (weekend effort) or consciously launch to a small cohort first. Don't try to publicize to strangers without the voice."

### Valentina Cruz (S2, situational) — content

> "3 courses, 30 steps, plus ~80 kata across types. That's enough for a user to practice 2-3 days a week for a month before repetition sets in. Enough to publicize — but know the ceiling. After 4-6 weeks of active use, the most engaged users will hit the wall. The content pipeline needs to be restarting now if publicity is imminent. Not this sprint — but the runway question matters."

### Lucía Navarro (S4) — process

> "Four people want big things. The user's ask fits at least 3 overlapping sprints of work (hardening + UX + strategic). My advice is to make this sprint explicitly a **first-30-minutes audit sprint**. The scope becomes: fix what a new user would see in their first 30 minutes of use. That's a forcing function that sorts every item — including F-4..F-6 and ops debt — by 'would a new user hit this?'. Things they wouldn't hit in 30 minutes get deferred without guilt."

---

## Tensions

- **User's framing vs. panel's scope.** The user wants "everything functional, friendly, ready." The panel sees 3 sprints of work if taken literally. Lucía's first-30-min frame is the compression function.
- **Launch readiness vs. launch strategy.** Joel's point: if we're preparing to publicize, the *what we say* and the *who we say it to* matter as much as the product polish. If publicity is imminent, market study must happen in-sprint. If publicity is a month away, it's fine to defer.
- **Content depth vs. polish.** Valentina's ceiling (~4-6 weeks of engagement at current catalog size) is real. But content work is different from polish work — mixing them in one sprint muddles the team. Recommendation: acknowledge the content runway risk, leave it for S022.
- **Fix-what-we-know vs. audit-what-we-don't.** Half the panel wants to fix the deferred UX/ops items. The other half wants the first-30-min audit that might surface new things. Combining them is expensive. Lucía's frame subordinates the known list to the new audit — fix what the audit reveals, drop what it doesn't.
- **Publicity as target date vs. readiness as condition.** The user did not give a date. The sprint can be *readiness* without a date; launching is a separate decision once readiness is verified.

---

## Options

### Option A: Wide hardening sprint (everything-everywhere)

All of it: ops debt, UX backlog, landing/privacy, new-user audit, sensei calibration, reminder email verify, synthetic health check, market study run.

- **Pros:** Maximum coverage; user's ask taken literally.
- **Cons:** 3 sprints of work in 1 box; high risk of partial delivery exactly when we're claiming "ready."
- **Verdict:** Rejected. Proven failure mode from S020 retro.

### Option B: Invited-friend audit sprint (recommended)

Scope everything by the frame "would an invited friend hit this in their first few sessions?" Items pass if yes, defer if no. Explicit parts:

1. **Invite-flow + new-user audit** (Soren, 1 day) — walkthrough the full loop as an invited friend: invite link → OAuth → dashboard → first kata → result → find something next → come back next day. Covers the invite redeem path specifically (it hasn't been exercised end-to-end since Sprint 005).
2. **Sensei calibration** (Yemi, 0.5 day) — 10 representative runs across difficulty and type, logged, verdict distribution check. If PASS is >80% or <30% at a given difficulty, the prompts need adjustment. Inconsistent sensei = immediate disappointment from friends.
3. **Smoke-test expansion** (Hiroshi, 1 day) — cover the 5 critical flows E2E (sign-in, complete-a-kata, complete-a-course-step, view-dashboard, view-profile), run against prod. These become the liveness guarantee for the 2-3 month runway.
4. **Audit-driven fixes** (whoever, 3-5 days) — whatever the audit surfaces, prioritized by "does it make a friend ping the creator?"
5. **Piston liveness + runtime reprovision** (Tomás, 1 day) — synthetic check against `/health/piston` every 5 min with alert; idempotent reprovision script so a future container recreate doesn't silently wipe runtimes again. This alone justifies the sprint.
6. **Reminder email verify + fix** (Tomás, 0.5 day) — does the Resend-wired reminder actually send? Nobody has confirmed in prod. Part of the "does the product maintain engagement" baseline.
7. **Errors retention cron** (Tomás, 0.5 day) — 30-day cleanup on the `errors` table. Small, but will matter within the 2-3 month window as the table grows.
8. **Sensei eval visibility polish** (Soren, 0.5 day — if audit surfaces it) — the evaluation stream UX had friction points flagged in S020 that may affect sustained use.

What gets **explicitly deferred**:

- Public publicity work: OG render QA on Twitter/LinkedIn/Discord, landing-page-for-strangers polish, about/press pages
- Privacy + Terms (only needed when inviting beyond friends; collect-before-needed is premature)
- Market study (no publicity → no launch copy → no market-study-as-copy-input)
- Sentry alert rules / dashboards (nice to have; the error reporter itself already captures to Postgres — the creator will see issues)
- CSP multi-region
- Activity dashboard for cohort tracking (will want this, but the 2-3 month runway can start without it — S022)
- Alpha gate metric definition (the cohort itself is the experiment — the metric is "do they come back in month 2?")
- Content depth expansion (S022+)

- **Pros:** Tight scope matched to actual usage pattern. Every item justifies itself against "would a friend bother telling me about this, or would they just not come back."
- **Cons:** Some backlog items slide a third sprint. Acceptable given the 2-3 month runway.
- **Verdict:** Primary recommendation.

### Option C: Minimal hardening + content push

Ship only the ops-debt hardening (Piston liveness + runtime reprovision + errors retention cron + reminder email verify) and spend the rest of the sprint on content — Python L2 + L3, 20 more kata.

- **Pros:** Uses Valentina's runway warning — 4-6 weeks to content ceiling. 2-3 months of 5-10 friends will hit that ceiling. Getting ahead now is leverage.
- **Cons:** Skips the UX/audit work. If the friends cohort hits friction on the *existing* content before reaching the ceiling, they leave before content depth matters.
- **Verdict:** Tempting, but premature. Audit first, then decide whether content depth matters more than breadth-polish in S022.

### Option D: Defer the sprint, invite friends now, react

Ship nothing proactively. Invite 3 friends, watch what breaks, fix as it happens.

- **Pros:** Zero speculation. Real usage data.
- **Cons:** The creator becomes the on-call. Every bug interrupts the creator's other work. The "I don't want to have to unblock them" goal contradicts this path directly.
- **Verdict:** Rejected. User explicitly ruled this out.

---

## Provisional conclusion

**Option B.**

Scope matches the user's explicit framing (stability + usability for 5-10 friends over 2-3 months). The panel's publicity-adjacent concerns (market study, Privacy/Terms, OG render, public landing polish) all move to "when publicity is actually imminent, revisit" — which is S023+ by the 2-3 month timeline.

The sprint is smaller than S020 deliberately. Closing the loose ends + a single focused audit + the two ops items that protect the runway (Piston liveness, errors retention) is ~6-8 working days — a 1.5-week sprint, not a 2-week one. Tight on purpose, so the runway starts earlier and there's budget for reactive bug-fixing during the cohort window (which the user called out as *"incluso incluir bugfixing de lo que encontremos"*).

**Sequence:**

- **Days 1-2:** Invited-friend audit (Soren) + sensei calibration (Yemi) + smoke-test expansion (Hiroshi). Findings produced in parallel.
- **Days 3-6:** Audit-driven fixes. Piston liveness monitor + reprovision script. Reminder email verify. Errors retention cron.
- **Day 7:** Full smoke pass on prod; walk the invited-friend path end-to-end as a sanity check. First invite goes out as the sprint's real validation.
- **Day 8:** Retro + close-out.

**Reactive budget during 2-3 month runway:**

This sprint does not need to catch *every* issue. Bugs surfaced by the friends cohort get triaged between sprints; the creator has the error reporter infra (S020 Part 7) to see what's happening without friends pinging. Mini-patches ship out-of-band. A "S021.5 reactive bugfix" sprint lands in ~4-6 weeks if the volume warrants it.

**Deferred list (explicitly, to S022+):**

- All publicity-adjacent work (OG render QA, public landing polish, Privacy/Terms, market study)
- Sentry alert rules / dashboards (errors already persisted to Postgres — creator sees them)
- CSP multi-region
- Activity dashboard for cohort tracking
- Alpha gate metric definition
- Content depth expansion (revisit in S022 based on runway signal from friends)
- UX gap items F-4..F-6 + P-1..P-6 unless the audit surfaces them

**Risk flag:** The "audit-driven fixes" bucket is unsized until the audit runs. If the audit surfaces >5 high-impact issues, we ship the top 3 and the rest goes to the reactive buffer.

---

## Definition of done

The sprint is complete when:

1. An invited friend (not the creator) can redeem an invite, sign up, complete a kata, complete a course step, view their dashboard, and come back the next day — **without the creator intervening** and without friction severe enough that they'd ping the creator.
2. `/health/piston` and `/health` both return `ok` under a cron-driven synthetic check; failures alert the creator.
3. A Piston container recreate does not silently wipe runtimes. The reprovision script is idempotent and documented.
4. Sensei verdict distribution on a calibration run is within [30%, 80%] PASS per difficulty level.
5. The reminder email arrives in a real inbox after a test trigger.
6. The `errors` table has a retention policy actively pruning rows older than 30 days.

Not required for done:
- Zero bugs. A *known, tracked, non-user-facing* bug is acceptable if it didn't surface in the audit or the smoke suite; it goes into the reactive buffer.
- Marketing-adjacent artifacts (Privacy, Terms, public OG renderers, landing-for-strangers polish, market study). Those belong to the sprint before actual publicity, not this one.
- Activity dashboard / Alpha gate metric. The friends cohort *is* the experiment; the signal is whether they come back in month 2.

---

## Next step

- [x] User decided scope: 2-3 month friends cohort, no publicity — Option B.
- [x] Initial cohort: creator + 1 friend (single invite dispatched end-of-sprint as sprint validation).
- [ ] Convert to spec: `docs/specs/026-sprint-021-stability.md`
- [ ] Day-1 audit walkthrough scheduled
