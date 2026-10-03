import type { Page } from './static-server.js'

/** The page that embeds the scroll like the real host does, and relays what it receives to the runner. */
export const HOST_PAGE = `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Scroll conformance host</title></head>
  <body style="margin:0">
    <iframe id="scroll-frame" data-testid="scroll-frame" sandbox="allow-scripts allow-same-origin" allow="" style="border:0;width:100%;height:600px"></iframe>
    <script>
      (function () {
        var frameUrl = new URLSearchParams(location.search).get('frame')
        var scrollOrigin = new URL(frameUrl).origin
        var frame = document.getElementById('scroll-frame')

        window.addEventListener('message', function (event) {
          if (event.source !== frame.contentWindow) return
          window.__scRecord({ origin: event.origin, data: event.data })
        })

        window.__scPost = function (message) {
          frame.contentWindow.postMessage(message, scrollOrigin)
        }

        window.__scSpoof = function (spooferOrigin, message) {
          return new Promise(function (resolve) {
            var spoofer = document.createElement('iframe')
            spoofer.style.display = 'none'
            spoofer.onload = function () {
              spoofer.contentWindow.postMessage({ message: message, scrollOrigin: scrollOrigin }, spooferOrigin)
              resolve()
            }
            spoofer.src = spooferOrigin + '/spoofer.html'
            document.body.appendChild(spoofer)
          })
        }

        frame.src = frameUrl
      })()
    </script>
  </body>
</html>
`

/** Loaded in a sibling frame, it posts to the scroll frame from an origin and a window that are not the host's. */
export const SPOOFER_PAGE = `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Scroll conformance spoofer</title></head>
  <body>
    <script>
      window.addEventListener('message', function (event) {
        if (event.source !== window.parent) return
        window.parent.frames[0].postMessage(event.data.message, event.data.scrollOrigin)
      })
    </script>
  </body>
</html>
`

export const REFERENCE_PAGES: Record<string, Page> = {
  '/host.html': { contentType: 'text/html; charset=utf-8', body: HOST_PAGE },
  '/spoofer.html': { contentType: 'text/html; charset=utf-8', body: SPOOFER_PAGE },
}
