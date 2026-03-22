interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export function Input({ label, hint, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm text-secondary mb-1.5 font-mono">{label}</label>
      )}
      <input
        className={`w-full bg-base border border-border rounded-sm px-3 py-2 text-primary text-sm font-mono placeholder:text-muted focus:outline-none focus:border-accent transition-colors ${className}`}
        {...props}
      />
      {hint && <p className="text-muted text-xs mt-1">{hint}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

export function Textarea({ label, hint, className = '', ...props }: TextareaProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm text-secondary mb-1.5 font-mono">{label}</label>
      )}
      <textarea
        className={`w-full bg-base border border-border rounded-sm px-3 py-2 text-primary text-sm font-sans placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none ${className}`}
        {...props}
      />
      {hint && <p className="text-muted text-xs mt-1">{hint}</p>}
    </div>
  )
}
