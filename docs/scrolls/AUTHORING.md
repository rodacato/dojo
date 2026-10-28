# Authoring a scroll

> **Status:** experimental (protocol v0). The contract is [PROTOCOL.md](PROTOCOL.md); this page is the path from "I have a web app" to "it runs inside Dojo".

A scroll is a web app you host yourself. It must be served over HTTPS from an origin of its own, and the operator of the Dojo instance registers that exact origin. Dojo will not embed an origin that is not registered.

The path, in order: start from the reference scroll, make your app do what the protocol asks (by hand or with the kit), pass the conformance suite, then register it in a Dojo instance.

## Start from the reference scroll

[`apps/e2e/fixtures/reference-scroll`](../../apps/e2e/fixtures/reference-scroll) is a complete scroll in one HTML file with no build step: it uses every message of protocol v0 (handshake, progress with state, complete, resize, locale, code execution and its absence) and still works with no host. Dojo's own CI audits it on every pull request and drives it inside the real web app, so it is known to work with the current host.

| File | What it is |
|---|---|
| `index.html` | The scroll. Copy it as your starting point. |
| `scroll.json` | Its manifest. |
| `drive.mjs` | The module that clicks through it for the conformance suite. |
| `serve.mjs` | A static server for local work, on port 4010. |

From a clone of this repository:

```bash
pnpm install
node apps/e2e/fixtures/reference-scroll/serve.mjs   # open http://localhost:4010 to see it standalone
pnpm --filter=@dojo/e2e conformance                 # serves it and audits it: 18 rules, 0 failed
```

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

## The kit

`scroll-kit` is a single hand-written file that does steps 2 to 7 for you and exposes them as `DojoScroll`. It is a convenience, not the contract: if it disagrees with the spec, the spec wins, and you can implement the protocol directly in any stack.

Load it one of two ways. From the Dojo instance you integrate with, as below, pinned with Subresource Integrity. Or serve a copy from your own origin, as the reference scroll does: a change or an outage at the Dojo host then never touches your page, and you update the copy when you choose. Either way the kit finds the host from the `host` query parameter, not from where it was loaded. How the kit is distributed may change while the protocol is v0.

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

Open the scroll directly (no `host` parameter): it should work and post nothing.

Then run the [conformance suite](CONFORMANCE.md) against your served scroll. It validates `scroll.json` against the schema, loads the scroll in a real browser under a reference host, records the messages it sends and lists the rules of the protocol it breaks, each with the section of PROTOCOL.md it comes from. The package is not published yet, so run it from a clone of this repository:

```bash
pnpm install
pnpm --filter=@dojo/scroll-conformance... build
node packages/scroll-conformance/dist/bin.js --url https://my-scroll.example/index.html --drive ./drive.mjs
```

Write a `--drive` module that clicks through your scroll so the messages that only appear on interaction (`progress`, `complete`, `run`) are checked too. The reference scroll's `drive.mjs` is a working one; CONFORMANCE.md explains the rules for writing it. A scroll is ready to register when no rule fails and none of the rules about what you use is skipped.

## Register it in a Dojo instance

Registration is the operator's job, on their instance:

1. Add the scroll's exact origin to `SCROLL_FRAME_ORIGINS` and redeploy. Both the API and the web container read it ([README](../../README.md#scrolls), [deploy guide](../ops/deploy.md)).
2. Sign in as the creator, open `/admin/scrolls`, choose a slug and paste the `scroll.json`. The API refuses a manifest that fails the schema or whose `entry` origin is not in the list.
3. The scroll starts as a draft and public. Publish it there; it is then at `/scrolls/<slug>`. Make it private to show it only to signed-in users.

Give every scroll its own origin. Scrolls that share an origin share `localStorage`, and every project page of one GitHub account sits on the same `<user>.github.io` origin.

## Try it against a local Dojo

To see your scroll inside a real host before anyone registers it, run Dojo locally ([README](../../README.md#run-your-own) has the setup) and allow your local origin. `http://localhost` is accepted outside production:

```bash
# in Dojo's .env
SCROLL_FRAME_ORIGINS="http://localhost:4010"
```

Then `pnpm dev`, sign in as the creator, and register your `scroll.json` with `entry` pointing at your local server. Code execution also needs `FF_CODE_EXECUTION_ENABLED` on; the Dev Container already runs Piston.
