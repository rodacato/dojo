interface StatCardProps {
  value: string | number
  label: string
  color?: string
  accent?: boolean
}

export function StatCard({ value, label, color, accent }: StatCardProps) {
  return (
    <div className={`bg-surface border rounded-md p-5 text-center ${accent ? 'border-accent/20' : 'border-border'}`}>
      <div className={`font-mono text-2xl ${color ?? 'text-primary'}`}>{value}</div>
      <div className="text-muted text-xs mt-1">{label}</div>
    </div>
  )
}
