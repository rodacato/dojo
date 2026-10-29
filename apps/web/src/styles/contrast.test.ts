import { describe, expect, it } from 'vitest'
import css from './main.css?raw'

function block(opening: string): string {
  const start = css.indexOf(opening)
  expect(start, `${opening} block exists`).toBeGreaterThan(-1)
  return css.slice(start, css.indexOf('}', start))
}

function tokens(opening: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [, name, hex] of block(opening).matchAll(/--color-([a-z-]+):\s*(#[0-9A-Fa-f]{6})/g)) {
    out[name!] = hex!
  }
  return out
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

const THEMES = ['@theme {', "[data-theme='sumi']", "[data-theme='washi']"]
const TEXT_TOKENS = ['primary', 'secondary', 'accent-text', 'danger-text', 'success-text', 'warning-text']
const READABLE_ON = ['page', 'surface']

describe('text colour tokens keep WCAG AA contrast (4.5:1)', () => {
  for (const theme of THEMES) {
    const t = tokens(theme)
    for (const text of TEXT_TOKENS) {
      for (const bg of READABLE_ON) {
        it(`${theme} ${text} on ${bg}`, () => {
          expect(contrast(t[text]!, t[bg]!)).toBeGreaterThanOrEqual(4.5)
        })
      }
    }
    it(`${theme} on-accent on accent (filled buttons)`, () => {
      expect(contrast(t['on-accent']!, t['accent']!)).toBeGreaterThanOrEqual(4.5)
    })
  }
})
