/**
 * Sensei prompt calibration — Sprint 023 Day 6 gate.
 *
 * Runs the 10-kata fixture through BOTH the pre-rename ("legacy") sensei
 * prompts and the current ("dojo") sensei prompts. Reports verdict
 * distribution per difficulty bucket and fails the gate if pass-rate drift
 * exceeds ±10 points on any bucket.
 *
 * The legacy prompts are kept here as embedded strings — copied verbatim
 * from `prompts/sensei.ts` before the rename. After this script confirms
 * the new prompts are within tolerance, the legacy copy can be deleted.
 *
 * Usage (real Anthropic — costs real tokens):
 *   LLM_API_KEY=sk-ant-... LLM_MODEL=claude-sonnet-4-6 \
 *     pnpm --filter=api calibrate-sensei
 *
 * Usage (smoke — verifies the pipeline against MockLLMAdapter):
 *   pnpm --filter=api calibrate-sensei --smoke
 *
 * Exit code: 0 if all difficulty buckets stay within ±10pt drift, 1 otherwise.
 */

import Anthropic from '@anthropic-ai/sdk'
import { CALIBRATION_CASES, type CalibrationCase, type Difficulty } from './calibrate-sensei.fixture'
import { buildPromptA as buildDojoPrompt } from '../prompts/sensei'

type Verdict = 'passed' | 'passed_with_notes' | 'needs_work' | 'parse_error'

interface CaseResult {
  caseId: string
  difficulty: Difficulty
  legacy: Verdict
  dojo: Verdict
}

interface BucketStats {
  total: number
  passLegacy: number
  passDojo: number
  passRateLegacy: number
  passRateDojo: number
  driftPoints: number
}

const DRIFT_THRESHOLD_POINTS = 10
const PASS_VERDICTS = new Set<Verdict>(['passed', 'passed_with_notes'])

// ---------------------------------------------------------------------------
// LEGACY PROMPT — verbatim copy of buildPromptA before Sprint 023 Day 6.
// Do NOT edit. This is the baseline the new prompts are compared against.
// ---------------------------------------------------------------------------

const LEGACY_DEBUGGING_CONTEXT = `CONTEXT — DEBUGGING EXERCISE:
This is a bug-fix exercise. The developer received broken code and was asked to find and fix the bug. Evaluate:
- Did they identify the root cause, not just patch the symptom?
- Is their fix minimal and targeted, or did they rewrite unnecessarily?
- Do they understand WHY the original code was wrong?
Prioritize these questions over general code quality critique.`

function buildLegacyPromptA(p: CalibrationCase): string {
  const debugging = p.category === 'debugging' ? `\n\n${LEGACY_DEBUGGING_CONTEXT}` : ''
  return `You are ${p.ownerRole}.

${p.ownerContext}

---

You are evaluating a developer's response to the following exercise:

EXERCISE:
${p.kataTitle}

${p.kataDescription}

---

The developer's response:

${p.userResponse}

---

Your job is to evaluate this response as ${p.ownerRole} would — from your specific background, with your specific standards. You are not a generic code reviewer. You have opinions shaped by your experience.

EVALUATION PRINCIPLES:
- Be specific. "You missed the N+1 problem" is not feedback. "Your query generates one SELECT per post in the loop — with 1,000 posts, that's 1,001 queries. Use \`includes(:comments, :author)\` to reduce this to 3 queries." is feedback.
- Be honest. A developer who gets vague praise learns nothing. A developer who gets specific critique learns something they can apply tomorrow.
- Be fair. Credit what was done well before what was done poorly. Do not invert this.
- Decide on a verdict. Do not equivocate. \`passed_with_notes\` exists for work that is solid but has one or two specific improvements. Use it.
- NEVER write the correct implementation for the developer. Name what is missing, name the concept or technique they should research, but do not write the code. A developer who copies your solution learned nothing and will fail the next kata.${debugging}

FOLLOW-UP RULE:
Ask one follow-up question ONLY if: (a) the submission shows partial understanding that one targeted question could clarify, OR (b) a key reasoning step is missing and asking about it would reveal whether the developer understood or got lucky. Do not ask a follow-up if the verdict is clear.

INSIGHT SUMMARY:
After your evaluation prose, provide a structured insight summary using these exact tags:

<strengths>
- What the developer did well (2-3 specific points)
</strengths>

<improvements>
- What the developer should improve (2-3 specific points)
</improvements>

<approach_note>
One sentence about an alternative approach or technique the developer could consider.
</approach_note>

Then output the structured evaluation result:

<evaluation>
{
  "verdict": "passed" | "passed_with_notes" | "needs_work",
  "analysis": "2-4 sentence summary",
  "topicsToReview": ["specific concept", ...],
  "followUpQuestion": "direct question" | null,
  "isFinalEvaluation": true | false
}
</evaluation>`
}

// ---------------------------------------------------------------------------
// Verdict extraction — looks for the JSON block inside <evaluation>...</evaluation>
// ---------------------------------------------------------------------------

const EVAL_BLOCK = /<evaluation>\s*([\s\S]*?)\s*<\/evaluation>/

function extractVerdict(text: string): Verdict {
  const match = EVAL_BLOCK.exec(text)
  if (!match || !match[1]) return 'parse_error'
  try {
    const obj = JSON.parse(match[1]) as { verdict?: string }
    const v = (obj.verdict ?? '').toLowerCase()
    if (v === 'passed' || v === 'passed_with_notes' || v === 'needs_work') return v
    return 'parse_error'
  } catch {
    return 'parse_error'
  }
}

// ---------------------------------------------------------------------------
// LLM calls
// ---------------------------------------------------------------------------

interface LLMRunner {
  run(prompt: string): Promise<string>
}

class AnthropicRunner implements LLMRunner {
  private client: Anthropic
  constructor(apiKey: string, private readonly model: string, baseUrl?: string) {
    this.client = new Anthropic({ apiKey, ...(baseUrl ? { baseURL: baseUrl } : {}) })
  }
  async run(prompt: string): Promise<string> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = res.content[0]
    return block && block.type === 'text' ? block.text : ''
  }
}

class SmokeRunner implements LLMRunner {
  // Returns a fixed-shape response that parses cleanly. Used to verify the
  // harness itself works without making real API calls.
  async run(_prompt: string): Promise<string> {
    return `Some preamble prose.

<strengths>
- Did the thing
</strengths>

<improvements>
- Could do another thing
</improvements>

<approach_note>
Use a different approach.
</approach_note>

<evaluation>
{
  "verdict": "passed_with_notes",
  "analysis": "Solid attempt with room to grow.",
  "topicsToReview": ["x", "y"],
  "followUpQuestion": null,
  "isFinalEvaluation": true
}
</evaluation>`
  }
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

async function evaluateCase(runner: LLMRunner, c: CalibrationCase): Promise<CaseResult> {
  const legacyPrompt = buildLegacyPromptA(c)
  const dojoPrompt = buildDojoPrompt(c)
  const [legacyOut, dojoOut] = await Promise.all([
    runner.run(legacyPrompt),
    runner.run(dojoPrompt),
  ])
  return {
    caseId: c.id,
    difficulty: c.difficulty,
    legacy: extractVerdict(legacyOut),
    dojo: extractVerdict(dojoOut),
  }
}

function aggregate(results: CaseResult[]): Record<Difficulty, BucketStats> {
  const buckets: Difficulty[] = ['easy', 'medium', 'hard']
  const acc = {} as Record<Difficulty, BucketStats>
  for (const d of buckets) {
    const inBucket = results.filter((r) => r.difficulty === d)
    const passLegacy = inBucket.filter((r) => PASS_VERDICTS.has(r.legacy)).length
    const passDojo = inBucket.filter((r) => PASS_VERDICTS.has(r.dojo)).length
    const passRateLegacy = inBucket.length ? (passLegacy / inBucket.length) * 100 : 0
    const passRateDojo = inBucket.length ? (passDojo / inBucket.length) * 100 : 0
    acc[d] = {
      total: inBucket.length,
      passLegacy,
      passDojo,
      passRateLegacy,
      passRateDojo,
      driftPoints: Math.abs(passRateDojo - passRateLegacy),
    }
  }
  return acc
}

function report(results: CaseResult[], stats: Record<Difficulty, BucketStats>): boolean {
  console.log('\n=== Per-case verdicts ===')
  console.table(results)

  console.log('\n=== Per-difficulty drift ===')
  const rows = (Object.entries(stats) as [Difficulty, BucketStats][]).map(([d, s]) => ({
    difficulty: d,
    n: s.total,
    pass_legacy: `${s.passLegacy}/${s.total} (${s.passRateLegacy.toFixed(0)}%)`,
    pass_dojo: `${s.passDojo}/${s.total} (${s.passRateDojo.toFixed(0)}%)`,
    drift_pts: s.driftPoints.toFixed(1),
    within_gate: s.driftPoints <= DRIFT_THRESHOLD_POINTS,
  }))
  console.table(rows)

  const allWithinGate = rows.every((r) => r.within_gate === true)
  console.log(
    `\nGate: drift ≤ ±${DRIFT_THRESHOLD_POINTS}pt per difficulty → ${allWithinGate ? 'PASS' : 'FAIL'}`,
  )
  return allWithinGate
}

async function main() {
  const smoke = process.argv.includes('--smoke')
  let runner: LLMRunner
  if (smoke) {
    console.log('[calibrate-sensei] smoke mode — using SmokeRunner (no real LLM calls)')
    runner = new SmokeRunner()
  } else {
    const apiKey = process.env['LLM_API_KEY']
    const model = process.env['LLM_MODEL']
    if (!apiKey) throw new Error('LLM_API_KEY env var required (or pass --smoke)')
    if (!model) throw new Error('LLM_MODEL env var required (or pass --smoke)')
    console.log(`[calibrate-sensei] using Anthropic model=${model}`)
    runner = new AnthropicRunner(apiKey, model, process.env['LLM_BASE_URL'])
  }

  const results: CaseResult[] = []
  for (const c of CALIBRATION_CASES) {
    console.log(`[calibrate-sensei] ${c.id} ...`)
    results.push(await evaluateCase(runner, c))
  }

  const stats = aggregate(results)
  const pass = report(results, stats)
  process.exit(pass ? 0 : 1)
}

void main()
