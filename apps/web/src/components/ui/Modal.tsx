import { useEffect, useRef } from 'react'

interface ModalProps {
  open: boolean
  onClose?: () => void
  /** If true, clicking outside or pressing Escape won't close the modal */
  flow?: boolean
  /** Accessible name for the dialog. */
  label?: string
  children: React.ReactNode
}

export function Modal({ open, onClose, flow = false, label, children }: Readonly<ModalProps>) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    return () => previous?.focus?.()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !flow && onClose) onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, flow, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (!flow && onClose && e.target === overlayRef.current) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="bg-surface border border-border rounded-md max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto focus:outline-none"
      >
        {children}
      </div>
    </div>
  )
}
