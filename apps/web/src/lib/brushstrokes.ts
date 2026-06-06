// 6 placeholder brushstroke paths used by the Sumi-e visual language.
// Per DESIGN.md §Decided #3, the library is deterministic-by-seed:
// the same card always renders with the same stroke, different cards
// vary visually without random repaints.
//
// TODO: these are geometric Bézier placeholders, not real sumi-e
// brushstrokes. Replace with hand-picked CC0 strokes (Wikimedia, brush
// libraries) before launch — see DESIGN.md §Decided #3 for sourcing.

export interface BrushstrokePath {
  d: string
  viewBox: string
  strokeWidth: number
}

const UNDERLINES: BrushstrokePath[] = [
  { d: 'M 5 12 Q 50 7 100 11 T 195 10', viewBox: '0 0 200 20', strokeWidth: 2 },
  { d: 'M 5 9 C 50 15, 150 5, 195 11', viewBox: '0 0 200 20', strokeWidth: 2 },
  { d: 'M 5 10 Q 100 17 195 12', viewBox: '0 0 200 20', strokeWidth: 2.5 },
]

const TICKS: BrushstrokePath[] = [
  { d: 'M 5 30 Q 35 12 70 14', viewBox: '0 0 80 40', strokeWidth: 2 },
  { d: 'M 5 25 Q 40 5 70 22', viewBox: '0 0 80 40', strokeWidth: 2 },
  { d: 'M 8 22 Q 40 16 72 18', viewBox: '0 0 80 40', strokeWidth: 2 },
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function pickUnderline(seed: string): BrushstrokePath {
  return UNDERLINES[hashString(seed) % UNDERLINES.length]!
}

export function pickTick(seed: string): BrushstrokePath {
  return TICKS[hashString(seed) % TICKS.length]!
}

export const ALL_UNDERLINES = UNDERLINES
export const ALL_TICKS = TICKS
