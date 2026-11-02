# Kata Types: Formats, Verification and What Dojo Needs

> **Status:** Research · **Date:** 2026-11-02
> **Purpose:** Decide which exercise types dojo adds, how each is graded, and the mechanism each one needs. Informs epic [#291](https://github.com/rodacato/dojo/issues/291).

Evidence grades: **A** several meta-analyses or RCTs · **B** several controlled studies, mostly with students · **C** few, small or correlational studies · **D** practitioner practice or theory. A claim marked *inference* is reasoning no source proves.

---

## The finding

Dojo's gap is not the number of kata but the number of **types per slot**. Every 5-minute kata is a point review and every 10-minute kata is easy code. A slot with one type cannot interleave, and interleaving is one of the few levers with evidence (B, g ≈ 0.42 — [Brunmair & Richter 2019](https://doi.org/10.1037/bul0000209)).

The types that fill that gap are also the cheapest to build. They reuse the pattern `point` already validated: **a deterministic step fixes the facts, then the sensei grades a short why.**

The single change with most leverage is not a new type at all: giving the sensei a hidden reference answer and a kata-specific rubric (see [Grading](#how-the-sensei-should-grade)).

## What the evidence supports, and what it does not

- **Producing the answer unaided, with feedback after, is dojo's best-founded choice.** Practice testing and the generation effect are rated "high utility" (A — [Dunlosky et al. 2013](https://doi.org/10.1177/1529100612453266); [Adesope et al. 2017](https://doi.org/10.3102/0034654316689306), g ≈ 0.61). Unrestricted AI during practice raised practice scores 48% and cut unaided exam scores 17% ([Bastani et al. 2025, PNAS](https://doi.org/10.1073/pnas.2422633122)). The harm comes from AI as a crutch while solving, not from AI feedback afterwards — the split dojo already makes.
- **Fluency is not learning, so speed is not rewarded.** Performance during practice is an unreliable index of learning (A as a principle — [Soderstrom & Bjork 2015](https://doi.org/10.1177/1745691615569000)). The learner's "time" rating calibrates the kata; it is not a learning signal.
- **Spacing needs a scheduler, not more kata.** A concept the learner missed should come back days to weeks later with a different surface (A — [Cepeda et al. 2008](https://doi.org/10.1111/j.1467-9280.2008.02209.x); mastery learning ≈ 0.52 SD, [Kulik et al. 1990](https://doi.org/10.3102/00346543060002265)).
- **Seniority changes the support, not only the difficulty.** Worked examples help novices and hurt experts (B — [Kalyuga et al. 2003](https://doi.org/10.1207/S15326985EP3801_4)). Career ladders separate levels by scope, ambiguity and reach, not new technical skills ([Dropbox framework](https://dropbox.github.io/dbx-career-framework/); [StaffEng archetypes](https://staffeng.com/guides/staff-archetypes/)). A senior kata is less specification and more decisions the learner must name and defend.
- **One kata is a noisy signal.** Only about 25% of candidates scored consistently across interviews (C, 2016 data — [interviewing.io](https://interviewing.io/blog/technical-interview-performance-is-kind-of-arbitrary-heres-the-data)); structured interviews are the best predictor (.42 — Sackett et al. 2022, via [SIOP](https://www.siop.org/tip-article/is-cognitive-ability-the-best-predictor-of-job-performance)). Any level dojo infers must aggregate many sessions graded against a fixed rubric.
- **Not supported:** no study measures kata or daily practice in professional developers. Deliberate practice explains under 1% of performance variance in professions ([Macnamara et al. 2014](https://www.psychologicalscience.org/news/releases/becoming-an-expert-takes-more-than-practice.html), disputed by [Hambrick et al.](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4101876/)). Dojo can promise targeted practice of a sub-skill, not better job performance.

## The fifteen types

Three verification families. **Short selection or value** grades deterministically, is cheap to author and is the only family that truly works on a phone, but leans toward recognition. **Verified production** is reliable for what tests cover and poor on a phone. **LLM-graded reasoning** covers the skills that separate senior levels and is the least reliable to grade. Authoring cost and mobile fit are engineering judgement; no source compares them.

| # | Type | Trains | Time | Verification | Author cost | Phone | Evidence | Dojo needs |
|---|---|---|---|---|---|---|---|---|
| 1 | Predict the output / trace | mental model of execution | 2–5 | exact match, normalized | low | excellent | C–B | answer shape `predict` |
| 2 | Point | critical reading, finding bugs | 3–5 | line + LLM-graded why | low–med | excellent | C | exists; extend to spans and two defects |
| 3 | Parsons with distractors | code structure | 3–7 | order, several accepted | low | good | B | answer shape `order` + tap-to-build UI |
| 4 | Cloze / token bank | API and syntax recall | 2–5 | token match | low | good | C | answer shape `fill` |
| 5 | Explain in plain English | relational understanding | 5–10 | LLM with a SOLO bar | low | medium | C–B | `chat` + prompt change |
| 6 | Bug-fix, working but wrong | targeted debugging | 8–15 | hidden tests | medium | poor | D (industry) | broken starter code + tests as a gate |
| 7 | Implement / modify | writing code | 10–20 | tests in Piston | med–high | poor | B | exists (`code`) |
| 8 | Progressive levels | extending a design | 15–20+ | suite per level | high | poor | D | staged kata |
| 9 | Refactor with approval tests and a constraint | design, legacy code | 15–20+ | approval test + LLM for the constraint | low | poor | D | approval harness in Piston |
| 10 | Code review of a diff | reviewer judgement, priority | 5–20 | hidden rubric + LLM | medium | medium | D | exists (`review`); add severity |
| 11 | Log / trace / incident reading | diagnosis from evidence | 5–20 | structured pick + why | medium | medium | D | `point` over artifacts |
| 12 | Fermi estimate | quantitative systems reasoning | 2–5 | number within a log tolerance | low | excellent | none | answer shape `number` |
| 13 | SQL with a result set | queries | 5–15 | result-set comparison | medium | medium | D | ephemeral Postgres schema |
| 14 | System design | architecture, trade-offs | 20+ | LLM over a diagram | medium | poor–med | D | exists (`whiteboard`); grade per step |
| 15 | Decision / ADR / retrospective | judgement under ambiguity | 10–20 | LLM with a structural rubric | low | medium | D | `chat` + rubric |

### Notes per type

- **Predict** is the cheapest new type with the best value. Execute Program is built entirely on it: "all of our review items are code examples, so we can check them automatically" ([Execute Program](https://www.executeprogram.com/spaced-repetition)). Tracing correlates with writing in CS1, though the proposed skill hierarchy only partly replicated ([Lopez et al. 2008](https://opus.lib.uts.edu.au/handle/10453/10806); [Fowler et al. 2022](https://doi.org/10.1080/08993408.2022.2079866)). Junior traces a loop with mutation; mid predicts closures or aliasing; senior predicts async ordering, where the wrong mental model is the production bug. The snippet is fixed in the seed, like `point`'s starter code, and its expected output is computed once by running it in Piston when the seed is validated — never trusted from an author or an LLM. Normalize whitespace and the trailing newline ([SadServers documents that trap](https://docs.sadservers.com/docs/faq/)).
- **Point** needs no new type for harder versions. *Inference:* selecting a span instead of a line, and kata with two defects of different severity, train prioritization — the senior signal in review.
- **Parsons** had the same learning as writing the equivalent code, in less time (B, students — [Ericson et al. 2017](https://hg.gatech.edu/node/603172); [ITiCSE working group review](https://acris.aalto.fi/ws/portalfiles/portal/131069230/Parsons_Problems_and_Beyond_-_Systematic_Literature_Review_and_Empirical_Study_Designs_.pdf)); one classroom study found the time saving without a learning gain ([Hou & Ericson](https://par.nsf.gov/servlets/purl/10510493)). It loses value for seniors unless distractors fail on an edge (`<=` against `<`, an `await` in the wrong place). One-dimensional ordering only: indentation-based Parsons is awkward on a phone. Reference: [js-parsons](https://github.com/js-parsons/js-parsons).
- **Explain in plain English** distinguishes learners who explain purpose from those who narrate lines ([Murphy et al. 2012](https://doi.org/10.1145/2157136.2157249); [Lister et al. 2006, SOLO](https://doi.org/10.1145/1140123.1140157)). GPT-4 was more lenient than humans on line-by-line explanations ([Smith & Zilles](https://arxiv.org/pdf/2311.14903)), so without an explicit relational bar the sensei rewards narration.
- **Bug-fix, working but wrong** is how Codility grades debugging ([Codility](https://support.codility.com/hc/en-us/articles/360043827713)) and the shape of Stripe's bug-squash round (secondary sources). Levels, *inference*: junior gets a failing test pointing at the bug; mid gets a symptom and writes the reproducing test; senior gets an intermittent symptom and ranks hypotheses; staff decides rollback against forward fix.
- **Refactor with approval tests** is Emily Bache's Gilded Rose and the Samman method ([approvaltests.com](https://approvaltests.com/)). Piston checks behaviour is preserved; the sensei judges structure and the constraint, which "not all constraints can be enforced automatically" leaves to judgement.
- **Code review** can cite Google's eight dimensions as a public standard ([eng-practices](https://google.github.io/eng-practices/review/)). *Inference:* asking the reviewer for a severity per comment lets the sensei grade prioritization, not only coverage.
- **Incident reading** is the light version of Google's Wheel of Misfortune, a weekly 30–60 minute drill with a game master and no formal scoring ([SRE book ch. 28](https://sre.google/sre-book/accelerating-sre-on-call/)). Dojo can use a static artifact (log, stack trace, `EXPLAIN` plan) with a deterministic pick, like `point`. **An LLM game master during the kata conflicts with "no AI while solving"** unless it reveals only author-scripted data; that is a product decision, left open.
- **System design** practice elsewhere is graded per step (requirements → API → data model → high level → deep dive — [Hello Interview](https://www.hellointerview.com/practice)). Levels are documented by a former Meta interviewer: mid needs breadth; senior goes deep in about two places and names the limits of their own design; staff leads almost the whole interview ([Hello Interview](https://hellointerview.com/blog/the-system-design-interview-what-is-expected-at-each-level)).
- **SQL with a result set** is the only type that needs a new runtime. *Inference:* an ephemeral schema per attempt in dojo's existing Postgres (read-only role, `statement_timeout`, dropped after) is cheaper than shipping PGlite (~3 MB gzipped) to phones.
- **Decision / ADR** is the solo form of what ladders ask of staff: open-ended problems, components "difficult to misuse" ([Dropbox IC5](https://dropbox.github.io/dbx-career-framework/ic5_staff_software_engineer.html)). It needs a structural rubric: did the answer name the hard part, the rejected alternatives, the limits and the way back?

Left out on purpose: multiple choice as a main format (recall beats recognition, and good distractors are expensive — A, [Rowland 2014](https://doi.org/10.1037/a0037559)), a VM per user (SadServers boots one in about 50 s), protocol checkers that need a public server, and community review, which only works at a scale a self-hosted dojo does not have.

## Types per slot

*Inference*, from the duration ranges in the sources and phone fit. No source proves optimal times.

| Slot | Types |
|---|---|
| **5 min** (blind daily, usually on a phone) | predict, point, Parsons, Fermi, cloze, a one-screen log |
| **10 min** | explain in plain English, bug-fix with a failing test, a small review, modify, short SQL, async predict |
| **20 min** | implement, bug-fix from a symptom, refactor with a constraint, review with priorities, incident from artifacts, one design step, decision |
| **>20 min** | progressive levels, full system design — only if use justifies it |

For Choose a kata, offer different types in each set of three, and never title a kata with the technique that solves it.

## How the sensei should grade

- **A reference answer cuts judge failures** on math from 70% to 15% ([Zheng et al. 2023](https://arxiv.org/html/2306.05685v4)). GPT-4 agreed with humans 85% of the time (humans with each other: 81%), but was consistent under answer-order swaps only 65% of the time, and verbosity fooled weaker models 91% of the time.
- **A question-specific rubric** raised agreement with human graders on code from κ 0.156 to 0.646; grading one criterion per call was far harsher than humans ([Pathak et al., ICER 2025](https://arxiv.org/html/2503.23989v1)).
- LLM feedback finds some real issue but rarely all, reports false positives, and **hands over the solution even when told not to** ([Hellas et al. 2023](https://arxiv.org/abs/2306.05715v1)). Hallucinations rise when test results and code disagree ([Jacobs & Jaschke 2024](https://arxiv.org/abs/2403.09744)).
- Over a third of feedback interventions made performance worse, mostly those aimed at the person rather than the task ([Kluger & DeNisi 1996](https://doi.org/10.1037/0033-2909.119.2.254)). Effective feedback answers where am I going, how am I doing, what next ([Hattie & Timperley 2007](https://doi.org/10.3102/003465430298487)).

*Inference*, the rules that follow, for every type:

1. A hidden reference answer and a kata-specific rubric, stored server-side. Review and point kata already carry a rubric; code, chat and whiteboard do not.
2. The whole rubric in one call, with structured output.
3. Deterministic checks run first — tests, the tapped line, the predicted value — and enter the prompt as facts the sensei cannot contradict; a disagreement between code and tests is stated, not left to the model.
4. Length is ignored and padding penalized.
5. Explanations are held to a relational bar: purpose, not line narration.
6. No solution and no praise of the person: the gap and the next step.
7. A strong grading model; the 2023 biases are far worse in weak ones.
8. The second attempt is deliberate practice's "repeat with refinement", so first-attempt feedback says what to change, not the answer.

The bias figures are from 2023 models and have not been replicated on current ones. Nothing studies LLMs grading professional developers' reasoning or Mermaid diagrams.

## Mechanisms, cheapest first

*Inference*: cost against evidence and against the current catalog gap. Each becomes its own issue under epic #291 when it starts, and ships with at least one kata of its type.

| # | Mechanism | Change | Enables |
|---|---|---|---|
| 1 | Reference answer + rubric for every type, deterministic facts, shared grading rules | sensei prompt + rubric data | better grading on every existing kata |
| 2 | Answer shape `predict`, its output checked against Piston by an opt-in test | answer shape + integration test | predict in the 5-minute slot |
| 3 | The learner's level on the session | session-body and grading prompts | junior, mid and senior versions of the same kata |
| 4 | Answer shape `order` | answer shape + tap-to-build UI | Parsons |
| 5 | Broken starter code with tests as a gate | existing runtime + UI | bug-fix at 10 and 20 minutes |
| 6 | Spaced return of missed concepts with a new surface | scheduler | mastery and spacing in the daily |
| 7 | `point` over spans and artifacts | answer shape + rendering | incident and diagnosis kata |
| 8 | Severity per review comment | answer shape | senior prioritization |
| 9 | Answer shape `number` with a log tolerance | answer shape | Fermi estimates |
| 10 | Approval-test harness in Piston | existing runtime | refactor with constraints |
| 11 | Staged kata | data model + UI | progressive levels, design per step |
| 12 | Ephemeral Postgres schema per attempt | new runtime | SQL with a result set |

Not recommended: a VM per user, protocol checkers, an unscripted LLM game master, community review, and Exercism-style representers (normalize answers to reuse feedback — [Exercism](https://exercism.org/docs/building/tooling/representers)), which only pay off at volume.

## Gaps

No study of kata or daily practice in professional developers. No published leveled variants of the same debugging or review exercise; the seniority examples here are inference. No learning evidence for predict outside the tracing literature, for Fermi estimates as an exercise, or for mobile coding apps. Not verified: Codewars' beta thresholds, how pgexercises compares answers, Piston's maintenance status, Stripe's primary rubric, and the .19 figure for unstructured interviews in Sackett et al. No comparative data on authoring time per format.
