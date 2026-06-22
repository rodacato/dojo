import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const H1: Components['h1'] = ({ children }) => (
  <h1 className="text-primary font-mono text-lg font-semibold mb-4">{children}</h1>
)

const H2: Components['h2'] = ({ children }) => (
  <h2 className="text-primary font-mono text-[1rem] font-semibold mt-6 mb-3">{children}</h2>
)

const H3: Components['h3'] = ({ children }) => (
  <h3 className="text-secondary font-mono text-sm font-semibold mt-4 mb-2 uppercase tracking-wider">{children}</h3>
)

const P: Components['p'] = ({ children }) => (
  <p className="text-secondary text-sm leading-relaxed mb-4">{children}</p>
)

const Ul: Components['ul'] = ({ children }) => (
  <ul className="text-secondary text-sm leading-relaxed mb-4 space-y-1 list-disc list-inside">{children}</ul>
)

const Ol: Components['ol'] = ({ children }) => (
  <ol className="text-secondary text-sm leading-relaxed mb-4 space-y-1 list-decimal list-inside">{children}</ol>
)

const Li: Components['li'] = ({ children }) => <li className="text-secondary">{children}</li>

const Code: Components['code'] = ({ children, className }) => {
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
}

const Pre: Components['pre'] = ({ children }) => <>{children}</>

const Blockquote: Components['blockquote'] = ({ children }) => (
  <blockquote className="border-l-2 border-accent pl-4 my-4 text-muted text-sm italic">
    {children}
  </blockquote>
)

const Strong: Components['strong'] = ({ children }) => (
  <strong className="text-primary font-semibold">{children}</strong>
)

const Hr: Components['hr'] = () => <hr className="border-border my-6" />

const components: Components = {
  h1: H1,
  h2: H2,
  h3: H3,
  p: P,
  ul: Ul,
  ol: Ol,
  li: Li,
  code: Code,
  pre: Pre,
  blockquote: Blockquote,
  strong: Strong,
  hr: Hr,
}

export function KataBody({ body }: Readonly<{ body: string }>) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {body}
    </ReactMarkdown>
  )
}
