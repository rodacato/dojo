interface StreamingTextProps {
  text: string
  done: boolean
  className?: string
}

export function StreamingText({ text, done, className }: StreamingTextProps) {
  const parts = parseCodeBlocks(text)

  return (
    <div className={className}>
      {parts.map((part, i) =>
        part.type === 'code' ? (
          <pre
            key={i}
            className="bg-page border border-border/40 rounded-sm p-3 my-2 overflow-x-auto text-xs font-mono text-accent/90"
          >
            <code>{part.content}</code>
          </pre>
        ) : (
          <p key={i} className="whitespace-pre-wrap">
            {part.content}
          </p>
        ),
      )}
      {!done && <span className="inline-block w-2 h-4 bg-accent ml-0.5 animate-pulse" aria-hidden />}
    </div>
  )
}

interface TextPart {
  type: 'text' | 'code'
  content: string
}

function parseCodeBlocks(text: string): TextPart[] {
  const parts: TextPart[] = []
  const regex = /```[\w]*\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'code', content: match[1]!.trimEnd() })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', content: text })
  }

  return parts
}
