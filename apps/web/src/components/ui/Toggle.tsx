interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  ariaLabel?: string
  disabled?: boolean
  id?: string
}

// 32×16 pill toggle with a 12×12 indigo dot — 4px corner radius (NOT
// rounded-full per spec). The optional label is rendered inline so callers
// can drop a single `<Toggle label="..." />` into a row without juggling a
// separate `<label>` element. If you need a layout where the label is on
// the opposite side, pass only `ariaLabel` and render the label yourself.
export function Toggle({ checked, onChange, label, ariaLabel, disabled, id }: ToggleProps) {
  const button = (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? label}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-4 w-8 items-center rounded-sm border transition-colors shrink-0 ${
        checked ? 'bg-accent border-accent' : 'bg-page border-border'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        aria-hidden
        className={`absolute h-3 w-3 rounded-sm transition-transform ${
          checked ? 'translate-x-4 bg-primary' : 'translate-x-0.5 bg-muted'
        }`}
      />
    </button>
  )

  if (!label) return button

  return (
    <label className="flex items-center gap-3 cursor-pointer text-secondary text-[13px]">
      <span className="flex-1">{label}</span>
      {button}
    </label>
  )
}
