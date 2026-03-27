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
        testResults: [{ name: 'Execution', passed: false, message: `Timed out after ${timeoutMs}ms` }],
      })
    }, timeoutMs)

    function handler(event: MessageEvent) {
      if (event.source !== iframe.contentWindow) return
      if (!event.data || event.data.type !== 'test-results') return
      if (settled) return
      settled = true
      clearTimeout(timer)
      cleanup()

      const { log, failed } = event.data as { log: string[]; failed: boolean }
      const testResults: TestResultDTO[] = log.map((line: string) => {
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

      resolve({
        passed: !failed,
        output: log.join('\n'),
        testResults,
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

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
window.onerror = function(msg) {
  window.parent.postMessage({
    type: 'test-results',
    log: ['\u2717 Runtime error: ' + msg],
    failed: true
  }, '*')
  return true
}
try {
${safeStarter}

${safeTest}
} catch(e) {
  window.parent.postMessage({
    type: 'test-results',
    log: ['\u2717 Uncaught error: ' + (e instanceof Error ? e.message : String(e))],
    failed: true
  }, '*')
}
<\/script>
</body>
</html>`
}
