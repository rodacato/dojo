import { AsyncLocalStorage } from 'node:async_hooks'
import { config } from '../../config'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogFields = Record<string, unknown>

const RANK: Record<LogLevel | 'silent', number> = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 }

const requestContext = new AsyncLocalStorage<LogFields>()

export function runWithLogContext<T>(fields: LogFields, fn: () => T): T {
  return requestContext.run({ ...requestContext.getStore(), ...fields }, fn)
}

export function addLogContext(fields: LogFields): void {
  const store = requestContext.getStore()
  if (store) Object.assign(store, fields)
}

export function serializeError(err: unknown): LogFields {
  if (!(err instanceof Error)) return { message: String(err) }
  const status = (err as { status?: unknown }).status
  const code = (err as { code?: unknown }).code
  return {
    name: err.name,
    message: err.message,
    ...(typeof status === 'number' ? { status } : {}),
    ...(typeof code === 'string' ? { code } : {}),
    stack: err.stack,
  }
}

export interface LoggerOptions {
  level: LogLevel | 'silent'
  pretty: boolean
  write: (line: string, level: LogLevel) => void
  now?: () => Date
}

export interface Logger {
  debug(evt: string, fields?: LogFields): void
  info(evt: string, fields?: LogFields): void
  warn(evt: string, fields?: LogFields): void
  error(evt: string, fields?: LogFields): void
}

export function createLogger(opts: LoggerOptions): Logger {
  const now = opts.now ?? (() => new Date())

  function emit(level: LogLevel, evt: string, fields: LogFields = {}): void {
    if (RANK[level] < RANK[opts.level]) return
    const { err, ...rest } = fields
    const record: LogFields = {
      level,
      time: now().toISOString(),
      evt,
      ...requestContext.getStore(),
      ...rest,
      ...(err === undefined ? {} : { err: serializeError(err) }),
    }
    opts.write(opts.pretty ? formatPretty(record) : safeStringify(record), level)
  }

  return {
    debug: (evt, fields) => emit('debug', evt, fields),
    info: (evt, fields) => emit('info', evt, fields),
    warn: (evt, fields) => emit('warn', evt, fields),
    error: (evt, fields) => emit('error', evt, fields),
  }
}

function safeStringify(record: LogFields): string {
  try {
    return JSON.stringify(record)
  } catch {
    return JSON.stringify({ level: record['level'], time: record['time'], evt: record['evt'], logError: 'unserializable_fields' })
  }
}

function formatValue(v: unknown): string {
  return typeof v === 'string' ? v : (JSON.stringify(v) ?? String(v))
}

function formatPretty(record: LogFields): string {
  const { level, time, evt, err, ...rest } = record
  const head = `${String(time).slice(11, 23)} ${String(level).toUpperCase().padEnd(5)} ${String(evt)}`
  const fields = Object.entries(rest)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${formatValue(v)}`)
    .join(' ')
  const line = [head, fields].filter(Boolean).join(' ')
  const e = err as LogFields | undefined
  if (!e) return line
  return `${line}\n  ${String(e['name'])}: ${String(e['message'])}\n${String(e['stack'] ?? '')}`
}

const sink = (line: string, level: LogLevel) => (level === 'error' ? console.error(line) : console.log(line))

export const log: Logger = createLogger({
  level: config.LOG_LEVEL ?? (config.NODE_ENV === 'test' ? 'silent' : 'info'),
  pretty: config.NODE_ENV === 'development',
  write: sink,
})
