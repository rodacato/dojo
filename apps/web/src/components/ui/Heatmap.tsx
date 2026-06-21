interface HeatmapDay {
  date: string
  count: number
}

interface HeatmapProps {
  data: HeatmapDay[]
  /** Number of trailing days to render. Default 30. PublicProfilePage uses 90. */
  days?: number
}

// Activity heatmap. Uses --color-accent at varying opacity — re-themes
// automatically (indigo in Slate, vermillion in Sumi/Washi).
// DESIGN.md §Component vocabulary §Streak heatmap describes the Sumi-e
// ramp as "ink wash": neutral steps building to an accent pop. The
// opacity ramp here achieves the same effect against either palette
// without per-theme code.
export function Heatmap({ data, days = 30 }: Readonly<HeatmapProps>) {
  const map = new Map(data.map((d) => [d.date, d.count]))

  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    return d.toISOString().slice(0, 10)
  })

  return (
    <div className="flex gap-1 flex-wrap" title={`${days}-day activity`}>
      {dates.map((date) => {
        const count = map.get(date) ?? 0
        return (
          <div
            key={date}
            className={`w-3 h-3 rounded-sm ${heatmapIntensity(count)}`}
            title={`${date}: ${count} kata${count === 1 ? '' : 's'}`}
          />
        )
      })}
    </div>
  )
}

export function heatmapIntensity(count: number): string {
  if (count <= 0) return 'bg-elevated'
  if (count === 1) return 'bg-accent/20'
  if (count === 2) return 'bg-accent/45'
  if (count === 3) return 'bg-accent/70'
  return 'bg-accent'
}
