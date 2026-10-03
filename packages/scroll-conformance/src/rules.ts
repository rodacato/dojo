import {
  RESERVED_MESSAGE_TYPES,
  SCROLL_PROTOCOL_VERSION,
  hostInitSchema,
  scrollToHostMessageSchema,
  type ScrollToHostMessage,
} from '@dojo/shared'
import type { SpoofKind, TraceContext, TraceEvent, TraceKind } from './trace.js'

export const DEFAULT_HELLO_TIMEOUT_MS = 10_000

type Parsed = ReturnType<typeof scrollToHostMessageSchema.safeParse>

interface ScrollEvent {
  index: number
  event: TraceEvent
  envelope: boolean
  type: string | undefined
  session: string | undefined
  reserved: boolean
  parsed: Parsed | undefined
}

export interface Analysis {
  context: TraceContext
  scroll: readonly ScrollEvent[]
  hellos: readonly ScrollEvent[]
  /** The first `init` the host really issued, not a forged one. */
  init: { index: number; session: string; capabilities: readonly string[] } | undefined
  forged: ReadonlySet<string>
}

interface Finding {
  message: string
  eventIndex: number | null
}

export interface Rule {
  id: string
  section: string
  summary: string
  kinds: readonly TraceKind[]
  spoof?: SpoofKind
  check(analysis: Analysis): Finding[]
  /** Why the trace cannot tell, when it holds nothing that exercises the rule. */
  skip?(analysis: Analysis): string | undefined
}

const SESSION_BEARING = new Set(['progress', 'complete', 'resize', 'run'])
const NEEDS_DRIVE = 'supply a --drive module so the scroll sends it'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function describeScrollEvent(index: number, event: TraceEvent): ScrollEvent {
  const record = isRecord(event.data) ? event.data : {}
  const envelope = record['dojo'] === 'scroll' && record['v'] === SCROLL_PROTOCOL_VERSION
  const type = envelope && typeof record['type'] === 'string' ? record['type'] : undefined
  const session = envelope && typeof record['session'] === 'string' ? record['session'] : undefined
  const reserved = type !== undefined && (RESERVED_MESSAGE_TYPES as readonly string[]).includes(type)
  const parsed = envelope && !reserved ? scrollToHostMessageSchema.safeParse(event.data) : undefined
  return { index, event, envelope, type, session, reserved, parsed }
}

export function analyze(trace: readonly TraceEvent[], context: TraceContext): Analysis {
  const forged = new Set(context.forgedSessions ?? [])
  const scroll: ScrollEvent[] = []
  let init: Analysis['init']
  trace.forEach((event, index) => {
    if (event.direction === 'scroll-to-host') {
      scroll.push(describeScrollEvent(index, event))
      return
    }
    const parsed = hostInitSchema.safeParse(event.data)
    if (!init && parsed.success && !forged.has(parsed.data.session)) {
      init = { index, session: parsed.data.session, capabilities: parsed.data.capabilities }
    }
  })
  const hellos = scroll.filter((item) => item.parsed?.success && item.type === 'hello')
  return { context, scroll, hellos, init, forged }
}

function messages<T extends ScrollToHostMessage['type']>(analysis: Analysis, type: T) {
  return analysis.scroll.flatMap((item) =>
    item.parsed?.success && item.parsed.data.type === type
      ? [{ index: item.index, message: item.parsed.data as Extract<ScrollToHostMessage, { type: T }> }]
      : [],
  )
}

function isForged(analysis: Analysis, item: ScrollEvent): boolean {
  return item.session !== undefined && analysis.forged.has(item.session)
}

function summarizeIssues(issues: readonly { path: readonly PropertyKey[]; message: string }[]): string {
  return issues
    .slice(0, 3)
    .map((issue) => `${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`)
    .join('; ')
}

function noHello(analysis: Analysis): string | undefined {
  return analysis.hellos.length === 0 ? 'the scroll never sent a valid hello' : undefined
}

function afterInit(analysis: Analysis): ScrollEvent[] {
  const initIndex = analysis.init?.index ?? Infinity
  return analysis.scroll.filter((item) => item.index > initIndex && item.type !== undefined && item.type !== 'hello')
}

function noMessageAfterInit(analysis: Analysis): string | undefined {
  const { init } = analysis
  if (!init) return 'the host never sent init'
  const carriesSession = analysis.scroll.some(
    (item) => item.session !== undefined && (item.index > init.index || isForged(analysis, item)),
  )
  return carriesSession ? undefined : `the scroll sent nothing after init; ${NEEDS_DRIVE}`
}

const SPOOF_DESCRIPTIONS: Record<SpoofKind, string> = {
  origin: 'from another origin',
  source: 'from another window of the host origin',
  nonce: 'with the wrong nonce',
  replay: 'after the first init',
}

function spoofRule(spoof: SpoofKind, id: string, section: string, summary: string): Rule {
  return {
    id,
    section,
    summary,
    kinds: ['embedded'],
    spoof,
    check: (analysis) =>
      analysis.scroll
        .filter((item) => isForged(analysis, item))
        .slice(0, 1)
        .map((item) => ({
          message: `the scroll used the session of an init sent ${SPOOF_DESCRIPTIONS[spoof]}, so it adopted a message it should have ignored`,
          eventIndex: item.index,
        })),
    skip: noMessageAfterInit,
  }
}

function silentRule(id: string, kind: TraceKind, section: string, summary: string, reason: string): Rule {
  return {
    id,
    section,
    summary,
    kinds: [kind],
    check: (analysis) =>
      analysis.scroll.map((item) => ({
        message: `${item.type ?? 'a message'} was posted ${reason}`,
        eventIndex: item.index,
      })),
  }
}

export const RULES: readonly Rule[] = [
  {
    id: 'envelope',
    section: '§2',
    summary: 'Every message is an envelope with `dojo: "scroll"` and the protocol version.',
    kinds: ['embedded'],
    check: (analysis) =>
      analysis.scroll
        .filter((item) => !item.envelope)
        .map((item) => ({
          message: `message is not a scroll envelope (expected dojo "scroll" and v ${SCROLL_PROTOCOL_VERSION})`,
          eventIndex: item.index,
        })),
  },
  {
    id: 'message-schema',
    section: '§5',
    summary: 'Every message validates against the schema of its type, including the size and range limits.',
    kinds: ['embedded'],
    check: (analysis) =>
      analysis.scroll.flatMap((item) =>
        item.parsed?.success === false
          ? [{ message: `${item.type ?? 'message'} is invalid: ${summarizeIssues(item.parsed.error.issues)}`, eventIndex: item.index }]
          : [],
      ),
  },
  {
    id: 'reserved-type',
    section: '§7',
    summary: 'The scroll never sends a message type the protocol reserves.',
    kinds: ['embedded'],
    check: (analysis) =>
      analysis.scroll
        .filter((item) => item.reserved)
        .map((item) => ({ message: `message type "${item.type}" is reserved`, eventIndex: item.index })),
  },
  {
    id: 'hello-sent',
    section: '§4',
    summary: 'The scroll sends a valid `hello` within the handshake timeout.',
    kinds: ['embedded'],
    check: (analysis) => {
      const timeout = analysis.context.helloTimeoutMs ?? DEFAULT_HELLO_TIMEOUT_MS
      const [first] = analysis.hellos
      if (!first) {
        const others = analysis.scroll.length
        const seen = others === 0 ? 'the scroll sent nothing' : `the scroll sent ${others} other message(s)`
        return [{ message: `no valid hello within ${timeout} ms; ${seen}`, eventIndex: null }]
      }
      if (first.event.timestamp > timeout) {
        return [
          {
            message: `hello arrived after ${Math.round(first.event.timestamp)} ms, past the ${timeout} ms timeout`,
            eventIndex: first.index,
          },
        ]
      }
      return []
    },
  },
  {
    id: 'hello-manifest',
    section: '§4',
    summary: 'The scroll id and version in `hello` equal the ones in the manifest.',
    kinds: ['embedded'],
    check: (analysis) =>
      messages(analysis, 'hello').flatMap(({ index, message }) => {
        const { manifest } = analysis.context
        const found: Finding[] = []
        if (message.scroll.id !== manifest.id) {
          found.push({ message: `hello says id "${message.scroll.id}", the manifest says "${manifest.id}"`, eventIndex: index })
        }
        if (message.scroll.version !== manifest.version) {
          found.push({
            message: `hello says version "${message.scroll.version}", the manifest says "${manifest.version}"`,
            eventIndex: index,
          })
        }
        return found
      }),
    skip: noHello,
  },
  {
    id: 'hello-capabilities',
    section: '§5',
    summary: 'The capabilities in `hello` are within what the manifest declares.',
    kinds: ['embedded'],
    check: (analysis) =>
      messages(analysis, 'hello').flatMap(({ index, message }) => {
        const declared = analysis.context.manifest.capabilities
        return message.capabilities
          .filter((capability) => !declared.includes(capability))
          .map((capability) => ({
            message: `hello asks for "${capability}", which the manifest does not declare`,
            eventIndex: index,
          }))
      }),
    skip: noHello,
  },
  {
    id: 'no-premature-message',
    section: '§4',
    summary: 'Until `init` arrives the scroll sends nothing that needs a session.',
    kinds: ['embedded'],
    check: (analysis) => {
      const initIndex = analysis.init?.index ?? Infinity
      return analysis.scroll
        .filter(
          (item) =>
            item.type !== undefined &&
            SESSION_BEARING.has(item.type) &&
            item.index < initIndex &&
            !isForged(analysis, item),
        )
        .map((item) => ({ message: `${item.type} was sent before the host issued a session`, eventIndex: item.index }))
    },
  },
  {
    id: 'session-after-init',
    section: '§2',
    summary: 'After `init`, every message carries the session the host issued.',
    kinds: ['embedded'],
    check: (analysis) => {
      const issued = analysis.init?.session
      return afterInit(analysis)
        .filter((item) => !isForged(analysis, item) && item.session !== issued)
        .map((item) => ({
          message:
            item.session === undefined
              ? `${item.type} carries no session`
              : `${item.type} uses session "${item.session}", the host issued "${issued}"`,
          eventIndex: item.index,
        }))
    },
    skip: (analysis) => {
      if (!analysis.init) return 'the host never sent init'
      return afterInit(analysis).length === 0 ? `the scroll sent nothing after init; ${NEEDS_DRIVE}` : undefined
    },
  },
  spoofRule('origin', 'init-origin-checked', '§3', 'An `init` that comes from another origin is ignored.'),
  spoofRule('source', 'init-source-checked', '§3', 'An `init` that comes from another window is ignored.'),
  spoofRule('nonce', 'init-nonce-checked', '§4', 'An `init` with the wrong nonce is ignored.'),
  spoofRule('replay', 'init-replay-ignored', '§4', 'A second `init` after the first is ignored.'),
  {
    id: 'complete-unit-known',
    section: '§5',
    summary: 'A `complete` names a unit that is in the manifest.',
    kinds: ['embedded'],
    check: (analysis) => {
      const units = analysis.context.manifest.units.map((unit) => unit.id)
      return messages(analysis, 'complete')
        .filter(({ message }) => message.unitId !== undefined && !units.includes(message.unitId))
        .map(({ index, message }) => ({
          message: `complete names unit "${message.unitId}", which is not in the manifest`,
          eventIndex: index,
        }))
    },
    skip: (analysis) =>
      messages(analysis, 'complete').some(({ message }) => message.unitId !== undefined)
        ? undefined
        : `no complete with a unit was observed; ${NEEDS_DRIVE}`,
  },
  {
    id: 'run-granted',
    section: '§7',
    summary: 'The scroll sends `run` only when the host granted the capability.',
    kinds: ['embedded'],
    check: (analysis) =>
      analysis.init?.capabilities.includes('run')
        ? []
        : messages(analysis, 'run').map(({ index }) => ({
            message: 'run was sent but the host did not grant the run capability',
            eventIndex: index,
          })),
    skip: (analysis) => (messages(analysis, 'run').length === 0 ? `no run was observed; ${NEEDS_DRIVE}` : undefined),
  },
  {
    id: 'run-language',
    section: '§13',
    summary: 'The language in `run` is one of the manifest `programmingLanguages`.',
    kinds: ['embedded'],
    check: (analysis) =>
      messages(analysis, 'run')
        .filter(({ message }) => !analysis.context.manifest.programmingLanguages.includes(message.language))
        .map(({ index, message }) => ({
          message: `run asks for language "${message.language}", which the manifest does not list`,
          eventIndex: index,
        })),
    skip: (analysis) => (messages(analysis, 'run').length === 0 ? `no run was observed; ${NEEDS_DRIVE}` : undefined),
  },
  silentRule(
    'host-origin-targeted',
    'foreign-parent',
    '§3',
    'Embedded under a page that is not the host it was told about, the scroll sends nothing (no `*` target).',
    'to a page that is not the host the scroll was told about; its target origin was too broad, for instance "*"',
  ),
  silentRule(
    'standalone-silent',
    'standalone',
    '§9',
    'Without a host the scroll posts nothing.',
    'although there is no host to talk to',
  ),
  {
    id: 'standalone-no-crash',
    section: '§9',
    summary: 'Without a host the scroll keeps working: no uncaught error.',
    kinds: ['standalone'],
    check: (analysis) =>
      (analysis.context.pageErrors ?? []).map((error) => ({
        message: `uncaught error while standalone: ${error}`,
        eventIndex: null,
      })),
  },
]
