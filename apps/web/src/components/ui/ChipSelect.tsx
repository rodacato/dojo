import { useState } from 'react'

interface ChipSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}

export function ChipSelect({ options, selected, onChange, placeholder }: ChipSelectProps) {
  const [query, setQuery] = useState('')

  const filtered = query ? options.filter((o) => o.includes(query) && !selected.includes(o)) : []

  function toggle(value: string) {
    onChange(
      selected.includes(value) ? selected.filter((s) => s !== value) : [...selected, value],
    )
  }

  return (
    <div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map((s) => (
            <button
              key={s}
              onClick={() => toggle(s)}
              className="font-mono text-xs px-2 py-0.5 bg-accent/10 text-accent border border-accent/30 rounded-sm hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-colors"
            >
              {s} ×
            </button>
          ))}
        </div>
      )}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="admin-input"
        placeholder={placeholder}
      />
      {filtered.length > 0 && (
        <div className="mt-1 border border-border rounded-sm bg-surface max-h-40 overflow-y-auto">
          {filtered.map((o) => (
            <button
              key={o}
              onClick={() => {
                toggle(o)
                setQuery('')
              }}
              className="w-full text-left px-3 py-1.5 text-secondary text-xs font-mono hover:bg-elevated transition-colors"
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
