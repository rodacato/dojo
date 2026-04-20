// =============================================================================
// validate:courses — anti-drift CI gate for course content.
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
  COURSE_DATA,
  STEPS_DATA,
  DOM_COURSE_DATA,
  DOM_STEPS_DATA,
} from '../infrastructure/persistence/seed-courses'
import {
  SQL_DEEP_CUTS_COURSE,
  SQL_DEEP_CUTS_STEPS,
} from '../infrastructure/persistence/seed-courses-sql-deep-cuts'
import {
  PYTHON_COURSE_DATA,
  PYTHON_STEPS,
} from '../infrastructure/persistence/seed-courses-python'

type StepLike = {
  id: string
  type: 'read' | 'code' | 'exercise' | 'challenge'
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

function collect(): Array<{ courseSlug: string; courseLanguage: string; step: StepLike }> {
  const all: Array<{ courseSlug: string; courseLanguage: string; step: StepLike }> = []
  for (const step of STEPS_DATA) {
    all.push({ courseSlug: COURSE_DATA.slug, courseLanguage: COURSE_DATA.language, step })
  }
  for (const step of DOM_STEPS_DATA) {
    all.push({ courseSlug: DOM_COURSE_DATA.slug, courseLanguage: DOM_COURSE_DATA.language, step })
  }
  for (const step of SQL_DEEP_CUTS_STEPS) {
    all.push({
      courseSlug: SQL_DEEP_CUTS_COURSE.slug,
      courseLanguage: SQL_DEEP_CUTS_COURSE.language,
      step,
    })
  }
  for (const step of PYTHON_STEPS) {
    all.push({
      courseSlug: PYTHON_COURSE_DATA.slug,
      courseLanguage: PYTHON_COURSE_DATA.language,
      step,
    })
  }
  return all
}

async function main() {
  const adapter = new PistonAdapter()
  const useCase = new ExecuteStep({ executionPort: adapter })

  let validated = 0
  let failures = 0
  let skippedIframe = 0
  let skippedNoSolution = 0

  for (const { courseSlug, courseLanguage, step } of collect()) {
    if (!step.solution || !step.testCode) {
      skippedNoSolution++
      continue
    }
    if (courseLanguage === 'javascript-dom') {
      skippedIframe++
      continue
    }
    validated++
    const result = await useCase.execute({
      code: step.solution,
      testCode: step.testCode,
      language: courseLanguage,
    })
    if (!result.passed) {
      failures++
      console.error(`FAIL  ${courseSlug} / ${fallbackTitle(step)}`)
      const failedSummary = result.testResults
        .filter((t) => !t.passed)
        .map((t) => `  ✗ ${t.name}${t.message ? `: ${t.message}` : ''}`)
        .join('\n')
      const detail = result.errorMessage ?? (failedSummary || result.output.slice(0, 400))
      console.error(detail)
    } else {
      console.log(`OK    ${courseSlug} / ${fallbackTitle(step)}`)
    }
  }

  console.log(
    `\nvalidated=${validated} failures=${failures} skipped_iframe=${skippedIframe} skipped_no_solution=${skippedNoSolution}`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error('validate:courses crashed:', err)
  process.exit(1)
})
