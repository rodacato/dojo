# PRD-028: Sprint 021 — Launch readiness

> **Status:** exploring
> **Date:** 2026-04-21
> **Author:** Lucía Navarro (S4) — panel input: Priya Menon (C1), Soren Bachmann (C6), Amara Diallo (C7), Tomás Ríos (C3), Marta Kowalczyk (C5), Yemi Okafor (C4), Hiroshi Nakamura (S1), Joel Ferreira (S3, situational), Valentina Cruz (S2, situational)

---

## Idea in one sentence

Take Dojo from "works for the creator" to **"functional, friendly, ready for publicity — and the first wave of users won't get bored or disappointed"**, by closing the loose ends surfaced during S020 verification plus a bug/UX hunt explicitly from the *new-user* perspective.

---

## Why now

The user's framing, verbatim: *"el objetivo es tener todo funcional, friendly y listo para hacer publicidad y tener usuarios y no se aburran o desilucionen."*

Three things make this the right sprint:

1. **S020 closed with a list of known-small-but-real loose ends.** The retro named them: errors retention cron, Sentry dashboards/alerts, Piston runtime reprovision script, CSP multi-region, UX gaps F-4..F-6 + P-1..P-6. Each individually trivial; collectively they represent the "polished enough to show" gap.
2. **S020 also showed the system is quietly fragile.** Piston was crashlooping for 3 weeks because nothing was watching. Sentry was silently blocked by CSP. The `throw` verification trap in Chrome DevTools. These are "it works most of the time" — Hiroshi's exact red flag.
3. **We do not know what a new user actually experiences.** Every flow shipped in S014-S020 has been tested by the creator, who knows the system. No audit exists from the perspective of *"I just arrived from a Twitter link"*. That audit is the single highest-leverage thing we can do before making noise.

This sprint is intentionally **not** about Phase 2 features. It's about making Phase 1 Alpha presentable to people who will judge quickly and silently by not coming back.

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

### Option B: First-30-minutes sprint (recommended)

Scope everything by the frame "would a new user hit this in their first 30 minutes?" Items pass if yes, defer if no. Explicit parts:

1. **New-user audit** (Soren, 1 day) — walkthrough as if coming from a cold link
2. **Sensei calibration** (Yemi, 0.5 day) — 10 representative runs, verdict distribution check
3. **Smoke-test expansion** (Hiroshi, 1 day) — cover the 5 critical flows E2E, run against prod
4. **Audit-driven fixes** (whoever, 3-5 days) — whatever the audit surfaces
5. **Piston liveness + runtime reprovision** (Tomás, 1 day) — only ops item that's first-30-min-relevant
6. **Privacy + Terms pages** (Marta + Priya, 1 day) — required before publicity regardless of audit
7. **Reminder email verify + fix** (Tomás + Amara, 0.5 day) — does it actually send
8. **Share card QA** (Amara + Soren, 0.5 day) — render checks on Twitter/LinkedIn/Discord

What gets **explicitly deferred**:

- F-4..F-6 and P-1..P-6 unless the audit names them
- Errors retention cron
- Sentry alert rules
- CSP multi-region
- Activity dashboard for alpha tracking
- Alpha gate metric definition (unblocked but not in-sprint)
- Content depth expansion (S022+)

- **Pros:** Forcing function. Polishes the exact surface a new user touches. Clear DoD ("walk the first 30 minutes, find nothing broken or confusing").
- **Cons:** Some backlog items slide again. The deferred list now has 2+ items with "was on the next sprint too."
- **Verdict:** Primary recommendation.

### Option C: Launch-readiness + market study cohort

Option B + run the market study (send to 15-30 contacts, gather responses, write up results) as Part 0 of the sprint.

- **Pros:** Market study results arrive in time for landing page copy revision. Launch copy is informed, not guessed.
- **Cons:** Market study is real work (2-3 days of outreach + analysis) and doesn't affect readiness directly — it affects *what we say* about readiness.
- **Verdict:** Conditional recommendation. Only if publicity is within 4 weeks.

### Option D: Defer publicity, sprint on content

Reframe the sprint around Valentina's point: the content runway is the real retention ceiling. Spend this sprint building 2 more courses (Python full, one more) and 30 more kata. Defer UX polish.

- **Pros:** Solves the 4-6 week engagement ceiling before it becomes a problem.
- **Cons:** Contradicts the user's stated goal. A polished 3-course product is still publishable; an unpolished 5-course product is not.
- **Verdict:** Rejected for this sprint; content runway is a S022 conversation.

---

## Provisional conclusion

**Option B with a Joel-escape-hatch for market study.**

Primary scope is the first-30-minutes audit sprint. Market study (Option C delta) lands in-sprint *if and only if* the user signals a target publicity date within 4 weeks. If the user says "publicize when ready, no date", skip the market study — Option B alone closes the readiness gap.

**Sequence:**

- **Days 1-2:** New-user audit (Soren) + sensei calibration (Yemi) + smoke-test expansion (Hiroshi) run in parallel. These three produce the *findings*.
- **Days 3-7:** Audit-driven fixes (priority by impact). Privacy/Terms + reminder email verify + share card QA happen alongside.
- **Day 8:** Piston liveness monitor + Piston runtime reprovision script.
- **Day 9:** Full smoke pass on prod; verify the audit findings are actually resolved by walking the first 30 minutes again.
- **Day 10:** Retro + close-out.

**Deferred list (explicitly, to S022+):**

- Errors retention cron, Sentry alert rules, CSP multi-region, activity dashboard, alpha gate metric, content depth expansion.

**Risk flag:** The "audit-driven fixes" bucket (Part 4) is unsized until the audit is done. If the audit surfaces >5 high-impact issues, the sprint needs a Part-3-style checkpoint (à la S020) to decide what slides.

---

## Definition of done

The sprint is complete when:

1. A fresh GitHub account can sign up, complete a kata, complete a course step, see a sensible dashboard, and share a card — **without the creator intervening** and without the user encountering anything confusing enough to write down.
2. `/health/piston` and `/health` both return `ok` under a cron-driven synthetic check; failures alert.
3. Sensei verdict distribution on a calibration run is within [30%, 80%] PASS per difficulty level.
4. Privacy and Terms pages exist, are linked from the footer, and are not generic boilerplate.
5. The reminder email arrives in the creator's inbox after a test trigger.
6. The course completion share card renders correctly on Twitter, LinkedIn, and Discord OG previews.

Not required for done:
- Zero bugs. A *known, tracked, non-user-facing* bug is acceptable if it didn't surface in the audit or the smoke suite.
- Market study complete (unless Option C delta is activated).

---

## Next step

- [ ] User decides: target publicity window (none / 2-4 wks / 4-8 wks) — determines whether Option C delta is in
- [ ] Convert to spec after scope decision
- [ ] Day-1 audit walkthrough scheduled
