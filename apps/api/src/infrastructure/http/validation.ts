import { HTTPException } from 'hono/http-exception'
import type { ZodSchema } from 'zod'

/**
 * Validates `data` against `schema`. Returns the parsed, typed value.
 * Throws an HTTPException(400) with formatted errors on failure.
 *
 * Use explicitly in route handlers — not as middleware injection.
 * This makes the validation boundary visible in code review.
 *
 * @example
 * const body = validate(StartSessionSchema, await c.req.json())
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new HTTPException(400, {
      message: JSON.stringify({
        error: 'Validation failed',
        fields: result.error.flatten().fieldErrors,
      }),
    })
  }
  return result.data
}
