# PRD-024: Sprint 020 — Phase 1 expansion

> **Status:** advancing to spec
> **Date:** 2026-04-20
> **Author:** Lucía Navarro (S4) — panel input: Soren Bachmann (C6), Amara Diallo (C7), Priya Menon (C1), Yemi Okafor (C4), Nadia Petrov (S7), Hiroshi Nakamura (S1), Tomás Ríos (C3), Marta Kowalczyk (C5)

---

## Idea in one sentence

Expand Phase 1 across three axes — UX gap remediation, acquisition loop closure, and opening new pedagogical formats (Python course, "Ask the sensei", Code Review kata) — while finally shipping the S019 deploy-dependent carry-forwards.

---

## Why now

Sprint 019 closed the pedagogy gap (semantic slots, external references, alternative approaches, LAG/LEAD intro). The content is solid. The *distribution* and the *flows around it* are what's left before Phase 1 is real:

- **Acquisition loop is missing.** Three courses live; no share card, no completion badge beyond the existing Recognition scaffolding. Invitees can complete a course and nothing happens publicly. Amara has been asking for this since S017.
- **UX gaps are accumulating.** Between Sprints 014-019 we shipped 6 new screens/flows (course player, step editor, solution tab, iframe sandbox, share page, admin review). No one has done a pass looking at *all of them together*. Friction compounds silently.
- **Three experimental formats are PRD-ready candidates.** Python course, "Ask the sensei", and Code Review all sit in the backlog tagged "needs PRD". They're all differentiators but each has real design surface.
- **Deploy debt.** 24 commits ahead of `origin/master`. Piston prod verify and Dashboard EXPLAIN ANALYZE from S019 are blocked on this. Cannot be put off another sprint.

This sprint is explicitly larger than usual. The shape is *discovery + execution mix*: PRDs are written inside the sprint (Part 3) and gate whether the implementation pieces ship here or slide to S021.

---

## Perspectives

### As an invited friend about to finish a course

I pass the last step of SQL Deep Cuts. I see my progress at 10/10. And then — what? There's no artifact I can share, no "you completed it" card. If I want to tell someone "hey I did this", I have to screenshot the sidebar. That's friction no one will cross.

If instead I got a shareable image with my handle + course title + a badge, posting to Twitter/LinkedIn is a 2-tap action. That's the acquisition loop the project needs before opening wider.

### As the creator looking at the catalog

Three courses, 30 steps, CI gate green. But TS Fundamentals and JS DOM are still gated behind invite. The public funnel sees only SQL Deep Cuts. That's a 3x expansion of the public surface that costs nothing technically — S019 already proved the public model works.

### As a learner mid-exercise in a course

I'm stuck on a SQL exercise. The instruction has the semantic slots, the examples, the alternative approach. But I still don't know *why* my query is returning 3 rows instead of 5. There's no "Ask the sensei" here — I have to leave the course, open the sensei view, lose context, paste my code, ask, come back. That friction is exactly what keeps learners from finishing.

### As the dojo admin (Kira)

Six parts is a lot. The checkpoint structure (PRDs in Part 3 gate Part 4) is the mitigation — if any PRD reveals real complexity, we ship its PRD only and defer the implementation. The non-negotiables are UX audit + acquisition + deploy. Everything else is conditional.

### As the product

This sprint spans Phase 1 (acquisition: share card, public courses) and pokes at Phase 2 (new formats). That's fine — Phase gates are *goals*, not *walls*. Shipping a Code Review kata doesn't block the Phase 1 → 2 transition; it enriches what Phase 1 has to offer while invitees are still the only audience.

---

## Tensions

- **Scope vs. velocity.** The user asked for big scope explicitly. The checkpoint is the honest middle ground — ambitious plan with a defined de-scoping point.
- **Discovery inside a sprint.** Normally PRDs precede sprints. Here we're writing 3 PRDs *inside* the sprint. Risk: PRD scope balloons and crowds out implementation. Mitigation: PRDs are time-boxed to the first third of the sprint.
- **Polish vs. new formats.** UX audit + backfill are polish. Python / Ask the sensei / Code Review are new surface. Splitting attention is the real risk — if Part 3 reveals all three are big, we ship one, not all.
- **Phase discipline vs. opportunity.** Code Review kata is closer to Phase 2 (new exercise format). Shipping a proof-of-concept now is defensible because it's a single kata, not a platform change.
- **Deploy risk.** 24 commits haven't been deployed. The longer we wait, the larger the blast radius of the next deploy. Part 6 must happen early-sprint, not last.

---

## Options

### Option A: Ship everything this sprint (all 6 parts)

Aggressive. All 3 PRDs plus their implementations, plus audit, acquisition, backfill, deploy.

- **Pros:** Maximum throughput; aligns with user's explicit ask for larger scope.
- **Cons:** High risk of partial delivery; likely that 1-2 parts bleed into S021 anyway.
- **Complexity:** Very high.

### Option B: Sprint 020 with Part-3 checkpoint (recommended)

Open with full scope. After PRDs land (Part 3), re-scope Part 4 based on what they reveal. De-scope publicly, not silently.

- **Pros:** Ambitious but with an explicit escape hatch; honest about reality; sprint retro will have clear "what we deferred and why".
- **Cons:** Mid-sprint re-planning adds overhead; requires discipline to actually de-scope when needed.
- **Complexity:** High but managed.

### Option C: Split into two sprints (S020 + S021)

Sprint 020: UX audit, acquisition, backfill, deploy, + PRDs only.
Sprint 021: Python + Ask the sensei + Code Review implementations.

- **Pros:** Lowest risk; each sprint is well-scoped.
- **Cons:** User explicitly asked for a larger scope; splits what they wanted together.
- **Complexity:** Medium.

---

## Provisional conclusion

**Option B — Sprint 020 with Part-3 checkpoint.**

The user authorized large scope with eyes open. The checkpoint is what keeps this from being a death march. If all 3 PRDs reveal clean scope, we ship everything. If one or more are big, we ship their PRD + defer implementation to S021 — that's still a win because S021 opens with PRDs already done.

**Sequencing note:** Part 6 (deploy) should run in parallel with Part 1 (UX audit) — deploy is low-risk work that unblocks S019 carry-forwards and should not wait until end of sprint.

**Priority order for Part 4** (if checkpoint forces cuts):
1. **Ask the sensei** — direct retention improvement, touches the core LLM loop
2. **Code Review kata** — differentiator; 1 kata POC is cheap once PRD is clear
3. **Python course skeleton** — nice-to-have; full course would be S021+ anyway

---

## Next step

- [x] Convert to spec: `docs/specs/026-sprint-020-phase1-expansion.md` (written during sprint execution)
- [ ] Author PRD 025 (Python course) — Nadia S7
- [ ] Author PRD 026 (Ask the sensei) — Yemi C4
- [ ] Author PRD 027 (Code Review kata) — Priya C1 + Hiroshi S1
