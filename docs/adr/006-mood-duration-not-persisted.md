# ADR-006: Mood and duration as transient query parameters, not persisted data

**Status:** Accepted
**Date:** 2026-03-21
**Deciders:** Darius Osei (architecture), Priya Menon (product)

---

## Context

The Day Start screen collects two inputs before the kata begins:
- **Mood:** `focused | regular | low_energy`
- **Duration:** `10 | 20 | 30 | 45` minutes

These inputs filter which exercises are shown in the Kata Selection screen. The question is whether to persist these selections to the database.

---

## Decision

**Mood and duration are query parameters passed to `GET /exercises`. They are not written to the database.**

---

## Rationale

**Persistence creates a tracking concern without a clear product benefit in Phase 0–1.**

The Day Start screen is a ritual — mood and duration reflect how the developer feels *right now*. Yesterday's mood is not useful data for tomorrow's kata selection. The selection is ephemeral by design.

**Persisting mood creates a data profile that changes the product's character.** A practice tool that tracks your mood history is subtly different from a practice tool that simply responds to your current state. The philosophy of the dojo is "show up, practice, leave" — not "we're building a model of your emotional patterns."

**The analytics trade-off is accepted.** As Darius noted: "If Phase 2 analytics need to know 'users in low_energy mood tend to pick CHAT kata,' that data won't exist." This is a deliberate choice. The product prioritizes user privacy and product simplicity over retroactive analytics capability.

---

## Implementation

```typescript
// GET /exercises route
app.get('/exercises', requireAuth, async (c) => {
  const mood = c.req.query('mood')       // 'focused' | 'regular' | 'low_energy'
  const maxDuration = c.req.query('maxDuration')  // '10' | '20' | '30' | '45'

  const filters: ExerciseFilters = {
    userId: c.var.user.id,
    maxDuration: parseInt(maxDuration ?? '30'),
    mood: mood as Mood ?? 'regular',
    excludeRecentDays: 180  // 6-month exclusion window
  }

  const exercises = await exerciseRepo.findEligible(filters)
  return c.json(exercises)
})
```

The mood and maxDuration are passed to `findEligible()` and influence which exercises are returned. They are not stored.

---

## Consequences

- **Positive:** No new DB columns or tables — the existing `exercises` schema handles this entirely
- **Positive:** Users cannot be profiled by their mood history
- **Positive:** No GDPR concern about "sensitive" mood data
- **Negative:** Phase 2 cross-session analysis cannot include mood context in pattern detection
- **Negative:** The team cannot know empirically which mood tends to correlate with better/worse performance
- **Trade-off accepted:** The analytics trade-off is knowingly accepted. If the product direction changes and mood analytics become valuable, mood can be added to the `sessions` table at that point — with a clear user-facing statement about what is collected.

---

## What the mood filter SHOULD do

From Priya Menon's feedback (PRD-005): "The filtering must be meaningful and visible enough that users understand why they got these three [exercises]."

The mood filter influences `findEligible()` in a concrete way:
- `low_energy` → bias toward EASY difficulty and shorter durations
- `focused` → include HARD difficulty and longer durations
- `regular` → no difficulty bias, filtered only by maxDuration

This ensures the Day Start friction is justified by an observable effect, not cosmetic personalization.
