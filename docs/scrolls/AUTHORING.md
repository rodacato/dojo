# Authoring a scroll

> **Status:** experimental (protocol v0). The contract is [PROTOCOL.md](PROTOCOL.md); this page is the short path to integrating.

A scroll is a web app you host yourself. It must be served over HTTPS from an origin of its own, and an admin of the Dojo instance registers that exact origin. Dojo will not embed an origin that is not registered.

## What a scroll must do

1. **Publish `scroll.json`** that validates against [`schema/scroll.schema.json`](schema/scroll.schema.json). Give every unit a stable id; renaming one loses users' progress.
2. **Read the host origin** from the `host` query parameter of its URL. If it is missing, or the page is not framed, run standalone.
3. **Send `hello`** with a fresh random nonce, then wait for `init` with the same nonce, from the host origin and from the parent window.
4. **Hydrate** from `init`: locale, theme tokens, previous progress.
5. **Report** with `progress`, `complete` and `resize`. Keep `state` under 64 KiB.
6. **Follow** `setLocale` and `setTheme`.
7. **Keep working with no host.** If `init` never arrives, persist progress locally and post nothing.

Never post with target origin `*`, never trust a message you did not check for origin, source and nonce or session, and never assume `complete` means anything to the host beyond a hint: it is self-reported.

Credentials never go in a scroll. Code execution and `llm` are reserved and not available yet.

## The shim

`scroll-kit` is a single hand-written file that does steps 2 to 7 for you. It is a convenience, not the contract: if it disagrees with the spec, the spec wins, and you can implement the protocol directly in any stack.

```html
<script
  src="https://DOJO_HOST/scroll-kit/v0.js"
  integrity="sha384-..."
  crossorigin="anonymous"
  data-scroll-id="my-scroll"
  data-scroll-version="0.1.0"
  data-capabilities="progress"></script>
<script>
  DojoScroll.onInit(function (init) {
    render(init.locale, init.progress)
  })
  DojoScroll.onLocale(function (locale) { render(locale) })
  DojoScroll.onTheme(function (tokens) { applyTheme(tokens) })

  // when the user finishes a unit
  DojoScroll.progress('unit-1', { step: 3 })
  DojoScroll.complete('unit-1')
  DojoScroll.resize(document.documentElement.scrollHeight)
</script>
```

The `data-*` attributes are the values from your `scroll.json`; the shim sends them in `hello`.

`DojoScroll.run()` and `DojoScroll.llm()` exist and reject with `capability not available`.

**Pin the file with Subresource Integrity.** The shim runs inside your page; without `integrity` a change at the Dojo host would change your code. Compute the hash of the exact file you tested:

```
openssl dgst -sha384 -binary v0.js | openssl base64 -A
```

Standalone, the shim stores progress in `localStorage` under `dojo-scroll:<id>:<unitId>`.

## Checking your work

Validate `scroll.json` against the schema with any JSON Schema validator. Open the scroll directly (no `host` parameter): it should work and post nothing. A conformance suite arrives with scroll-kit v1.
