import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { runInIframe } from './iframeSandboxRunner'

// The runner creates a hidden iframe, posts a srcdoc into it, and waits for a
// `message` event from that iframe's contentWindow. jsdom never executes the
// srcdoc, so we drive the protocol by hand: capture the iframe element, then
// dispatch synthetic `message` events with a controllable `source`.

let lastIframe: HTMLIFrameElement | null = null
let appendSpy: MockInstance<typeof document.body.appendChild>

beforeEach(() => {
  vi.useFakeTimers()
  lastIframe = null
  appendSpy = vi
    .spyOn(document.body, 'appendChild')
    .mockImplementation((node) => {
      if (node instanceof HTMLIFrameElement) {
        lastIframe = node
        // jsdom leaves contentWindow null for a never-loaded iframe; give the
        // runner's `event.source === iframe.contentWindow` guard a real handle.
        Object.defineProperty(node, 'contentWindow', {
          value: { id: 'sandbox-frame' },
          configurable: true,
        })
      }
      return node
    })
})

afterEach(() => {
  appendSpy.mockRestore()
  vi.useRealTimers()
})

// Dispatch a `message` event whose `source` we force, since jsdom's
// MessageEvent ignores `source` in its init dict.
function postFromSource(source: unknown, data: unknown) {
  const event = new MessageEvent('message', { data })
  Object.defineProperty(event, 'source', { value: source, configurable: true })
  window.dispatchEvent(event)
}

function fakeContentWindow() {
  return (lastIframe as HTMLIFrameElement).contentWindow ?? {}
}

describe('runInIframe — iframe setup', () => {
  it('appends a hidden sandboxed iframe with allow-scripts only (no same-origin)', () => {
    void runInIframe({ starterCode: 'const a = 1', testCode: 'true' })

    expect(lastIframe).not.toBeNull()
    const iframe = lastIframe as HTMLIFrameElement
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts')
    expect(iframe.getAttribute('sandbox')).not.toContain('allow-same-origin')
    expect(iframe.style.display).toBe('none')
  })

  it('injects the starter and test code into the srcdoc', () => {
    void runInIframe({ starterCode: 'const MARKER = 42', testCode: 'assert(MARKER)' })

    const srcdoc = (lastIframe as HTMLIFrameElement).srcdoc
    expect(srcdoc).toContain('const MARKER = 42')
    expect(srcdoc).toContain('assert(MARKER)')
  })

  it('escapes </script> in user code so it cannot close the injected script tag early', () => {
    void runInIframe({
      starterCode: 'const x = "</script><img onerror=alert(1)>"',
      testCode: '</SCRIPT>',
    })

    const srcdoc = (lastIframe as HTMLIFrameElement).srcdoc
    // User code's closing tags are escaped to the backslash form.
    expect(srcdoc).toContain(String.raw`<\/script>`)
    // The only real raw </script> left is the runner's own trailing tag —
    // exactly one. If escaping regressed, the user-supplied tags would add more.
    const rawCloses = srcdoc.match(/<\/script>/gi) ?? []
    expect(rawCloses).toHaveLength(1)
  })
})

describe('runInIframe — event.source security guard', () => {
  it('ignores a test-results message from a DIFFERENT window source', async () => {
    const promise = runInIframe({ starterCode: '', testCode: '', timeoutMs: 1000 })

    // An attacker frame posts a passing result spoofing the protocol.
    postFromSource(
      { not: 'the iframe' },
      { type: 'test-results', failed: false, log: ['✓ spoofed'], tests: [] },
    )

    // The guard must NOT have resolved on the spoof — only the timeout does.
    vi.advanceTimersByTime(1000)
    const result = await promise
    expect(result.errorKind).toBe('timeout')
    expect(result.passed).toBe(false)
  })

  it('accepts the message only from the iframe contentWindow', async () => {
    const promise = runInIframe({ starterCode: '', testCode: '', timeoutMs: 1000 })

    postFromSource(fakeContentWindow(), {
      type: 'test-results',
      failed: false,
      log: ['✓ ok'],
      tests: [{ name: 'ok', passed: true }],
    })

    const result = await promise
    expect(result.passed).toBe(true)
    expect(result.errorKind).toBeUndefined()
  })

  it('ignores messages whose type is not test-results', async () => {
    const promise = runInIframe({ starterCode: '', testCode: '', timeoutMs: 500 })

    postFromSource(fakeContentWindow(), { type: 'console-log', log: ['noise'] })

    vi.advanceTimersByTime(500)
    const result = await promise
    expect(result.errorKind).toBe('timeout')
  })
})

describe('runInIframe — result parsing', () => {
  it('prefers the structured tests[] array, preserving name/passed/message', async () => {
    const promise = runInIframe({ starterCode: '', testCode: '' })

    postFromSource(fakeContentWindow(), {
      type: 'test-results',
      failed: true,
      log: ['ignored legacy line'],
      tests: [
        { name: 'adds', passed: true },
        { name: 'subtracts', passed: false, message: 'expected 2 got 3' },
      ],
    })

    const result = await promise
    expect(result.passed).toBe(false)
    expect(result.testResults).toEqual([
      { name: 'adds', passed: true },
      { name: 'subtracts', passed: false, message: 'expected 2 got 3' },
    ])
  })

  it('falls back to parsing legacy log lines when tests[] is absent', async () => {
    const promise = runInIframe({ starterCode: '', testCode: '' })

    postFromSource(fakeContentWindow(), {
      type: 'test-results',
      failed: true,
      log: ['✓ passes one', '✗ fails two: boom'],
    })

    const result = await promise
    expect(result.testResults).toEqual([
      { name: 'passes one', passed: true },
      { name: 'fails two', passed: false, message: 'boom' },
    ])
  })

  it('parses a failing legacy line with no message (no colon)', async () => {
    const promise = runInIframe({ starterCode: '', testCode: '' })

    postFromSource(fakeContentWindow(), {
      type: 'test-results',
      failed: true,
      log: ['✗ broken'],
    })

    const result = await promise
    expect(result.testResults).toEqual([{ name: 'broken', passed: false }])
  })

  it('joins stdout and stderr into combined output', async () => {
    const promise = runInIframe({ starterCode: '', testCode: '' })

    postFromSource(fakeContentWindow(), {
      type: 'test-results',
      failed: false,
      log: [],
      stdout: ['hello', 'world'],
      stderr: ['warned'],
      tests: [{ name: 't', passed: true }],
    })

    const result = await promise
    expect(result.stdout).toBe('hello\nworld')
    expect(result.stderr).toBe('warned')
    expect(result.output).toBe('hello\nworld\nwarned')
  })

  it('surfaces a runtime errorKind with the stderr as errorMessage', async () => {
    const promise = runInIframe({ starterCode: '', testCode: '' })

    postFromSource(fakeContentWindow(), {
      type: 'test-results',
      failed: true,
      log: ['✗ Runtime error: x is not defined'],
      stderr: ['Runtime error: x is not defined'],
      errorKind: 'runtime',
    })

    const result = await promise
    expect(result.errorKind).toBe('runtime')
    expect(result.errorMessage).toBe('Runtime error: x is not defined')
  })
})

describe('runInIframe — timeout and lifecycle', () => {
  it('resolves with a timeout result after timeoutMs with no message', async () => {
    const promise = runInIframe({ starterCode: 'while(true){}', testCode: '', timeoutMs: 3000 })

    vi.advanceTimersByTime(2999)
    // Not yet — still pending one ms before the deadline.
    vi.advanceTimersByTime(1)

    const result = await promise
    expect(result.errorKind).toBe('timeout')
    expect(result.stderr).toBe('Timed out after 3000ms')
    expect(result.errorMessage).toContain('3000ms')
    expect(result.testResults).toEqual([])
  })

  it('a message arriving after the timeout fired does not override the result', async () => {
    const promise = runInIframe({ starterCode: '', testCode: '', timeoutMs: 100 })
    vi.advanceTimersByTime(100)

    // Late message from the right source — must be ignored (already settled).
    postFromSource(fakeContentWindow(), {
      type: 'test-results',
      failed: false,
      log: [],
      tests: [{ name: 'late', passed: true }],
    })

    const result = await promise
    expect(result.errorKind).toBe('timeout')
  })

  it('cleans up the iframe and the message listener once settled', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const promise = runInIframe({ starterCode: '', testCode: '' })
    const iframe = lastIframe as HTMLIFrameElement
    const removeNodeSpy = vi.spyOn(iframe, 'remove')

    postFromSource(fakeContentWindow(), {
      type: 'test-results',
      failed: false,
      log: [],
      tests: [{ name: 't', passed: true }],
    })
    await promise

    expect(removeSpy).toHaveBeenCalledWith('message', expect.any(Function))
    expect(removeNodeSpy).toHaveBeenCalled()
    removeSpy.mockRestore()
  })

  it('only honors the first valid message — a second one cannot re-resolve', async () => {
    const promise = runInIframe({ starterCode: '', testCode: '' })

    postFromSource(fakeContentWindow(), {
      type: 'test-results',
      failed: false,
      log: [],
      tests: [{ name: 'first', passed: true }],
    })
    postFromSource(fakeContentWindow(), {
      type: 'test-results',
      failed: true,
      log: [],
      tests: [{ name: 'second', passed: false }],
    })

    const result = await promise
    expect(result.passed).toBe(true)
    expect(result.testResults).toEqual([{ name: 'first', passed: true }])
  })
})
