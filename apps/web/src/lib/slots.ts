export const SLOT_HEADINGS = [
  'Why this matters',
  'Your task',
  'Examples',
  'Edge cases',
] as const

export type SlotHeading = (typeof SLOT_HEADINGS)[number]

export interface SlotSection {
  slot: SlotHeading
  body: string
}

function isSlotHeading(value: string): value is SlotHeading {
  return (SLOT_HEADINGS as readonly string[]).includes(value)
}

export function renderSlots(md: string): SlotSection[] | null {
  const trimmed = md.trimStart()
  const opening = /^##\s+(.+?)\s*(?:\n|$)/.exec(trimmed)
  if (!opening?.[1] || !isSlotHeading(opening[1].trim())) return null

  const headingRegex = /^##\s+(.+?)\s*$/gm
  const parts: SlotSection[] = []
  let current: SlotSection | null = null
  let bodyStart = 0

  for (const match of trimmed.matchAll(headingRegex)) {
    const heading = match[1]?.trim()
    if (!heading || !isSlotHeading(heading)) continue
    const idx = match.index ?? 0

    if (current) {
      current.body = trimmed.slice(bodyStart, idx).trim()
      parts.push(current)
    }
    current = { slot: heading, body: '' }
    bodyStart = idx + match[0].length
  }

  if (current) {
    current.body = trimmed.slice(bodyStart).trim()
    parts.push(current)
  }

  return parts.length > 0 ? parts : null
}
