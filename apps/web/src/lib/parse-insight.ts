export interface Insight {
  strengths: string[] | null
  improvements: string[] | null
  approachNote: string | null
}

function extractBullets(tag: string, text: string): string[] | null {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)
  const match = text.match(regex)
  if (!match || !match[1]) return null
  const lines = match[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2).trim())
  return lines.length > 0 ? lines : null
}

export function parseInsight(text: string): Insight {
  const approachMatch = text.match(/<approach_note>([\s\S]*?)<\/approach_note>/)
  const approachNote = approachMatch?.[1] ? approachMatch[1].trim() || null : null

  return {
    strengths: extractBullets('strengths', text),
    improvements: extractBullets('improvements', text),
    approachNote,
  }
}
