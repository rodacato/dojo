import { config } from '../../config'
import { createLogger, type Logger } from './createLogger'

export * from './createLogger'

export const log: Logger = createLogger({
  // process.env, not config: tests that mock config partially still stay silent.
  level: config.LOG_LEVEL ?? (process.env['NODE_ENV'] === 'test' ? 'silent' : 'info'),
  pretty: config.NODE_ENV === 'development',
})
