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

Credentials never go in a scroll. Code execution (`run`) is available to signed-in users, see below; `llm` is reserved and not available yet.

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

`DojoScroll.llm()` exists and rejects with `capability not available`.

## Running code

Declare `"capabilities": ["run"]` in `scroll.json`, list the languages in `programmingLanguages`, and add `run` to `data-capabilities`. The host then runs code for you in its sandbox on the user's session, so you hold no key. It grants `run` only to a signed-in user on an instance with execution enabled; check `init.capabilities` and degrade when it is missing (a read-only example, a "sign in to run this" note).

```js
DojoScroll.onInit(function (init) {
  if (init.capabilities.includes('run')) enableRunButton()
})

DojoScroll.run({
  language: 'ruby',
  files: [{ name: 'main.rb', content: source }, { name: 'helper.rb', content: helper }],
  stdin: 'optional input',
}).then(function (result) {
  // result: { kind, exitCode, stdout, stderr, durationMs }
})
```

- The first file is the entry point. At most 8 files and 64 KiB of content in total; names are flat (no `/`).
- `kind` is `ok`, `compile`, `runtime`, `timeout`, `output-limit` or `unavailable`. The host returns the raw `stdout` and `stderr`: to decide whether the learner's code is right, print something your scroll can read and parse it yourself. The result is never trusted by the host.
- `unavailable` means the sandbox is down, busy, or the user hit the per-minute limit. Offer a retry.
- The promise rejects when `run` was not granted (`capability not available`), when the host answers `capability-denied`, or after 60 seconds without an answer.
- Call `run` from `onInit` or later: before the handshake finishes it rejects.

**Pin the file with Subresource Integrity.** The shim runs inside your page; without `integrity` a change at the Dojo host would change your code. Compute the hash of the exact file you tested:

```
openssl dgst -sha384 -binary v0.js | openssl base64 -A
```

Standalone, the shim stores progress in `localStorage` under `dojo-scroll:<id>:<unitId>`.

## Checking your work

Validate `scroll.json` against the schema with any JSON Schema validator. Open the scroll directly (no `host` parameter): it should work and post nothing.

Then run the [conformance suite](CONFORMANCE.md) against your served scroll. It loads the scroll in a real browser under a reference host, records the messages it sends and lists the rules of the protocol it breaks, each with the section of PROTOCOL.md it comes from:

```bash
node packages/scroll-conformance/dist/bin.js --url https://my-scroll.example/index.html --drive ./drive.mjs
```

Add a `--drive` module that clicks through your scroll so the messages that only appear on interaction (`progress`, `complete`, `run`) are checked too; CONFORMANCE.md shows how.
