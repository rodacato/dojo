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
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.showModal()
    dialogRef.current?.focus()
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
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center bg-black/60 p-0 backdrop:bg-transparent focus:outline-none"
      onCancel={(e) => e.preventDefault()}
      onClick={(e) => {
        if (!flow && onClose && e.target === dialogRef.current) onClose()
      }}
    >
      <div className="bg-surface border border-border rounded-md max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </dialog>
  )
}
