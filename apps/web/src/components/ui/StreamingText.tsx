interface StreamingTextProps {
  text: string
  done: boolean
  className?: string
}

export function StreamingText({ text, done, className }: StreamingTextProps) {
  return (
    <p className={`whitespace-pre-wrap ${className ?? ''}`}>
      {text}
      {!done && <span className="inline-block w-2 h-4 bg-accent ml-0.5 animate-pulse" aria-hidden />}
    </p>
  )
}
