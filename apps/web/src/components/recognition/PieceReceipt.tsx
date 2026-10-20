import { useEffect, useState } from 'react'
import { findPiece, type PieceId, type PractitionerDTO } from '@dojo/shared'
import { api } from '../../lib/api'
import { Button } from '../ui/Button'
import { PractitionerCanvas } from './PractitionerCanvas'

const BACKDROP = '#d6cab3'

interface Props {
  pieceIds: readonly PieceId[]
  needsWork: boolean
}

export function PieceReceipt({ pieceIds, needsWork }: Readonly<Props>) {
  const [practitioner, setPractitioner] = useState<PractitionerDTO | null>(null)
  const [worn, setWorn] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const pieceId = pieceIds[0]
  const piece = pieceId ? findPiece(pieceId) : undefined

  useEffect(() => {
    if (!piece) return
    let cancelled = false
    api.getPractitioner().then((res) => !cancelled && setPractitioner(res)).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [piece])

  if (!piece || !pieceId || !practitioner) return null

  const { look, belt } = practitioner
  const before = { ...look, equip: { ...look.equip, [piece.slot]: null } }
  const after = { ...look, equip: { ...look.equip, [piece.slot]: pieceId } }
  const tryOn = () => {
    setSaveFailed(false)
    api.updatePractitionerLook(after).then(() => setWorn(true)).catch(() => setSaveFailed(true))
  }

  return (
    <section className="bg-surface border border-border border-l-[3px] border-l-accent rounded-sm p-4 grid gap-3" aria-label="New piece">
      <p className="font-mono text-xs tracking-[0.08em] uppercase text-accent-text">Practice recorded · new piece</p>
      <div className="flex items-center gap-3">
        <div className="rounded-sm" style={{ backgroundColor: BACKDROP }}>
          <PractitionerCanvas look={before} belt={belt} scale={3.6} framing="bust" />
        </div>
        <span className="font-mono text-secondary" aria-hidden="true">→</span>
        <div className="rounded-sm" style={{ backgroundColor: BACKDROP }}>
          <PractitionerCanvas look={after} belt={belt} scale={3.6} framing="bust" label={`Your practitioner wearing the ${piece.name}`} />
        </div>
      </div>
      <div>
        <p className="text-primary font-semibold">{piece.name}</p>
        <p className="text-secondary text-sm">
          {piece.source}.{needsWork && ' NEEDS WORK counts here, too.'}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {worn ? (
          <span className="font-mono text-xs text-secondary">Wearing it now</span>
        ) : (
          <Button variant="ghost" size="sm" onClick={tryOn}>Try it on</Button>
        )}
        <span className={`font-mono text-xs ${saveFailed ? 'text-danger-text' : 'text-secondary'}`}>
          {saveFailed ? "Couldn't put it on. Try again." : 'Saved to your practitioner'}
        </span>
      </div>
    </section>
  )
}
