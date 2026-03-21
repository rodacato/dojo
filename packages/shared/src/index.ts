/**
 * @dojo/shared — API boundary types only.
 *
 * Import from this package in:
 * - apps/web: for typing API responses and constructing requests
 * - apps/api: for shared validation schemas and DTO type references
 *
 * Do NOT import from this package:
 * - domain aggregates (apps/api/src/domain/)
 * - infrastructure types (Drizzle schema, etc.)
 * - anything that only one side of the API boundary needs
 */
export * from './types'
export * from './schemas'
export * from './topics'
