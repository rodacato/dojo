# PRD-011: Kata Feedback System — Exercise Quality Signal

> **Status:** exploring
> **Date:** 2026-03-21
> **Author:** Claude (Lucía + Priya + Darius + Valentina guiding)

---

## Idea in one sentence

A lightweight, structured mechanism for practitioners to signal feedback about exercise quality — not a star rating, but actionable signal that helps the creator improve exercises and identify which critiques are part of the exercise design versus real gaps.

---

## Why now

The seed kata library is being built (PRDs 006, 008–010). Before inviting other users in Phase 1, the creator needs a way to know:
- Is this exercise well-defined enough?
- Is the description clear or ambiguous?
- Did the evaluator feel fair?
- Should this exercise be edited, retired, or split into variations?

Without feedback data, the creator is editing exercises based on intuition alone. With it, they can make evidence-based decisions.

---

## The tension

**Two competing needs:**
1. **Signal quality:** The feedback must be structured enough to act on — free-text comments produce noise. A "was this unclear?" checkbox produces a signal.
2. **Practitioner experience:** The dojo is a practice tool, not a feedback form. Feedback must be optional, fast (<30 seconds), and not feel like homework after a hard kata.

**Resolution:** Feedback is opt-in, surfaces at the end of the Results screen, and consists of 3–4 targeted micro-questions — not a rating scale, not a text box, not a required step.

---

## What we are NOT building

- A star rating (too gameable, too generic)
- A required feedback step (adds friction to the core loop)
- Public reviews (this is Phase 0 — one user, the creator)
- A feedback-driven exercise ranking algorithm (Phase 2 or later)
- Sentiment analysis on free-text (too complex for Phase 0)

---

## What the feedback signal needs to answer

Four distinct questions, each with a different decision path:

| Question | Why it matters | What to do with it |
|---|---|---|
| Was the exercise description clear? | Ambiguous kata break the flow | Edit description |
| Was the time limit appropriate? | Too tight = rushed, too loose = unfocused | Adjust `duration` |
| Did the evaluation feel fair and relevant? | Bad evaluator persona = useless feedback | Edit `ownerContext` or `ownerRole` |
| Is there something to improve or note? | Open-ended escape valve — optional | Review + decide manually |

---

## Proposed feedback model

### Feedback structure

```typescript
// packages/shared/src/types/feedback.ts

type ClaritySignal = 'clear' | 'somewhat_unclear' | 'confusing'
type TimeSignal = 'too_short' | 'about_right' | 'too_long'
type EvaluationSignal = 'fair_and_relevant' | 'too_generic' | 'missed_the_point'

interface KataFeedback {
  id: string                    // UUID
  sessionId: string             // which session this feedback refers to
  exerciseId: string            // which exercise
  variationId: string           // which variation (evaluator persona)
  userId: string                // who submitted
  clarity: ClaritySignal | null // null = skipped
  timing: TimeSignal | null
  evaluation: EvaluationSignal | null
  note: string | null           // optional free text, max 280 chars
  submittedAt: Date
}
```

### Database table

```sql
CREATE TABLE kata_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES sessions(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  variation_id UUID NOT NULL REFERENCES variations(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  clarity     VARCHAR(20),      -- 'clear' | 'somewhat_unclear' | 'confusing' | NULL
  timing      VARCHAR(20),      -- 'too_short' | 'about_right' | 'too_long' | NULL
  evaluation  VARCHAR(30),      -- 'fair_and_relevant' | 'too_generic' | 'missed_the_point' | NULL
  note        TEXT,             -- max 280 chars, nullable
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id)            -- one feedback per session
);
```

---

## User experience

### Where it appears

End of the Results screen, after the verdict and analysis. Collapsed by default — the user must click to expand. The CTA is: **"How was this kata? (optional)"** — not "Give feedback."

### Flow

```
Results screen
  → verdict card
  → analysis + topics
  → [optional] "How was this kata?" (collapsed)
    → expand → 3 micro-questions + optional note
    → "Skip" (dismissed, not shown again for this session)
    → "Send" (submits and collapses)
```

### The 3 micro-questions UI

Each is a 3-option segmented control — no dropdowns, no checkboxes, no required fields.

**Was the description clear?**
`[ Confusing ]  [ Somewhat clear ]  [ Crystal clear ]`

**Was the time limit right?**
`[ Too tight ]  [ About right ]  [ Too loose ]`

**Did the evaluation feel fair?**
`[ Missed the point ]  [ Somewhat relevant ]  [ Spot on ]`

**Anything to add?** *(optional)*
`[ text input, max 280 chars, placeholder: "Optional — one thing you'd change or noticed" ]`

---

## Admin — exercise review

The admin view of an exercise (Admin — Edit) shows aggregated feedback:

```
Kata Feedback (12 sessions)
  Description clarity: 8 clear, 3 somewhat_unclear, 1 confusing
  Time limit:          10 about_right, 1 too_short, 1 too_long
  Evaluation:          9 fair_and_relevant, 2 too_generic, 1 missed_the_point

  Notes (3 submitted):
  - "The code snippet was hard to read in the dark theme" (2026-03-18)
  - "The 20-minute limit felt very tight for someone who wanted to explain the N+1 root cause" (2026-03-20)
  - "Would have liked a follow-up on the lazy loading distinction" (2026-03-21)
```

---

## Decision logic for the creator

When reviewing feedback, the creator uses this mental model:

| Signal | Interpretation | Action |
|---|---|---|
| >30% "confusing" on description | The kata is ambiguous, not the practitioner | Edit `description` |
| >50% "too_short" on timing | The exercise is harder than estimated | Increase `duration`, lower `difficulty` |
| >30% "missed_the_point" on evaluation | The `ownerContext` is too vague | Rewrite the evaluator rubric |
| Free-text notes mentioning a specific concept | Content gap or genuine insight | Either edit the exercise or add it to `ownerContext` as a tip |
| Free-text that IS the exercise — "I think the real issue is X" | That's just the sensei doing its job | No action needed |

The last row is important: **not all negative feedback means the exercise is broken.** A practitioner who says "I think the description should tell me what language to use" may have encountered intentional ambiguity. The creator reviews context before acting.

---

## What makes this different from a star rating

| Star rating | This system |
|---|---|
| Aggregates into a score | Produces specific, actionable signal |
| "Was this good?" | "Was this clear? Was this timed right? Was the evaluator fair?" |
| Social/public framing | Internal quality tool, creator-only |
| Hard to act on | Maps directly to an editable field |
| Can be gamed | Each question has a defined action |

---

## Perspectives

### Lucía Navarro (Product Workflow)
This is the right scope for Phase 0 — one user, one creator, internal quality signal. Resist the temptation to add a public rating before Phase 1. The feedback system should be invisible to users who don't need it and immediate for users who want to contribute. The "collapsed by default" design is correct.

### Priya Menon (Product Strategy)
The decision logic table is the most important part of this PRD — it's what prevents the creator from either ignoring feedback or over-reacting to it. A single "confusing" rating from one session means nothing. Three "confusing" ratings in a row from different sessions on the same exercise means something. Document the threshold before building the admin view.

### Darius Osei (Architecture)
The `UNIQUE(session_id)` constraint is correct — one feedback per session. The `kata_feedback` table is fully self-contained and can be added as a Phase 0 migration without touching existing tables. The aggregation queries for the admin view are simple GROUP BY on the `kata_feedback` table.

### Valentina Cruz (Content Design)
The distinction between "this is a real gap" and "that's the exercise working" is critical. A practitioner who says "the sensei didn't acknowledge my point about X" may be experiencing intentional friction — the sensei is supposed to push back. The note field needs to capture this ambiguity. Consider: a follow-up prompt in the admin view: "Is this note a content gap or expected pushback?" to help the creator triage.

---

## Implementation notes

### API endpoints

```
POST /sessions/:id/feedback    — submit feedback (once per session)
GET  /admin/exercises/:id/feedback  — aggregated feedback for admin view
```

### Rate limiting
`POST /sessions/:id/feedback` is allowed once per session (`UNIQUE(session_id)` enforces this). No separate rate limiting needed.

### Phase 0 vs. Phase 1
- **Phase 0:** feedback visible only in admin, only to the creator.
- **Phase 1:** if invited users submit feedback, the creator sees it in the same admin view — same design, more rows.
- **Never:** show feedback publicly to other practitioners or use it to rank exercises in the catalog.

---

## Open questions

| Question | Recommendation |
|---|---|
| Should feedback include the variation ID so the creator knows which evaluator persona got the "missed_the_point" signal? | Yes — `variation_id` is in the schema. Essential for debugging evaluator personas. |
| Should feedback collection be off by default and enabled via admin toggle? | No — keep it always on and always optional. A toggle adds complexity without benefit. |
| Is 280 chars enough for the note? | Yes — Twitter-length constraint forces one specific observation. Longer notes become essays. |

---

## Provisional conclusion

The system is small enough to build in Phase 0 (one new table, two new API endpoints, one collapsed UI section), specific enough to produce actionable signal, and honest enough to distinguish exercise gaps from expected friction.

**Build after the core loop is stable.** This is Phase 0 but not on the critical path — the creator can do kata without it. Add it once the first kata is completed end-to-end.

---

## Next step

- [ ] Add `kata_feedback` table to schema migration
- [ ] Add `POST /sessions/:id/feedback` endpoint (spec 009 addendum)
- [ ] Add `GET /admin/exercises/:id/feedback` to admin routes
- [ ] Add feedback section to Results screen (collapsed, opt-in)
- [ ] Add aggregated feedback to Admin — Edit Exercise screen
