interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: Readonly<SkeletonProps>) {
  return <div aria-hidden className={`bg-elevated rounded-sm ${className}`} />
}

export function SkeletonText({
  width = 'full',
  size = 'md',
  className = '',
}: Readonly<{
  width?: 'full' | '3/4' | '2/3' | '1/2' | '1/3' | '1/4'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}>) {
  const widthMap: Record<string, string> = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '2/3': 'w-2/3',
    '1/2': 'w-1/2',
    '1/3': 'w-1/3',
    '1/4': 'w-1/4',
  }
  const sizeMap: Record<string, string> = {
    sm: 'h-2.5',
    md: 'h-3',
    lg: 'h-4',
  }
  return <Skeleton className={`${sizeMap[size]} ${widthMap[width]} ${className}`} />
}

/** A dense list/table row skeleton — 48px tall, mirrors the History/Invitations row shape. */
export function SkeletonListRow() {
  return (
    <div className="h-12 flex items-center gap-3 border-b border-border">
      <Skeleton className="h-4 w-12 shrink-0" />
      <Skeleton className="h-4 w-16 shrink-0" />
      <Skeleton className="h-3 flex-1" />
      <Skeleton className="h-3 w-20 shrink-0" />
    </div>
  )
}

/** Stacks N list rows under a rule. */
export function SkeletonList({ rows = 6 }: Readonly<{ rows?: number }>) {
  return (
    <div className="border-t border-border">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonListRow key={i} />
      ))}
    </div>
  )
}

/** A ruled section skeleton. */
export function SkeletonCard() {
  return (
    <div className="border-t border-border py-6 space-y-4">
      <Skeleton className="h-3 w-1/4" />
      <SkeletonText size="lg" width="2/3" />
      <SkeletonText size="md" width="full" />
      <SkeletonText size="md" width="3/4" />
    </div>
  )
}

/** A hero band skeleton (eyebrow + headline + CTA) for Dashboard / Today's Kata. */
export function SkeletonHero() {
  return (
    <div className="border-y border-border py-6 flex items-center justify-between gap-6">
      <div className="space-y-3 flex-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-10 w-40 shrink-0" />
    </div>
  )
}

/** Dashboard-shaped skeleton: hero band + 2-col stat row. */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <SkeletonHero />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonList rows={5} />
    </div>
  )
}
