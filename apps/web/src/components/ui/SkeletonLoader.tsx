import type { CSSProperties } from 'react'

const SHIMMER_STYLE: CSSProperties = {
  background:
    'linear-gradient(90deg, var(--color-elevated) 0%, color-mix(in oklab, var(--color-accent) 8%, var(--color-elevated)) 50%, var(--color-elevated) 100%)',
  backgroundSize: '200% 100%',
  animation: 'var(--animate-skeleton)',
}

interface SkeletonProps {
  className?: string
  /** Disable the shimmer (e.g. inside a parent that already shimmers). */
  flat?: boolean
}

export function Skeleton({ className = '', flat = false }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`bg-elevated rounded-sm ${className}`}
      style={flat ? undefined : SHIMMER_STYLE}
    />
  )
}

export function SkeletonText({
  width = 'full',
  size = 'md',
  className = '',
}: {
  width?: 'full' | '3/4' | '2/3' | '1/2' | '1/3' | '1/4'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
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
    <div className="h-12 px-4 flex items-center gap-3 border-b border-border last:border-b-0">
      <Skeleton className="h-4 w-12 shrink-0" />
      <Skeleton className="h-4 w-16 shrink-0" />
      <Skeleton className="h-3 flex-1" />
      <Skeleton className="h-3 w-20 shrink-0" />
    </div>
  )
}

/** Wraps N list rows in the standard bordered card. */
export function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonListRow key={i} />
      ))}
    </div>
  )
}

/** A card-shaped skeleton matching the Basics / SectionCard shape. */
export function SkeletonCard() {
  return (
    <div className="rounded-md border border-border bg-surface p-6 space-y-4">
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
    <div className="rounded-md border border-border bg-surface p-6 flex items-center justify-between gap-6">
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
