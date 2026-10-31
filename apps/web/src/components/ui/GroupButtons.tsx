import { Choice } from './Choice'

interface GroupButtonsProps<T extends string> {
  options: Array<{ value: T; label: string }>
  value: T | null
  onChange: (value: T) => void
}

export function GroupButtons<T extends string>({ options, value, onChange }: Readonly<GroupButtonsProps<T>>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Choice key={opt.value} selected={value === opt.value} onClick={() => onChange(opt.value)}>
          {opt.label}
        </Choice>
      ))}
    </div>
  )
}
