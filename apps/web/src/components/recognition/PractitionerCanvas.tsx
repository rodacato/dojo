import { useEffect, useRef } from 'react'
import { AVATAR_COLS, AVATAR_ROWS, drawAvatar, findPiece, type BeltRank, type PieceId, type PractitionerLook } from '@dojo/shared'
import { painter } from '../../lib/practitioner/painter'

const SILHOUETTE = '#3a342d'

interface Props {
  look: PractitionerLook
  belt: BeltRank
  /** Device pixels per art pixel. */
  scale: number
  framing?: 'full' | 'bust'
  /** Shows this piece on the avatar; a locked one renders as its silhouette. */
  piece?: { id: PieceId; earned: boolean }
  label?: string
  className?: string
}

export function PractitionerCanvas({ look, belt, scale, framing = 'full', piece, label, className }: Readonly<Props>) {
  const ref = useRef<HTMLCanvasElement>(null)
  const width = AVATAR_COLS * scale
  const height = framing === 'bust' ? width : AVATAR_ROWS * scale

  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)
    const oy = framing === 'bust' ? -scale : 0
    const slot = piece ? findPiece(piece.id)?.slot : undefined
    const base = slot ? { ...look, equip: { ...look.equip, [slot]: null } } : look
    drawAvatar(painter(ctx, scale, 0, oy), base, belt)
    if (!piece || !slot) return

    const layer = document.createElement('canvas')
    layer.width = width
    layer.height = height
    const layerCtx = layer.getContext('2d')
    if (!layerCtx) return
    drawAvatar(painter(layerCtx, scale, 0, oy), { ...look, equip: { ...look.equip, [slot]: piece.id } }, belt, { only: piece.id })
    if (!piece.earned) {
      layerCtx.globalCompositeOperation = 'source-atop'
      layerCtx.fillStyle = SILHOUETTE
      layerCtx.fillRect(0, 0, width, height)
    }
    ctx.drawImage(layer, 0, 0)
  }, [look, belt, scale, framing, piece, width, height])

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className={className}
      style={{ imageRendering: 'pixelated' }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}
