interface AchievementBadgeProps {
  name: string
  description: string
  earned: boolean
  earnedAt?: string | null
  prestige?: boolean
}

export function AchievementBadge({ name, description, earned, earnedAt, prestige }: AchievementBadgeProps) {
  if (prestige) {
    return (
      <div
        className={`rounded-md p-6 border w-full transition-all ${
          earned
            ? 'bg-surface border-accent/40 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
            : 'bg-surface/50 border-border/20 opacity-40'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-mono text-lg mb-1 ${earned ? 'text-primary' : 'text-muted'}`}>{name}</p>
            <p className={`text-sm leading-relaxed ${earned ? 'text-secondary' : 'text-muted/60'}`}>{description}</p>
          </div>
          {earned && earnedAt && (
            <p className="text-muted text-xs font-mono shrink-0 ml-4">
              {new Date(earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-md p-5 border transition-all ${
        earned
          ? 'bg-surface border-accent/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
          : 'bg-surface/50 border-border/20 opacity-40'
      }`}
    >
      <p className={`font-mono text-sm mb-1 ${earned ? 'text-primary' : 'text-muted'}`}>{name}</p>
      <p className={`text-xs leading-relaxed ${earned ? 'text-secondary' : 'text-muted/60'}`}>{description}</p>
      {earned && earnedAt && (
        <p className="text-muted text-[10px] font-mono mt-2">{new Date(earnedAt).toLocaleDateString()}</p>
      )}
    </div>
  )
}
