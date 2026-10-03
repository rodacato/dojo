import { z } from 'zod'
import { RUN_TOO_LARGE_MESSAGE, runFilesSchema,runLanguageSchema, runOutcomeShape, runStdinSchema } from './scroll-protocol'

export const scrollExecuteRequestSchema = z.object({
  language: runLanguageSchema,
  files: runFilesSchema,
  stdin: runStdinSchema.optional(),
})

export const scrollExecuteResponseSchema = z.object(runOutcomeShape)

export const scrollExecutionStatusSchema = z.object({ enabled: z.boolean() })

export function isPayloadTooLarge(issues: readonly { code: string; message: string }[]): boolean {
  return issues.some((issue) => issue.code === 'too_big' || issue.message === RUN_TOO_LARGE_MESSAGE)
}

export type ScrollExecuteRequest= z.infer<typeof scrollExecuteRequestSchema>
export type ScrollExecuteResponse = z.infer<typeof scrollExecuteResponseSchema>
export type ScrollExecutionStatus = z.infer<typeof scrollExecutionStatusSchema>
