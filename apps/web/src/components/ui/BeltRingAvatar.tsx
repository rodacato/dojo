import type { BeltRank } from '@dojo/shared'
import { BELT_COLOR } from '../../lib/belt-colors'

interface BeltRingAvatarProps {
  src: string
  rank: BeltRank
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
  size = 48,
  alt = '',
  className = '',
}: BeltRingAvatarProps) {
  const isBlack = rank === 'black'
  return (
    <img
      src={src}
      alt={alt}
      aria-label={`${rank} belt`}
      style={{
        width: size,
        height: size,
        borderRadius: isBlack ? 2 : '50%',
        boxShadow: `0 0 0 2px ${BELT_COLOR[rank]}`,
      }}
      className={`bg-elevated shrink-0 ${className}`}
    />
  )
}
