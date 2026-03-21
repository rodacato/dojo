import { useState } from 'react'

interface ChipInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function ChipInput({ value, onChange, placeholder }: ChipInputProps) {
  const [input, setInput] = useState('')

  function add() {
    const trimmed = input.trim().toLowerCase()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      add()
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-surface border border-border rounded-sm focus-within:border-accent transition-colors min-h-10">
      {value.map((v) => (
        <span
          key={v}
          className="font-mono text-xs px-2 py-0.5 bg-elevated text-secondary rounded-sm flex items-center gap-1"
        >
          {v}
          <button
            onClick={() => onChange(value.filter((x) => x !== v))}
            className="text-muted hover:text-danger"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={add}
        className="bg-transparent border-none outline-none text-primary text-sm flex-1 min-w-24"
        placeholder={value.length === 0 ? placeholder : ''}
      />
    </div>
  )
}
