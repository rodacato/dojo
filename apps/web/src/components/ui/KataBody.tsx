import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function KataBody({ body }: { body: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-primary font-mono text-lg font-semibold mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-primary font-mono text-[1rem] font-semibold mt-6 mb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-secondary font-mono text-sm font-semibold mt-4 mb-2 uppercase tracking-wider">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-secondary text-sm leading-relaxed mb-4">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="text-secondary text-sm leading-relaxed mb-4 space-y-1 list-disc list-inside">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="text-secondary text-sm leading-relaxed mb-4 space-y-1 list-decimal list-inside">{children}</ol>
        ),
        li: ({ children }) => <li className="text-secondary">{children}</li>,
        code: ({ children, className }) => {
          const isBlock = className?.startsWith('language-')
          if (isBlock) {
            return (
              <code className="block bg-elevated border border-border rounded-sm p-4 font-mono text-xs text-primary leading-relaxed overflow-x-auto whitespace-pre mb-4">
                {children}
              </code>
            )
          }
          return (
            <code className="bg-elevated text-accent font-mono text-xs px-1.5 py-0.5 rounded-sm">
              {children}
            </code>
          )
        },
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-accent pl-4 my-4 text-muted text-sm italic">
            {children}
          </blockquote>
        ),
        strong: ({ children }) => (
          <strong className="text-primary font-semibold">{children}</strong>
        ),
        hr: () => <hr className="border-border my-6" />,
      }}
    >
      {body}
    </ReactMarkdown>
  )
}
