export function CodeLine({
  number,
  code,
  selected,
  onSelect,
  disabled = false,
}: Readonly<{
  number: number
  code: string
  selected: boolean
  onSelect?: () => void
  disabled?: boolean
}>) {
  const tone = selected ? 'bg-elevated border-primary' : 'bg-page border-transparent'
  const content = (
    <>
      <span
        aria-hidden
        className={`w-8 md:w-10 shrink-0 text-center font-mono text-xs leading-6 tabular-nums ${
          selected ? 'text-primary font-bold' : 'text-secondary'
        }`}
      >
        {number}
      </span>
      <code className="flex-1 min-w-0 font-mono text-sm leading-6 text-primary whitespace-pre-wrap [overflow-wrap:anywhere] [tab-size:2]">
        {code || ' '}
      </code>
    </>
  )

  if (!onSelect) {
    return <div className={`w-full min-h-11 flex items-start gap-1 md:gap-2 py-2.5 pr-4 border-l-3 ${tone}`}>{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`Line ${number}: ${code || 'blank line'}`}
      className={`w-full min-h-11 flex items-start gap-1 md:gap-2 py-2.5 pr-4 md:pr-6 text-left border-l-3 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent disabled:opacity-65 disabled:cursor-default ${tone} ${
        selected || disabled ? '' : 'hover:bg-surface'
      }`}
    >
      {content}
    </button>
  )
}
