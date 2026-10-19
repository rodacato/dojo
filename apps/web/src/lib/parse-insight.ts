export interface Insight {
  strengths: string[] | null
  improvements: string[] | null
  approachNote: string | null
}

function extractBullets(tag: string, text: string): string[] | null {
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- tag is a static internal literal, not user input
  const regex = new RegExp(String.raw`<${tag}>([\s\S]*?)</${tag}>`)
  const match = regex.exec(text)
  if (!match?.[1]) return null
  const lines = match[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2).trim())
  return lines.length > 0 ? lines : null
}

export function parseInsight(text: string): Insight {
  const approachMatch = /<approach_note>([\s\S]*?)<\/approach_note>/.exec(text)
  const approachNote = approachMatch?.[1] ? approachMatch[1].trim() || null : null

  return {
    strengths: extractBullets('strengths', text),
    improvements: extractBullets('improvements', text),
    approachNote,
  }
}

export function stripInsightTags(text: string): string {
  return text.replace(/<(strengths|improvements|approach_note)>[\s\S]*?<\/\1>/g, '').replace(/\n{3,}/g, '\n\n').trim()
}

const OPEN_INSIGHT = /<(strengths|improvements|approach_note)>[\s\S]*$/
const TRAILING_PARTIAL_TAG = /<\/?[a-z_]*$/

// While streaming, a block can be unclosed or its opening tag split across chunks.
export function hideInsightTags(text: string): string {
  return stripInsightTags(text).replace(OPEN_INSIGHT, '').replace(TRAILING_PARTIAL_TAG, '').trimEnd()
}
