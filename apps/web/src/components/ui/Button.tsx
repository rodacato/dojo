import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

/**
 * Brand button primitive — caps + tracked + mono per design system.
 *
 * Variants:
 *   primary     — filled indigo, the only "shouts" variant; reserve for the page's main CTA.
 *   ghost       — transparent bg + border, the workhorse for secondary actions.
 *   subtle      — text-only, for navigation-style links inside dense surfaces.
 *   destructive — text-only red, hover paints a faint red wash; never filled red
 *                 (filled red is reserved for verdict states).
 *
 * Sizes: sm / md / lg → 28 / 36 / 44 px tall.
 *
 * For composing with react-router Link or anchor (no <button> render):
 *   <Link to="..." className={buttonClasses({ variant: 'ghost' })}>label</Link>
 *
 * Per stitch/batches/08-components-core.md SCREEN 1 — BUTTONS.
 */

export type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-primary border border-accent hover:bg-accent/90',
  ghost: 'bg-transparent text-primary border border-border hover:border-accent',
  subtle: 'bg-transparent text-secondary border border-transparent hover:text-primary',
  destructive: 'bg-transparent text-danger border border-transparent hover:bg-danger/10',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-[11px]',
  md: 'h-9 px-4 text-[13px]',
  lg: 'h-11 px-6 text-[13px]',
}

const baseClasses = [
  'inline-flex items-center justify-center gap-2',
  'font-mono uppercase tracking-wider whitespace-nowrap',
  'rounded-sm',
  'transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base focus-visible:ring-accent',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
].join(' ')

export function buttonClasses(opts: { variant?: ButtonVariant; size?: ButtonSize } = {}) {
  const { variant = 'primary', size = 'md' } = opts
  return [baseClasses, variantClasses[variant], sizeClasses[size]].join(' ')
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, disabled, className = '', children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClasses({ variant, size })} ${className}`}
      {...props}
    >
      {loading && (
        <span className="animate-cursor leading-none" aria-hidden>
          _
        </span>
      )}
      <span className={loading ? 'opacity-60' : undefined}>{children}</span>
    </button>
  )
})
