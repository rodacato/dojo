import type { BeltRank } from '@dojo/shared'
import { BELT_COLOR } from '../../lib/belt-colors'

interface BeltRingAvatarProps {
  src: string
  rank?: BeltRank
  monogram?: string
  size?: number
  alt?: string
  className?: string
}

// Avatar wrapped in a 2px ring colored by the user's current belt rank.
// Per DESIGN.md §Brand motifs §Belt colors:
// - Default geometry is circle (border-radius: 50%)
// - Black-belt variant uses hanko-square instead (border-radius: 2px) —
//   visually distinguishes the top rank from the four circular ranks
//
// Ring is rendered via boxShadow so it doesn't affect layout sizing.
// The color resolves through the --color-belt-* tokens in main.css.
export function BeltRingAvatar({
  src,
  rank,
  monogram,
  size = 48,
  alt = '',
  className = '',
}: Readonly<BeltRingAvatarProps>) {
  const isBlack = rank === 'black'
  const shape = {
    width: size,
    height: size,
    borderRadius: isBlack ? 2 : '50%',
    boxShadow: rank ? `0 0 0 2px ${BELT_COLOR[rank]}` : undefined,
  }
  if (!src && monogram) {
    return (
      <span
        aria-hidden
        style={shape}
        className={`inline-flex items-center justify-center bg-elevated text-primary font-mono text-xl lowercase shrink-0 ${className}`}
      >
        {monogram}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      aria-label={rank ? `${rank} belt` : undefined}
      style={shape}
      className={`bg-elevated shrink-0 ${className}`}
    />
  )
}
