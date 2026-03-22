interface AccentCardProps {
  children: React.ReactNode
  className?: string
}

export function AccentCard({ children, className = '' }: AccentCardProps) {
  return (
    <div className={`border-l-[3px] border-accent bg-surface rounded-r-md p-5 ${className}`}>
      {children}
    </div>
  )
}
