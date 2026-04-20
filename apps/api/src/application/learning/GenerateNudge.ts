import type { CourseRepositoryPort } from '../../domain/learning/ports'
import type { LLMPort } from '../../domain/practice/ports'

interface Deps {
  courseRepo: CourseRepositoryPort
  llm: LLMPort
}

export interface NudgeInput {
  courseSlug: string
  stepId: string
  userCode: string
  stdout?: string
  stderr?: string
}

export interface NudgeResult {
  nudge: string
  stepId: string
}

export class StepNotFoundError extends Error {
  readonly name = 'DomainError'
  readonly code = 'EXERCISE_NOT_FOUND'
}

export class GenerateNudge {
  constructor(private readonly deps: Deps) {}

  // Resolves the step from its course slug + id, then asks the LLM for a
  // single-paragraph nudge. Stateless — the caller decides whether to persist
  // the prompt / response for later evaluation (see PRD 026).
  async execute(input: NudgeInput): Promise<NudgeResult> {
    const course = await this.deps.courseRepo.findBySlug(input.courseSlug)
    if (!course) throw new StepNotFoundError('Course not found')

    const step = course.lessons.flatMap((l) => l.steps).find((s) => s.id === input.stepId)
    if (!step) throw new StepNotFoundError('Step not found')

    const nudge = await this.deps.llm.nudge({
      stepInstruction: step.instruction,
      testCode: step.testCode,
      userCode: input.userCode,
      stdout: input.stdout,
      stderr: input.stderr,
    })

    return { nudge, stepId: step.id }
  }
}
