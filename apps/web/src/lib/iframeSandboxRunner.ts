import type { ExecuteStepResponse, TestResultDTO } from '@dojo/shared'

/**
 * Executes JavaScript code in an isolated iframe sandbox.
 * Used for `javascript-dom` course steps where DOM context is required.
 * No server call — runs entirely in the browser.
 *
 * Security: `sandbox="allow-scripts"` without `allow-same-origin`.
 * The iframe cannot access parent DOM, cookies, or localStorage.
 * See ADR 016 for threat model details.
 */
export function runInIframe(params: {
  starterCode: string
  testCode: string
  timeoutMs?: number
}): Promise<ExecuteStepResponse> {
  const { starterCode, testCode, timeoutMs = 5000 } = params

  return new Promise((resolve) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('sandbox', 'allow-scripts')
    iframe.style.display = 'none'

    let settled = false

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      cleanup()
      resolve({
        passed: false,
        output: 'Execution timed out',
        stdout: '',
        stderr: `Timed out after ${timeoutMs}ms`,
        testResults: [],
        errorKind: 'timeout',
        errorMessage: `Execution timed out after ${timeoutMs}ms — check for infinite loops or long-running work.`,
      })
    }, timeoutMs)

    function handler(event: MessageEvent) {
      if (event.source !== iframe.contentWindow) return
      if (!event.data || event.data.type !== 'test-results') return
      if (settled) return
      settled = true
      clearTimeout(timer)
      cleanup()

      const data = event.data as {
        log: string[]
        failed: boolean
        stdout?: string[]
        stderr?: string[]
        errorKind?: 'runtime'
      }

      const testResults: TestResultDTO[] = data.log.map((line: string) => {
        if (line.startsWith('✓ ')) return { name: line.slice(2), passed: true }
        if (line.startsWith('✗ ')) {
          const rest = line.slice(2)
          const colonIdx = rest.indexOf(': ')
          return colonIdx > -1
            ? { name: rest.slice(0, colonIdx), passed: false, message: rest.slice(colonIdx + 2) }
            : { name: rest, passed: false }
        }
        return { name: line, passed: true }
      })

      const stdout = (data.stdout ?? []).join('\n')
      const stderr = (data.stderr ?? []).join('\n')
      const combined = [stdout, stderr].filter(Boolean).join('\n') || data.log.join('\n')

      resolve({
        passed: !data.failed,
        output: combined,
        stdout,
        stderr,
        testResults,
        ...(data.errorKind ? { errorKind: data.errorKind, errorMessage: stderr || 'Your code crashed before tests could finish.' } : {}),
      })
    }

    function cleanup() {
      window.removeEventListener('message', handler)
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }

    window.addEventListener('message', handler)
    iframe.srcdoc = buildSrcdoc(starterCode, testCode)
    document.body.appendChild(iframe)
  })
}

function buildSrcdoc(starterCode: string, testCode: string): string {
  // Escape </script> inside the injected code to prevent early tag closure
  const safeStarter = starterCode.replace(/<\/script>/gi, '<\\/script>')
  const safeTest = testCode.replace(/<\/script>/gi, '<\\/script>')

  // stdout/stderr capture: override console.log + console.error so the user's
  // own prints show up in the Output panel, separate from the test log.
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
const __stdout = []
const __stderr = []
const __origLog = console.log.bind(console)
const __origErr = console.error.bind(console)
function __stringify(a) {
  try {
    if (typeof a === 'string') return a
    return JSON.stringify(a)
  } catch { return String(a) }
}
console.log = function (...args) {
  __stdout.push(args.map(__stringify).join(' '))
  __origLog(...args)
}
console.error = function (...args) {
  __stderr.push(args.map(__stringify).join(' '))
  __origErr(...args)
}

window.onerror = function(msg) {
  window.parent.postMessage({
    type: 'test-results',
    log: ['\u2717 Runtime error: ' + msg],
    failed: true,
    stdout: __stdout,
    stderr: __stderr.concat(['Runtime error: ' + msg]),
    errorKind: 'runtime'
  }, '*')
  return true
}
try {
${safeStarter}

${safeTest}
} catch(e) {
  const msg = e instanceof Error ? e.message : String(e)
  window.parent.postMessage({
    type: 'test-results',
    log: ['\u2717 Uncaught error: ' + msg],
    failed: true,
    stdout: __stdout,
    stderr: __stderr.concat(['Uncaught error: ' + msg]),
    errorKind: 'runtime'
  }, '*')
}
<\/script>
</body>
</html>`
}
