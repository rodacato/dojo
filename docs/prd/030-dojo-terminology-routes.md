# PRD-030: Dojo ubiquitous language pass — routes, brand, visual, code

> **Status:** advancing to spec
> **Date:** 2026-06-05
> **Decision locked:** 2026-06-05 — Option A (big bang, single sprint), code rename included, no backward compat
> **Author:** Claude (Kira + Lucía structure; Soren, Amara, Priya, Tomás, Darius advising)

---

## Idea in one sentence

Consolidate and expand the dojo metaphor across every product surface — routes, nav, brand voice, visual system, domain code — so the language is coherent end-to-end instead of half-committed.

---

## Why now

The product is half-committed to the metaphor. Some surfaces speak dojo (`Dojo`, `Sensei`, `Kata`). Others speak generic SaaS (`/dashboard`, `/learn`, `/playground`, `/badges`, `/leaderboard`, `Exercise` aggregate in domain code). The seam between the two reads as indecision.

Two constraints make *now* the right window:

1. **No users yet.** Phase 0. There are zero external links to break, zero share cards to regenerate, zero invitation emails referencing `/learn`. The migration cost that would normally make this a multi-quarter project is ~zero.
2. **No backward compatibility required.** Adrian's explicit instruction. We delete the old names, we don't alias them.

That removes the only legitimate argument against a big-bang rename. What remains is product work — defining what *belts* and *kumite* actually mean — not migration work.

---

## Scope — five surfaces, not just URLs

The question is not "rename five routes." It is "make the language coherent across five layers":

1. **Routes & nav** — URLs and sidebar labels.
2. **Brand voice & copy** — what the sensei says, microcopy, button labels, error messages, landing page voice.
3. **Visual identity** — belt colors as a real design token system, kumite iconography, scroll/engawa visual metaphors, OG / share cards.
4. **Domain code (ubiquitous language)** — aggregate, entity, port, repository, event names. `Exercise` → `Kata` is the obvious one. This is the most invasive layer and the highest-leverage if done.
5. **Documentation** — `AGENTS.md`, `BRANDING.md`, `ARCHITECTURE.md`, ADRs, specs, README. The vocabulary that contributors and the AI assistant inherit.

The interesting question per surface is *how committed* — full rename or partial. See *Perspectives* below.

---

## Perspectives

### As a developer using the dojo (Adrian, today; users later)

After a single pass:
- I see `katas / scrolls / engawa / kumite / belts` in the nav. First week feels novel; by week three it's just "the dojo."
- Sensei copy uses dojo verbs: *"step into the dojo,"* *"the kata begins,"* *"belt earned,"* *"a kumite challenger awaits."* The voice has more grip than generic SaaS.
- The share card I post on Twitter says *"earned brown belt — Code Review track"* not *"earned 14 badges this month."* That's signal worth sharing.

What would frustrate me:
- Cosplay language without substance. Calling something a "scroll" when it's just a multi-step lesson with no scroll-specific affordance is theater. Each term needs to do work.
- Domain code that drifts from the product language. If the UI says "kata" and the codebase says `Exercise`, every contributor (and the AI) carries a mental translation tax forever.

What I'd love:
- The metaphor *being load-bearing in product decisions*. A belt rubric forces the question "what does progression mean here?" — that's a feature, not a label.
- Sensei evaluating *honestly* in the dojo voice. The voice strengthens the brutal-honesty principle from VISION.md, not softens it.

### As the dojo administrator (creator)

New product decisions I now own, in priority order:

1. **Belt rubric.** White → yellow → green → brown → black (or whatever progression). What advances a user? Hours practiced? Kata diversity? Sensei verdict quality? Streak length? Multiple factors weighted? This is the hardest question and the most important — get this wrong and `/belts` is reskinned badges.
2. **Kumite mechanics.** 1v1 sparring. Decide: async or live, shared kata or chosen kata, sensei evaluates both attempts and picks a winner or rates separately, opt-in only, matchmaking by belt rank, abuse model.
3. **Scrolls vs. katas boundary.** Are scrolls = courses (multi-step, narrative)? Are katas = atomic exercises (single sit, single verdict)? Today `/learn` and `/kata` already separate them; the rename makes the distinction crisper, but should I tighten the contributor authoring distinction too?
4. **Engawa scope.** Engawa = transitional space between inside and outside. Today `/playground` is the anonymous-friendly entry porch. Does it stay that or become member-only when belts arrive? The metaphor invites the question.
5. **Dashboard naming.** Does `/dashboard` rename to `/dojo` (the home of your dojo) or stay neutral? `dojo` as a label collides with the brand name — confusing or perfect, depending on execution.

What could go wrong from my side:
- I rename everything, then realize I haven't designed the belt rubric, and I'm shipping a belt page that's identical to the badges page. Honesty lost.
- I introduce `Kata` aggregate in domain code as a synonym next to `Exercise`, creating a translation layer instead of replacing it. Worst of both worlds.
- Sensei voice becomes parody: too many Japanese loan-words, the developer audience reads it as cringe.

### As a content contributor (Phase 3+)

I don't exist yet, so I can't push back. But future-me wants:

- A clear vocabulary I can use when proposing a kata: what's a kata vs. a scroll, what's kumite-eligible, what's a belt-tier kata vs. a free-practice one.
- Consistent code naming so when I read `apps/api/src/domain/` I see `Kata` not `Exercise`. Otherwise I'll write Exercise in my PRs and someone will rename it in review forever.

### As the product

Does this fit VISION? Yes, on closer read.

- **"Intentional friction" (VISION.md).** Dojo language *is* friction — the user has to lean into the metaphor. That's aligned, not opposed.
- **"The dojo doesn't babysit."** Belt progression makes this concrete: there's no shortcut to brown belt. You earn it or you don't.
- **"Process over correctness."** The sensei voice — *"a brown belt would have spotted this earlier"* — is exactly the brutal-honest register the product needs.
- **"Vulnerability with humor."** Sharing "earned brown belt after embarrassing myself on three katas" reads stronger than "earned 4 badges."

Tension with VISION:
- **"Complexity is the enemy."** A rename across five layers is not low-complexity. It's worth doing once, cheap because of zero users, but it's not free.
- **"The loop comes first."** None of this *adds* to the kata → eval → analysis loop. It sharpens identity around it. That's a Phase 1 polish, not a Phase 3 unlock.

Which phase does it belong to:
- Routes + brand voice + visual: Phase 1, before friends are invited. Cheap window.
- Belt rubric + UI: Phase 2 (Scoreboard) — that phase is already about progression and gamification done right.
- Kumite feature: Phase 2 or Phase 3 — needs its own PRD.
- Domain code rename: do it in the same sprint as routes, or pay translation tax forever.

---

## Tensions

1. **Identity vs. cosplay.** Every term must earn its place by doing product work. `belts` earns it (progression). `katas` earns it (already in use). `kumite` earns it (new feature mechanic). `scrolls` and `engawa` need to either pick up a distinguishing affordance or accept that they're brand-only labels for what is functionally `/learn` and `/playground`. Adrian's call.

2. **Routes-only vs. full ubiquitous language.** Renaming `/badges` → `/belts` in routes while keeping `Badge` aggregate in domain code creates a permanent mental translation layer. DDD principle (Darius): ubiquitous language means *one* word per concept, end to end. If we're doing this, do it through the domain code.

3. **Belt rubric quality vs. ship velocity.** The temptation will be to ship belts as "tiered badges" and design the real rubric later. That's exactly the failure mode VISION.md warns about — softening the evaluator to drive retention. Either ship belts with a real rubric or don't ship belts at all.

4. **Kumite as feature vs. label.** Reserved for what it is. This PRD does NOT design the kumite feature. It only commits to: (a) `/kumite` URL is reserved for the future sparring feature, (b) no shortcut where it ships as "renamed leaderboard." If kumite isn't ready when the rest ships, `/kumite` returns 404 / "coming soon" and `/leaderboard` is *removed* (no users to protect, per the constraint).

5. **Code rename blast radius.** `Exercise` → `Kata` in the domain touches: aggregate, repository port, repository adapter, use cases, route handlers, Zod schemas in `packages/shared`, frontend types, test fixtures, seed scripts, migrations (table name? probably keep `exercises` table — DB rename is a separate cost-benefit). Estimated ~80–150 files. Not hard, just wide. Worth doing once.

6. **Sensei voice drift.** Yemi's concern: small prompt changes produce unpredictably different evaluation behaviors. If we change the sensei's `owner_role` and `owner_context` templates to use dojo verbs aggressively, we need to re-validate that the verdicts are still consistent. Don't ship voice changes without re-eval on the test set.

---

## Options

### Option A — Big bang, single push

One sprint (probably 2 weeks given the surface area):
- Route renames: `/kata → /katas`, `/learn → /scrolls`, `/playground → /engawa`, `/badges → /belts`, new `/kumite` route reserved as "coming soon" placeholder.
- Old routes deleted, no aliases.
- Sidebar labels updated.
- Brand voice pass: `BRANDING.md` updated, sensei prompt templates revised, all UI microcopy reviewed by Soren.
- Visual: belt color tokens defined, belt page redesigned around progression, kumite placeholder visual.
- Domain code rename: `Exercise → Kata` aggregate + repository + ports + use cases + shared schemas + frontend types. Table name `exercises` stays (DB migration not worth the risk for naming alone).
- Docs: `AGENTS.md`, `BRANDING.md`, `ARCHITECTURE.md`, README updated. Old ADRs/specs *not* edited — they're history.
- Belt rubric: shipped with a v1 progression (probably hours + kata diversity + streak), explicitly marked as "v1, will revise based on practice."

Pros: one coherent move. Strong narrative on the changelog. Codebase stops carrying two vocabularies.
Cons: 2 weeks. Couples voice/visual decisions with code refactor. If belt rubric v1 turns out wrong, the whole bundle smells.
Complexity: high in absolute terms, low per piece — most of it is mechanical search-replace.

### Option B — Sequenced: routes first, code second, kumite last

Sprint 1: routes + nav + brand voice + visual + belt rubric. Code stays `Exercise` internally.
Sprint 2: domain code rename `Exercise → Kata`.
Sprint 3 (future, independent): kumite feature.

Pros: smaller risk per ship. Belt rubric iterates with feedback from sprint 1 before code commits to the new vocabulary.
Cons: weeks of cognitive load carrying two vocabularies (UI says kata, code says Exercise). Adrian + AI both pay translation tax during the gap. Defeats the "no backward compat" instruction.
Complexity: medium per sprint.

### Option C — Identity-only, code untouched

Routes + nav + brand voice + visual + belt rubric. `Exercise` aggregate stays `Exercise` forever.

Pros: half the work. Lower risk.
Cons: permanent UI ↔ code translation layer. Ubiquitous language broken on purpose. Future contributors confused.
Complexity: low.

---

## Provisional conclusion

**Option A**, with one carve-out: the **kumite feature itself is excluded** from the sprint — only the route is reserved as a placeholder. Kumite gets its own PRD (mechanics, abuse model, evaluation rubric) and its own sprint.

Why A:
- The "no users, no backward compat" constraints make this the cheapest window the product will ever have.
- Sequencing (Option B) defeats the point — Adrian asked for consolidation, sequencing is the opposite of consolidating.
- Skipping code (Option C) institutionalizes a translation layer that Darius would not let pass review on a real DDD codebase.

Residual risk:
- **Belt rubric v1.** This is the single thing that can sink the whole pass. Recommendation: spend the first 2 days of the sprint on the belt rubric alone, with Soren + Priya + Valentina + Elif (cross-course progression). If the rubric isn't clear by day 2, *defer the belts rename* and ship everything else. Don't ship belts that don't mean anything.
- **Sensei voice re-eval.** Per Yemi: any sensei prompt change needs verdict-consistency validation. Budget a day for this. Hiroshi designs the contract.
- **Engawa label discoverability.** Still my weakest argument from the previous draft — and with zero users, the argument has zero weight today. Reverse it later if Phase 4 (public open) data shows activation drops on `/engawa`. Cheap to revisit.

---

## Decisions locked (2026-06-05)

| Question | Decision | Rationale |
|---|---|---|
| Option A / B / C | **A** — big bang, single sprint, no aliases | No users + no backward-compat constraint collapses the case for sequencing |
| Code rename `Exercise → Kata` | **Yes** | Ubiquitous language; one vocabulary end-to-end |
| Code rename `Course → Scroll` | **Yes** | Same logic; rename together or institutionalize translation tax |
| Belt rubric v1 | **PRD-031 Option C** — volume + diversity + active days + cooldown; no sensei pass-rate factor | Protects sensei honesty (VISION constraint) |
| Belt naming | **English colors** — white / yellow / green / brown / black | Kyū terms cross the cosplay line; colors universal |
| `/dashboard` rename | **Stay as `/dashboard`** | `/dojo` collides with the product name; `dashboard` is the one generic term that helps post-login orientation |
| `/start` (DayStart) rename | **Stay as `/start`** | "Start" is a verb that already works without translation; restraint preserves the signal of the renames that matter |
| `/kumite` in sprint | **Reserved as placeholder** — route exists, renders "coming soon" panel with brief copy on what kumite will be | Reserving the URL without lying about the feature; aligns with "consolidate the theme" goal |
| Sensei voice register | Single calibration pass during sprint (Yemi-style: verdict consistency on 10-kata test set before/after prompt revision) | Voice update is a prompt change; ship behind validation |
| Belt visual treatment | Sprint-level UX decision — Soren executes against PRD-031 thresholds | Not blocking; design happens alongside implementation |
| Badge code mapping | **Corrected:** `Badge` → `Milestone` (achievement events stay as a concept); `Belt` is a NEW value object computed on read, orthogonal to milestones. Both surface on `/belts` page (belt as headline, milestones as section). | Inventory surfaced that current `Badge` records (FIRST_KATA, POLYGLOT, COURSE_*) are milestones, not rank — conflating them would break product value. Locked in [Spec 028 Part 0](../specs/028-dojo-language-pass.md). |

## Next step

- [x] PRD locked, Option A confirmed
- [x] PRD-031 (belt rubric) confirmed — Option C
- [x] Sprint 023 plan: see [PRD-032](032-sprint-023-planning.md)
- [x] Spec: [Spec 028](../specs/028-dojo-language-pass.md) — implementation contract
- [ ] Defer to future PRD: `PRD-NNN: Kumite — 1v1 sparring feature` (independent, post-sprint-023)
