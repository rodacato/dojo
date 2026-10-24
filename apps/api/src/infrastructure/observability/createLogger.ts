import { AsyncLocalStorage } from 'node:async_hooks'
import pino from 'pino'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogFields = Record<string, unknown>

const requestContext = new AsyncLocalStorage<LogFields>()

export function runWithLogContext<T>(fields: LogFields, fn: () => T): T {
  return requestContext.run({ ...requestContext.getStore(), ...fields }, fn)
}

export function addLogContext(fields: LogFields): void {
  const store = requestContext.getStore()
  if (store) Object.assign(store, fields)
}

export interface LoggerOptions {
  level: LogLevel | 'silent'
  pretty: boolean
  destination?: { write(line: string): void }
}

export interface Logger {
  debug(evt: string, fields?: LogFields): void
  info(evt: string, fields?: LogFields): void
  warn(evt: string, fields?: LogFields): void
  error(evt: string, fields?: LogFields): void
}

// Values that must never reach stdout, wherever they appear in an event.
const REDACT_PATHS = [
  'headers.authorization',
  'headers.cookie',
  '*.headers.authorization',
  '*.headers.cookie',
  '*.password',
  '*.token',
  'token',
]

export function createLogger(opts: LoggerOptions): Logger {
  const pinoOptions: pino.LoggerOptions = {
    level: opts.level,
    base: undefined,
    messageKey: 'evt',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label) => ({ level: label }) },
    // A copy: pino merges each event's fields into the mixin object it gets.
    mixin: () => ({ ...requestContext.getStore() }),
    redact: { paths: REDACT_PATHS, censor: '[redacted]' },
  }

  let instance: pino.Logger
  if (opts.destination) {
    instance = pino(pinoOptions, opts.destination)
  } else if (opts.pretty) {
    instance = pino({
      ...pinoOptions,
      transport: { target: 'pino-pretty', options: prettyOptions() },
    })
  } else {
    instance = pino(pinoOptions)
  }

  const emit = (level: LogLevel) => (evt: string, fields: LogFields = {}) => instance[level](fields, evt)
  return { debug: emit('debug'), info: emit('info'), warn: emit('warn'), error: emit('error') }
}

// Shared with the `pino-pretty` CLI used to read `kamal app logs` locally.
export function prettyOptions() {
  return { messageKey: 'evt', ignore: 'pid,hostname', translateTime: 'HH:MM:ss.l' }
}
