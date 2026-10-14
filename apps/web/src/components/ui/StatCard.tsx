interface StatCardProps {
  value: string | number
  label: string
  color?: string
}

export function StatCard({ value, label, color }: Readonly<StatCardProps>) {
  return (
    <div className={`bg-surface border border-border rounded-md p-5 text-center`}>
      <div className={`font-mono text-2xl ${color ?? 'text-primary'}`}>{value}</div>
      <div className="text-secondary text-xs mt-1">{label}</div>
    </div>
  )
}
