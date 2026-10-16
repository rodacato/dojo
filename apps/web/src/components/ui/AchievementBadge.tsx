interface AchievementBadgeProps {
  name: string
  description: string
  earned: boolean
  earnedAt?: string | null
  prestige?: boolean
}

export function AchievementBadge({ name, description, earned, earnedAt, prestige }: Readonly<AchievementBadgeProps>) {
  if (prestige) {
    return (
      <div
        className={`rounded-md p-6 border w-full transition-all ${
          earned
            ? 'bg-surface border-primary/40'
            : 'bg-transparent border-border border-dashed'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-mono text-lg mb-1 ${earned ? 'text-primary' : 'text-secondary'}`}>{name}</p>
            <p className={`text-sm leading-relaxed text-secondary`}>{description}</p>
          </div>
          {earned && earnedAt && (
            <p className="text-secondary text-xs font-mono shrink-0 ml-4">
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
          ? 'bg-surface border-primary/30'
          : 'bg-transparent border-border border-dashed'
      }`}
    >
      <p className={`font-mono text-sm mb-1 ${earned ? 'text-primary' : 'text-secondary'}`}>{name}</p>
      <p className={`text-sm leading-relaxed text-secondary`}>{description}</p>
      {earned && earnedAt && (
        <p className="text-secondary text-xs font-mono mt-2">{new Date(earnedAt).toLocaleDateString()}</p>
      )}
    </div>
  )
}
