import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmModal } from '../../components/ui/ConfirmModal'

export function useUnsavedGuard(dirty: boolean) {
  const navigate = useNavigate()
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    globalThis.addEventListener('beforeunload', warn)
    return () => globalThis.removeEventListener('beforeunload', warn)
  }, [dirty])

  function leave(to: string) {
    if (dirty) setPending(to)
    else navigate(to)
  }

  return {
    leave,
    modalProps: {
      open: pending !== null,
      onKeep: () => setPending(null),
      onDiscard: () => {
        if (pending) navigate(pending)
      },
    },
  }
}

interface UnsavedChangesModalProps {
  open: boolean
  onKeep: () => void
  onDiscard: () => void
}

export function UnsavedChangesModal({ open, onKeep, onDiscard }: Readonly<UnsavedChangesModalProps>) {
  return (
    <ConfirmModal
      open={open}
      onCancel={onKeep}
      eyebrow="Unsaved changes"
      tone="amber"
      title="Leave without saving?"
      cancelLabel="Keep editing"
      primaryVariant="destructive"
      primaryLabel="Discard changes"
      onConfirm={onDiscard}
    >
      <p>Your edits to this kata will be lost.</p>
    </ConfirmModal>
  )
}
