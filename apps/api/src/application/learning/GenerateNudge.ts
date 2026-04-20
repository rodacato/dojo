import type { CourseRepositoryPort, NudgeRepositoryPort } from '../../domain/learning/ports'
import type { LLMPort } from '../../domain/practice/ports'
import { buildNudgePrompt } from '../../prompts/sensei'

interface Deps {
  courseRepo: CourseRepositoryPort
  llm: LLMPort
  nudgeRepo: NudgeRepositoryPort
}

export interface NudgeInput {
  courseSlug: string
  stepId: string
  userCode: string
  stdout?: string
  stderr?: string
  userId: string | null
}

export interface NudgeResult {
  id: string
  nudge: string
  stepId: string
}

export class StepNotFoundError extends Error {
  readonly name = 'DomainError'
  readonly code = 'EXERCISE_NOT_FOUND'
}

export class GenerateNudge {
  constructor(private readonly deps: Deps) {}

  // Resolves the step, asks the LLM for a paragraph, and logs the exchange
  // so the prompt can be iterated against real usage (PRD 026). The id of
  // the logged row is returned so the client can later attach feedback.
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

    // Build the same prompt text the adapter saw, for review/analytics. Kept
    // in sync with the adapter by sharing `buildNudgePrompt`.
    const prompt = buildNudgePrompt({
      stepInstruction: step.instruction,
      testCode: step.testCode,
      userCode: input.userCode,
      stdout: input.stdout,
      stderr: input.stderr,
    })

    const id = await this.deps.nudgeRepo.create({
      userId: input.userId,
      stepId: step.id,
      prompt,
      response: nudge,
    })

    return { id, nudge, stepId: step.id }
  }
}
