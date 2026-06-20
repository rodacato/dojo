// =============================================================================
// validate:scrolls — anti-drift CI gate for scroll content.
//
// For every seeded step that has a recorded `solution`, this script feeds
// that solution into the same ExecuteStep use case the learner triggers when
// they hit Run, and asserts the run reports `passed === true`. The drift it
// catches: an author tweaks `instruction` (the spec) without updating
// `testCode` (the harness), or vice versa, and the recorded solution
// silently stops matching what the harness now expects.
//
// Requires Piston to be reachable for SQL/TS/Python/Go runtimes. iframe
// (`javascript-dom`) steps are skipped — their browser-only runner cannot
// execute headlessly in this script.
// =============================================================================

import { ExecuteStep } from '../application/learning/ExecuteStep'
import { PistonAdapter } from '../infrastructure/execution/PistonAdapter'
import {
  DOM_COURSE_DATA,
  DOM_STEPS_DATA,
} from '../infrastructure/persistence/seed-scrolls'
import {
  SQL_DEEP_CUTS_COURSE,
  SQL_DEEP_CUTS_STEPS,
} from '../infrastructure/persistence/seed-scrolls-sql-deep-cuts'
import {
  PYTHON_COURSE_DATA,
  PYTHON_STEPS,
} from '../infrastructure/persistence/seed-scrolls-python'
import {
  RUBY_COURSE_DATA,
  RUBY_STEPS,
} from '../infrastructure/persistence/seed-scrolls-ruby'
import {
  RUST_COURSE_DATA,
  RUST_STEPS,
} from '../infrastructure/persistence/seed-scrolls-rust'
import {
  TYPESCRIPT_COURSE_DATA,
  TYPESCRIPT_STEPS,
} from '../infrastructure/persistence/seed-scrolls-typescript'
import { GO_COURSE_DATA, GO_STEPS } from '../infrastructure/persistence/seed-scrolls-go'

type StepLike = {
  id: string
  type: 'read' | 'read+inline' | 'code' | 'kata' | 'challenge' | 'predict'
  title?: string | null
  instruction: string
  starterCode: string | null
  testCode: string | null
  hint: string | null
  solution?: string | null
}

function fallbackTitle(s: StepLike): string {
  if (s.title) return s.title
  const m = s.instruction.match(/^#\s+(.+)$/m)
  return m?.[1]?.trim() ?? `step ${s.id}`
}

function collect(): Array<{ scrollSlug: string; scrollLanguage: string; step: StepLike }> {
  const all: Array<{ scrollSlug: string; scrollLanguage: string; step: StepLike }> = []
  for (const step of DOM_STEPS_DATA) {
    all.push({ scrollSlug: DOM_COURSE_DATA.slug, scrollLanguage: DOM_COURSE_DATA.language, step })
  }
  for (const step of SQL_DEEP_CUTS_STEPS) {
    all.push({
      scrollSlug: SQL_DEEP_CUTS_COURSE.slug,
      scrollLanguage: SQL_DEEP_CUTS_COURSE.language,
      step,
    })
  }
  for (const step of PYTHON_STEPS) {
    all.push({
      scrollSlug: PYTHON_COURSE_DATA.slug,
      scrollLanguage: PYTHON_COURSE_DATA.language,
      step,
    })
  }
  for (const step of RUBY_STEPS) {
    all.push({ scrollSlug: RUBY_COURSE_DATA.slug, scrollLanguage: RUBY_COURSE_DATA.language, step })
  }
  for (const step of RUST_STEPS) {
    all.push({ scrollSlug: RUST_COURSE_DATA.slug, scrollLanguage: RUST_COURSE_DATA.language, step })
  }
  for (const step of TYPESCRIPT_STEPS) {
    all.push({
      scrollSlug: TYPESCRIPT_COURSE_DATA.slug,
      scrollLanguage: TYPESCRIPT_COURSE_DATA.language,
      step,
    })
  }
  for (const step of GO_STEPS) {
    all.push({ scrollSlug: GO_COURSE_DATA.slug, scrollLanguage: GO_COURSE_DATA.language, step })
  }
  return all
}

const TRANSIENT_RE =
  /Sandbox keeper received fatal signal|runner is unavailable|Couldn't reach the code sandbox/i

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// The devcontainer Piston flakes on Go under host memory pressure — a healthy
// program SIGABRTs ("Sandbox keeper received fatal signal 6") at random. That's
// transient infra, not content drift, so retry it. A real failure (compile
// error, wrong output) is deterministic and fails every attempt, so it still
// surfaces; only the sandbox/runner crashes are retried.
async function executeWithRetry(
  useCase: ExecuteStep,
  params: { code: string; testCode: string; language: string },
  label: string,
  maxAttempts = 8,
) {
  let result = await useCase.execute(params)
  for (let attempt = 2; attempt <= maxAttempts && !result.passed; attempt++) {
    // stderr is the reliable channel: ExecuteStep's timeout/sandbox branches
    // overwrite `output` with a friendly message but always pass stderr through,
    // and a SIGKILLed sandbox keeper is misread as a timeout — so the
    // "Sandbox keeper..." marker only survives in stderr.
    const transient =
      TRANSIENT_RE.test(result.stderr ?? '') ||
      TRANSIENT_RE.test(result.output ?? '') ||
      TRANSIENT_RE.test(result.errorMessage ?? '')
    if (!transient) break
    console.error(`  ⟳ transient sandbox crash on ${label} — retry ${attempt}/${maxAttempts}`)
    await sleep(250)
    result = await useCase.execute(params)
  }
  return result
}

async function main() {
  const adapter = new PistonAdapter()
  const useCase = new ExecuteStep({ executionPort: adapter })

  let validated = 0
  let failures = 0
  let skippedIframe = 0
  let skippedNoSolution = 0

  for (const { scrollSlug, scrollLanguage, step } of collect()) {
    if (!step.solution || !step.testCode) {
      skippedNoSolution++
      continue
    }
    if (scrollLanguage === 'javascript-dom') {
      skippedIframe++
      continue
    }
    validated++
    const result = await executeWithRetry(
      useCase,
      { code: step.solution, testCode: step.testCode, language: scrollLanguage },
      `${scrollSlug} / ${fallbackTitle(step)}`,
    )
    if (!result.passed) {
      failures++
      console.error(`FAIL  ${scrollSlug} / ${fallbackTitle(step)}`)
      const failedSummary = result.testResults
        .filter((t) => !t.passed)
        .map((t) => `  ✗ ${t.name}${t.message ? `: ${t.message}` : ''}`)
        .join('\n')
      const detail = result.errorMessage ?? (failedSummary || result.output.slice(0, 400))
      console.error(detail)
    } else {
      console.log(`OK    ${scrollSlug} / ${fallbackTitle(step)}`)
    }
  }

  console.log(
    `\nvalidated=${validated} failures=${failures} skipped_iframe=${skippedIframe} skipped_no_solution=${skippedNoSolution}`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error('validate:scrolls crashed:', err)
  process.exit(1)
})
