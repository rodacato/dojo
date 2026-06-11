import type { ReadInlineInteraction } from '@dojo/shared'

export type ReadInlineSegment = {
  prose: string
  interaction: ReadInlineInteraction | null
}

const MARKER_RE = /<!--\s*interact:([a-z0-9-]+)\s*-->/g

// Splits instruction markdown on `<!-- interact:<id> -->` markers and pairs
// each marker with the interaction whose `after` matches. A marker with no
// matching interaction renders as plain prose (marker dropped); an
// interaction whose marker never appears renders at the end, in authored
// order — a typo'd marker degrades visibly instead of disappearing.
export function splitOnInteractionMarkers(
  instruction: string,
  interactions: ReadInlineInteraction[],
): ReadInlineSegment[] {
  const byAfter = new Map(interactions.map((i) => [i.after, i]))
  const used = new Set<string>()
  const segments: ReadInlineSegment[] = []
  let lastIndex = 0
  const re = new RegExp(MARKER_RE.source, 'g')
  let match: RegExpExecArray | null
  while ((match = re.exec(instruction)) !== null) {
    const id = match[1]
    const interaction = (id && byAfter.get(id)) || null
    if (interaction) used.add(interaction.after)
    segments.push({ prose: instruction.slice(lastIndex, match.index), interaction })
    lastIndex = match.index + match[0].length
  }
  segments.push({ prose: instruction.slice(lastIndex), interaction: null })

  const orphans = interactions.filter((i) => !used.has(i.after))
  for (const orphan of orphans) {
    segments.push({ prose: '', interaction: orphan })
  }
  return segments
}
