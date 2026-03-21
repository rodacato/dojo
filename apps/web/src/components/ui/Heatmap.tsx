interface HeatmapDay {
  date: string
  count: number
}

interface HeatmapProps {
  data: HeatmapDay[]
}

export function Heatmap({ data }: HeatmapProps) {
  const map = new Map(data.map((d) => [d.date, d.count]))

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })

  return (
    <div className="flex gap-1" title="30-day activity">
      {days.map((date) => {
        const count = map.get(date) ?? 0
        const intensity = count === 0 ? 'bg-surface' : count === 1 ? 'bg-accent/40' : 'bg-accent'
        return (
          <div
            key={date}
            className={`w-3 h-3 rounded-sm ${intensity}`}
            title={`${date}: ${count} kata${count !== 1 ? 's' : ''}`}
          />
        )
      })}
    </div>
  )
}
