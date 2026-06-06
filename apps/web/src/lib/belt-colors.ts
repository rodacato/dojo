import type { BeltRank } from '@dojo/shared'

// Belt rank colors as CSS variable references. The actual hex values
// live in apps/web/src/styles/main.css inside the @theme block (per
// DESIGN.md §Belt rank colors). Components that need the color in an
// inline style (avatar ring boxShadow, swatch backgroundColor) use
// this map so the theme system stays the single source of truth.
export const BELT_COLOR: Record<BeltRank, string> = {
  white: 'var(--color-belt-white)',
  yellow: 'var(--color-belt-yellow)',
  green: 'var(--color-belt-green)',
  brown: 'var(--color-belt-brown)',
  black: 'var(--color-belt-black)',
}
