# PRD-031: Belt progression rubric — what "earning a belt" means

> **Status:** advancing to spec
> **Date:** 2026-06-05
> **Decision locked:** 2026-06-05 — Option C, English colors, track marks deferred to v1.1
> **Author:** Claude (Priya + Valentina + Soren + Yemi advising; Elif on progression)

---

## Idea in one sentence

Define how a developer advances from one belt to the next, in a way that signals genuine practice depth without corrupting the sensei or rewarding farming.

---

## Why now

PRD-030 commits to renaming `/badges` → `/belts` with a real progression system. Without a rubric, `/belts` ships as reskinned badges and the rename is theater. This PRD must close before any belt code is written.

The constraint is explicit from VISION: *"No feature that softens, gamifies, or incentivizes the evaluator to be kinder than it should be."* That single sentence rules out a large class of obvious rubric designs.

---

## The hard constraint

**Sensei verdicts cannot be a direct currency for belt advancement.**

If "passing more katas earns belt points," every user has an incentive to lobby the sensei to be lenient. Every prompt iteration becomes contested. The evaluator's honesty is the product.

This means:
- Pass count is NOT a direct factor.
- Pass *rate* over a window may be — but as a quality floor, not a accelerator (see Option B).
- The factors that count must be ones the user can't manipulate by attacking the evaluator.

---

## Perspectives

### As a developer using the dojo

What I want from a belt:
- An honest summary of "how seriously I practice here." One number I can share without lying about myself.
- A progression that doesn't feel grindy. If I have to do 200 katas to get yellow, the system is rewarding endurance, not practice.
- A signal that *resists farming*. If I figure out the cheapest path to black belt, the product has failed me.

What I'd hate:
- A streak-shaped belt mechanic that makes me practice when I shouldn't (sick, busy, no head for it). VISION explicitly warns against this: *"if a user would skip practice to protect a streak, the gamification is wrong."*
- Belts that ratchet down. Losing belt rank because I took two weeks off teaches me to be afraid of the product, not loyal to it.
- A black belt I earned in week two. If it's that fast, it doesn't mean anything.

What I'd love:
- A belt that took me by surprise. I didn't earn it by chasing it — I earned it by practicing, and the system noticed.

### As the dojo administrator (creator)

I need:
- A rubric I can defend. If a friend asks "why am I still yellow?" I should have a concrete answer.
- A rubric the AI sensei does NOT participate in. The sensei evaluates kata; a separate, deterministic system advances belts.
- A rubric I can change in v2 without breaking v1 users — i.e., recalculable from existing data, not dependent on data I'm not collecting.

What I control:
- The factors and weights.
- The thresholds per belt.
- The visibility (public profile? sidebar? share card? all three?).
- The "rust" mechanic (or absence of it).

What could go wrong:
- I ship a rubric that's a black-box formula. Users can't see why they're stuck. They lose trust.
- I ship a rubric tied to sensei pass rate as accelerator. Pressure on the evaluator. Honesty corroded.
- I ship 8 belts. Most users see 3. The high belts are dead weight.

### As a content contributor (Phase 3+)

If my kata's difficulty or evaluation strictness influences someone's belt progression, my kata is suddenly load-bearing in a way it wasn't before. I should know:
- Whether my kata is belt-relevant.
- Whether sensei strictness on my kata affects belt advancement (the answer per the hard constraint: no).
- Whether the difficulty tag on my kata is rubric-affecting.

For v1 with no contributors yet: this is a placeholder. Just keep the rubric data-driven enough that we can later mark katas as "belt-counting" or "free-practice."

### As the product

VISION alignment check:

- **Process over correctness:** belts should reward *sustained practice* (process), not *batting average* (correctness). Aligned with rubric design that emphasizes time, diversity, and showing-up patterns over verdict scores.
- **The dojo doesn't babysit:** the rubric shouldn't tell you how close you are to the next belt with a progress bar. You see your current belt; you see what kind of practice advances; you don't see "78% to brown."
- **Vulnerability with humor:** belts as a shareable artifact ("white belt and proud of it" reads honest; "white belt forever" reads cringe). The rubric needs a clear-enough threshold for white → yellow so most actually-practicing developers don't feel stuck at white.
- **Sensei honesty is sacred:** rubric does not reward the sensei being lenient. Re-stated because it's the load-bearing constraint.

Phase fit: this is Phase 2 work (Scoreboard) per ROADMAP. PRD-030 schedules the route rename earlier (Phase 1 polish window), but the belt rubric and UI ship together — i.e., until this PRD is decided, `/belts` does NOT ship in PRD-030's sprint.

---

## Candidate factors

Five plausible inputs. Each evaluated for usefulness and exploitability.

| Factor | What it measures | Exploit risk | Verdict |
|---|---|---|---|
| **Completed katas (count)** | Volume of practice | Low — but reward is generic | Use as *floor*, not driver |
| **Diversity** (distinct categories / difficulties / languages touched) | Practice breadth | Low — forces stretching | Strong factor |
| **Active days** (calendar days with ≥1 kata attempt, in a window) | Consistency | Medium — encourages streak-chasing | Use *softly*, no streak counter |
| **Sustained sensei pass rate** in a recent window | Quality floor | High — pressure on evaluator | Use only as a *floor* (must be above X%), not as accumulator |
| **Time at current belt** (cooldown days) | Anti-rapid-climb | Low | Strong factor |

Combination logic candidates:
- AND-thresholds per belt (must meet all factors to advance).
- Weighted score (each factor contributes points; threshold per belt).
- Stage-gates with cooldown (you can't reach belt N+1 in less than M days at belt N, regardless of other factors).

---

## How many belts

Three plausible structures:

- **4 belts:** white → green → brown → black. Cleanest, but white → green is the only "early win" — risk of feeling like there's nothing between "just started" and "actually progressing."
- **5 belts:** white → yellow → green → brown → black. Adds an early "yellow" earnable in the first weeks — gives the friends-cohort a visible move quickly without devaluing the high belts.
- **7+ belts:** traditional karate-style. Too granular for a Phase 1–2 product. Most users will never see the high ones.

Recommend **5**.

---

## Per-track vs global

The product has multiple courses (SQL, TS, JS DOM, Python planned, Go/Rust/Ruby planned) plus free katas. Two options:

- **Global only.** One belt that summarizes total dojo practice across everything. Simple. Loses fidelity — someone with intense SQL practice and zero TS practice looks the same as someone with light practice across both.
- **Global + per-track marks.** Global belt is the headline ("Adrian — green belt"). Per-track marks shown on the profile as secondary indicators ("SQL ⚫ · TS 🟫 · Go 🟢"). The share card shows the global belt; the dashboard shows both.

Recommend **global + per-track marks (read-only signal, not advancement currency)**. Per-track marks derived from the same factor logic, computed per-track. v1 can ship global-only and add track marks later — both are derivable from the existing data.

---

## Rust / decay

Does inactivity affect rank?

- **Lossy (decay):** belt downgrades after N days of inactivity. *Argument against:* punishes legitimate time off, weaponizes the product. *Argument for:* a black belt who hasn't practiced in 6 months isn't a black belt anymore.
- **Lossless + rust indicator:** belt stays. A visual "rust" indicator (subtle, no judgment copy) appears after N days inactive. Resets on first new attempt.
- **Lossless, no indicator:** earn it, keep it, no signal of decay.

Recommend **lossless + rust indicator**. The dojo doesn't babysit (no decay), but also doesn't lie about staleness (rust visible). Rust copy must be neutral: not "you've slipped," just a faded color or a small icon.

---

## Visibility

Where does the belt appear?

- Dashboard: yes, headline visual.
- Sidebar avatar: yes, as a colored ring or tag.
- Public profile (`/u/:username`): yes.
- Share card: yes, prominent.
- Leaderboard: **no** — leaderboard already exists for ranking; belts are not a competitive surface, they are an identity surface. Mixing them re-creates the gamification corruption.
- During an active kata: **no** — the practice is the focus, the belt is not.

---

## Options

### Option A — Threshold gates per belt, deterministic, visible factors

Each belt requires meeting all factor thresholds:

| Belt | Completed | Diversity (distinct categories) | Active days (in 30) | Time at prev belt | Pass rate floor |
|---|---|---|---|---|---|
| White | (default on signup) | — | — | — | — |
| Yellow | ≥10 | ≥2 | ≥5 | — | ≥50% |
| Green | ≥40 | ≥4 | ≥10 | ≥21d at yellow | ≥55% |
| Brown | ≥120 | ≥6 | ≥15 | ≥60d at green | ≥60% |
| Black | ≥300 | ≥8 | ≥18 | ≥120d at brown | ≥65% |

Pros: legible, defensible, "you advance when X." User can see what's missing without a progress bar.
Cons: exact numbers are guesses on day one. Almost certainly wrong for v1. Pass rate floor (even as a floor, not accumulator) still mildly couples to sensei honesty — though much less than as accumulator.
Complexity: low.

### Option B — Weighted score, hidden formula

Each factor contributes points, sum determines belt. Thresholds: 0 / 100 / 400 / 1000 / 2500.

Pros: factors blend naturally, partial credit possible.
Cons: black-box. Users will reverse-engineer it and the optimal-path problem starts immediately. Also harder to defend a transition ("why am I stuck?").
Complexity: medium.

### Option C — Threshold gates without pass-rate factor

Same as A but drop "pass rate floor" entirely. Belt is purely a function of volume + diversity + consistency + cooldown. The sensei is fully isolated from the rubric.

Pros: cleanest VISION alignment. Sensei honesty fully protected. Easiest to defend.
Cons: arguably allows farming via deliberate low-effort attempts. Mitigation: minimum-time-per-kata (already exists), and the diversity + cooldown factors make farming expensive in practice.
Complexity: low.

---

## Provisional conclusion

**Option C** — threshold gates, no pass-rate factor.

Why:
- The pass-rate-as-floor compromise in Option A still creates a faint incentive to argue with the sensei. Faint is still nonzero. VISION's constraint is absolute.
- Farming risk in C is theoretical. The cooldown ("time at previous belt") plus diversity ("distinct categories touched") make the cheap path to black belt cost months and force breadth. That's the same shape as real practice.
- Defensibility: when a friend asks "why am I still yellow?" the answer is *"you've done 8 kata across 1 category in 3 active days. Keep going."* No reference to verdict quality. No pressure on the evaluator.

v1 thresholds (provisional — recalibrate after the friends cohort produces data):

| Belt | Completed katas | Distinct categories | Active days (in trailing 30) | Cooldown at prev belt |
|---|---|---|---|---|
| White | 0 | — | — | — |
| Yellow | 10 | 2 | 5 | — |
| Green | 40 | 4 | 10 | 21 days |
| Brown | 120 | 6 | 15 | 60 days |
| Black | 300 | 8 | 18 | 120 days |

These will be wrong. The point is they're recalculable from existing data, so v2 doesn't require migrations.

Track marks (global + per-track): defer to v1.1. Ship global belt only in v1.

Rust indicator: defer to v1.1. Ship lossless, no indicator in v1.

---

## Decisions locked (2026-06-05)

| Question | Decision |
|---|---|
| Rubric shape | **Option C** — thresholds on volume + diversity + active days + cooldown; **no sensei pass-rate factor** |
| Belt count | **5** — white / yellow / green / brown / black |
| Belt naming | **English colors** (kyū terms cross the cosplay line) |
| Scope v1 | **Global belt only**; per-track marks deferred to v1.1 |
| Rust / decay | **Lossless**, no rust indicator in v1; rust indicator deferred to v1.1 |
| Diversity unit | **Topic clusters** — derived from the existing comment-section headers in [packages/shared/src/topics.ts](../../packages/shared/src/topics.ts) (Database, API design, TypeScript, …). Raw topic slugs are too granular ("Database" alone has 13 topics). Sprint adds a `topicCluster` mapping function in shared. |
| Active days timezone | **UTC** for v1 (simplicity; revisit when timezone-aware features arrive) |
| Belt visual | Soren executes in sprint — provisional direction: solid color ring on sidebar avatar + chip on profile + variant on share card |

### v1 thresholds (provisional, recalibrate after friends cohort)

| Belt | Completed katas | Distinct topic clusters | Active days (trailing 30) | Cooldown at prev belt |
|---|---|---|---|---|
| White | 0 | — | — | — |
| Yellow | 10 | 2 | 5 | — |
| Green | 40 | 4 | 10 | 21 days |
| Brown | 120 | 6 | 15 | 60 days |
| Black | 300 | 8 | 18 | 120 days |

Recalculable from existing session/attempt data — no migrations required to revise.

### Visibility

| Surface | Belt visible? |
|---|---|
| Dashboard | Yes — headline visual |
| Sidebar avatar | Yes — colored ring |
| Public profile `/u/:username` | Yes |
| Share card / OG | Yes — prominent |
| Leaderboard / `/kumite` | **No** — belts are identity, not competitive ranking |
| Active kata screen | **No** — practice is the focus |

---

## Next step

- [x] Decisions locked
- [ ] Sprint 023 plan: see [PRD-032](032-sprint-023-planning.md)
- [ ] Belt rubric merges into PRD-030's spec under a "Belts" section — ships together with the language pass
- [ ] v1.1 backlog: per-track marks, rust indicator
