interface GroupButtonsProps<T extends string> {
  options: Array<{ value: T; label: string }>
  value: T | null
  onChange: (value: T) => void
  size?: 'sm' | 'md'
}

export function GroupButtons<T extends string>({ options, value, onChange, size = 'sm' }: Readonly<GroupButtonsProps<T>>) {
  return (
    <div className="flex gap-1 bg-surface border border-border/40 rounded-md p-1 w-fit">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`font-mono rounded-sm transition-colors ${
            size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'
          } ${
            value === opt.value
              ? 'bg-elevated text-primary border border-primary'
              : 'text-secondary hover:text-primary'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
