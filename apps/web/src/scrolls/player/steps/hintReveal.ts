// Progressive hint reveal for kata steps. Hints escalate with failed attempts:
// tier 1 once the learner asks (or auto-opens on the first failure), tier 2
// after the second failure. This reduces frustration without surrendering the
// reference solution, which stays gated post-pass (see useSolution).

// Tier-ordered hints, falling back to the legacy single `hint` so steps authored
// before tiered hints keep working untouched.
export function resolveTieredHints(
  hints: string[] | null,
  hint: string | null,
): string[] {
  return hints ?? (hint ? [hint] : [])
}

// Which hint tiers are visible given how many times the learner has failed.
// Tier 1 is always available when the panel is open; tier 2 unlocks at 2 fails.
export function visibleHintTiers(tieredHints: string[], failCount: number): string[] {
  const tier1 = tieredHints[0]
  if (tier1 === undefined) return []
  const visible = [tier1]
  const tier2 = tieredHints[1]
  if (failCount >= 2 && tier2 !== undefined) visible.push(tier2)
  return visible
}

export const HINT_TIER_LABELS = ['hint', 'hint · closer'] as const
