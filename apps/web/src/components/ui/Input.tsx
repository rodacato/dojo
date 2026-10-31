import { useId } from 'react'

const FIELD_CLASSES =
  'w-full bg-page border border-border rounded-sm px-3 text-primary text-[16px] leading-6 placeholder:text-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed aria-invalid:border-danger-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const LABEL_CLASSES = 'block font-medium text-base text-primary mb-2'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export function Input({ label, hint, className = '', id, ...props }: Readonly<InputProps>) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <div>
      {label && (
        <label htmlFor={fieldId} className={LABEL_CLASSES}>
          {label}
        </label>
      )}
      <input id={fieldId} className={`${FIELD_CLASSES} min-h-12 py-2.5 font-mono ${className}`} {...props} />
      {hint && <p className="paper-note mt-1.5">{hint}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

export function Textarea({ label, hint, className = '', id, ...props }: Readonly<TextareaProps>) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <div>
      {label && (
        <label htmlFor={fieldId} className={LABEL_CLASSES}>
          {label}
        </label>
      )}
      <textarea id={fieldId} className={`${FIELD_CLASSES} py-3 font-sans resize-none ${className}`} {...props} />
      {hint && <p className="paper-note mt-1.5">{hint}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
}

export function Select({ label, hint, className = '', id, children, ...props }: Readonly<SelectProps>) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <div>
      <label htmlFor={fieldId} className={LABEL_CLASSES}>
        {label}
      </label>
      <select id={fieldId} className={`${FIELD_CLASSES} min-h-12 py-2.5 font-mono cursor-pointer ${className}`} {...props}>
        {children}
      </select>
      {hint && <p className="paper-note mt-1.5">{hint}</p>}
    </div>
  )
}
