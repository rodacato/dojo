import type { Paint } from '@dojo/shared'

export function painter(ctx: CanvasRenderingContext2D, scale: number, ox = 0, oy = 0): Paint {
  return (x, y, w, h, color) => {
    const left = Math.round(ox + x * scale)
    const top = Math.round(oy + y * scale)
    ctx.fillStyle = color
    ctx.fillRect(left, top, Math.round(ox + (x + w) * scale) - left, Math.round(oy + (y + h) * scale) - top)
  }
}
