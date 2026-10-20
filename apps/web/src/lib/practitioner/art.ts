import type { BeltRank, GI_COLORS, PieceId, PieceSlot, PractitionerLook } from '@dojo/shared'

// Pixel palette for canvas art; belt hexes mirror the --color-belt-* tokens in main.css.
const C = {
  ink: '#1a1714', woodDark: '#4f3a28', washi: '#f2ede3', verm: '#b73a2f', vermDark: '#8a2a22',
  mossDark: '#56704a', marigold: '#e8892b', marigoldLight: '#f5b041', straw: '#d7b67a', bone: '#efe6d2',
}

const GI: Record<(typeof GI_COLORS)[number], { main: string; shade: string; light: string }> = {
  oat: { main: '#e8dfc8', shade: '#bfb69e', light: '#f6efdb' },
  indigo: { main: '#3a4f7a', shade: '#283a5c', light: '#4f6696' },
  ink: { main: '#3a3631', shade: '#26231f', light: '#4d4842' },
  moss: { main: '#7d9b6a', shade: '#5c7a4e', light: '#97b283' },
}

const BELT: Record<BeltRank, string> = {
  white: '#F2EDE3', yellow: '#D4A547', green: '#7D9B6A', brown: '#7A5A3F', black: '#2b2724',
}

export const AVATAR_COLS = 20
export const AVATAR_ROWS = 34

type Paint = (x: number, y: number, w: number, h: number, color: string) => void

export function shade(hex: string, amount: number): string {
  return '#' + hex.slice(1).match(/../g)!
    .map((part) => Math.max(0, Math.min(255, parseInt(part, 16) + amount)).toString(16).padStart(2, '0'))
    .join('')
}

export function painter(ctx: CanvasRenderingContext2D, scale: number, ox = 0, oy = 0): Paint {
  return (x, y, w, h, color) => {
    const left = Math.round(ox + x * scale)
    const top = Math.round(oy + y * scale)
    ctx.fillStyle = color
    ctx.fillRect(left, top, Math.round(ox + (x + w) * scale) - left, Math.round(oy + (y + h) * scale) - top)
  }
}

const PIECE_ART: Record<PieceId, (a: Paint) => void> = {
  hachimaki(a) { a(5, 4, 10, 1, C.verm); a(15, 4, 2, 1, C.verm); a(16, 5, 1, 2, C.vermDark) },
  kasa(a) {
    a(7, -1, 6, 1, shade(C.straw, -20)); a(4, 0, 12, 1, C.straw); a(2, 1, 16, 1, C.straw)
    a(1, 2, 18, 1, C.woodDark); a(6, 0, 1, 1, shade(C.straw, -30)); a(13, 0, 1, 1, shade(C.straw, -30))
  },
  scarf(a) { a(6, 11, 8, 2, C.verm); a(6, 12, 8, 1, C.vermDark); a(12, 13, 2, 4, C.verm); a(12, 17, 2, 1, C.vermDark) },
  happi(a) {
    const h = '#2f4a7a', hd = '#22375c'
    a(5, 13, 3, 8, h); a(12, 13, 3, 8, hd); a(3, 14, 2, 5, h); a(15, 14, 2, 5, hd)
    a(8, 13, 1, 8, C.washi); a(11, 13, 1, 8, C.washi); a(5, 20, 3, 1, C.washi); a(12, 20, 3, 1, C.washi)
  },
  'cempasuchil-crown'(a) {
    a(5, 2, 10, 1, C.mossDark)
    for (const x of [5, 8, 11, 14]) { a(x - 0.5, 1, 2, 2, C.marigold); a(x, 1, 1, 1, C.marigoldLight) }
  },
  calavera(a) {
    a(6, 4, 8, 7, C.bone); a(6, 6, 3, 3, C.marigold); a(11, 6, 3, 3, C.marigold)
    a(7, 7, 1, 1, C.ink); a(12, 7, 1, 1, C.ink); a(9, 8, 2, 1, C.ink)
    a(8, 10, 4, 1, C.ink); a(9, 10, 1, 1, C.bone); a(11, 10, 1, 1, C.bone); a(9, 4, 2, 1, C.verm)
  },
}

const SLOT_ORDER: PieceSlot[] = ['face', 'outfit', 'neck', 'head']

export interface AvatarOptions {
  /** Draw only this piece, for a silhouette layer of a locked piece. */
  only?: PieceId
}

export function drawAvatar(paint: Paint, look: PractitionerLook, belt: BeltRank, opts: AvatarOptions = {}) {
  const a: Paint = (x, y, w, h, color) => paint(x, y + 1, w, h, color)
  if (opts.only) { PIECE_ART[opts.only](a); return }

  const skin = look.skin, sk2 = shade(skin, -28), hair = look.hair, gi = GI[look.gi], beltColor = BELT[belt]

  if (look.hairStyle === 'long') { a(5, 4, 10, 11, C.ink); a(6, 5, 8, 10, hair) }
  a(5, 21, 10, 9, C.ink); a(6, 21, 3, 8, gi.main); a(11, 21, 3, 8, gi.shade); a(9, 21, 2, 3, gi.main)
  a(5, 29, 4, 2, C.ink); a(11, 29, 4, 2, C.ink); a(6, 29, 2, 1, skin); a(12, 29, 2, 1, sk2)
  a(5, 30, 4, 1, C.woodDark); a(11, 30, 4, 1, C.woodDark)
  a(2, 13, 16, 8, C.ink); a(4, 12, 12, 10, C.ink)
  a(5, 13, 10, 8, gi.main); a(5, 13, 2, 8, gi.light); a(12, 13, 3, 8, gi.shade)
  a(3, 14, 2, 5, gi.main); a(15, 14, 2, 5, gi.shade)
  a(3, 19, 2, 2, skin); a(15, 19, 2, 2, sk2)
  a(9, 13, 2, 2, skin)
  for (const [x, y] of [[8, 13], [8, 14], [9, 15], [10, 16], [11, 17]] as const) a(x, y, 1, 1, gi.light)
  a(11, 13, 1, 2, gi.shade)
  a(4, 18, 12, 3, C.ink); a(5, 18.5, 10, 2, beltColor); a(9, 18.5, 2, 2, shade(beltColor, -30))
  a(8, 20.5, 1, 3, beltColor); a(11, 20.5, 1, 3, shade(beltColor, -18))
  a(11.5, 18.5, 3.5, 2, belt === 'black' ? C.verm : C.ink)
  a(9, 11, 2, 2, sk2)
  a(6, 3, 8, 1, C.ink); a(5, 4, 1, 7, C.ink); a(14, 4, 1, 7, C.ink); a(6, 11, 8, 1, C.ink)
  a(6, 4, 8, 7, skin); a(13, 5, 1, 6, shade(skin, -12))
  a(4, 7, 1, 2, C.ink); a(15, 7, 1, 2, C.ink)
  a(7, 7, 1, 2, C.ink); a(12, 7, 1, 2, C.ink); a(9, 9, 2, 1, shade(skin, -32))
  if (look.hairStyle === 'buzz') { a(6, 3, 8, 1, shade(hair, 10)); a(6, 4, 8, 1, shade(skin, -18)) }
  else { a(6, 2, 8, 1, C.ink); a(5, 3, 1, 1, C.ink); a(14, 3, 1, 1, C.ink); a(6, 3, 8, 2, hair); a(5, 4, 1, 3, hair); a(14, 4, 1, 3, hair); a(6, 5, 2, 1, hair); a(11, 5, 3, 1, hair) }
  if (look.hairStyle === 'bun') { a(8, -0.5, 4, 1, C.ink); a(7, 0.5, 6, 1.5, C.ink); a(8, 0.5, 4, 1.5, hair); a(9, 0.5, 1, 1, shade(hair, 22)) }
  if (look.hairStyle === 'long') { a(5, 5, 1, 6, hair); a(14, 5, 1, 6, hair) }
  if (look.hairStyle === 'bob') { a(6, 3, 8, 3, hair); a(5, 4, 2, 6, hair); a(13, 4, 2, 6, hair); a(4, 5, 1, 5, C.ink); a(15, 5, 1, 5, C.ink) }

  for (const slot of SLOT_ORDER) {
    const id = look.equip[slot]
    if (id) PIECE_ART[id](a)
  }
}
