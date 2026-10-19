export function CodeLine({
  number,
  code,
  selected,
  onSelect,
}: Readonly<{
  number: number
  code: string
  selected: boolean
  onSelect: () => void
}>) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full min-h-11 flex items-center gap-1 pr-4 text-left border-l-3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent ${
        selected ? 'bg-elevated border-primary' : 'bg-page border-transparent hover:bg-surface'
      }`}
    >
      <span
        className={`w-9 shrink-0 text-center font-mono text-xs tabular-nums ${
          selected ? 'text-primary font-bold' : 'text-secondary'
        }`}
      >
        {number}
      </span>
      <code className="flex-1 min-w-0 font-mono text-[13px] text-primary whitespace-pre-wrap break-all">
        {code || ' '}
      </code>
    </button>
  )
}
