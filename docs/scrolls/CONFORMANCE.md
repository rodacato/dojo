# Scroll conformance suite

> **Status:** experimental, like the protocol it checks. Decision: [ADR 029](../adr/029-scroll-conformance-suite.md). The contract is [PROTOCOL.md](PROTOCOL.md); this suite reads the messages a scroll actually sends and reports which rules of the contract they break.

It works on any scroll, in any stack, hosted anywhere: it needs a URL and the scroll's `scroll.json`, nothing from the scroll's source.

## Run it

The package is `packages/scroll-conformance` in the Dojo repository. It is private for now; build it and call the binary:

```bash
pnpm install
pnpm --filter=@dojo/scroll-conformance build
pnpm exec playwright install chromium   # once, if Playwright has no browser yet

node packages/scroll-conformance/dist/bin.js --url https://my-scroll.example/index.html
```

| Option | Meaning |
|---|---|
| `--url <url>` | Where the scroll is served. Required. |
| `--manifest <file or url>` | The `scroll.json` to check against. Default: `scroll.json` next to `--url`. |
| `--drive <module>` | A module that interacts with the scroll while the trace is recorded, see below. |
| `--json` | Print the report as JSON instead of text. |
| `--timeout <ms>` | How long to wait for `hello` (default 10000, the protocol's handshake timeout). |
| `--settle <ms>` | How long to watch a page once nothing else is going to happen (default 1500). |

Exit code: `0` when no rule failed (skipped rules do not fail), `1` when at least one rule failed, `2` when the suite could not finish (bad arguments, an invalid manifest, a browser that does not start, a `--drive` module that throws).

The runner serves a small reference host on two local origins, loads the scroll in an iframe from its own origin, and runs the scenarios below, each on a fresh page. Playwright is a peer dependency: the browser part is one adapter, and everything else (scenarios, rules, report) runs without a browser.

## Scenarios

| Scenario | What happens |
|---|---|
| `handshake` | The scroll is embedded under the host origin. The reference host answers `hello` with `init`, as the spec says, and watches. |
| `interaction` | The same, then `--drive` interacts with the scroll. Skipped when there is no `--drive`. Also feeds the session rules. If the scroll declares `run`, the host answers `run` with a canned `result`. |
| `spoofed-init:origin` | Before the real `init`, a frame on another origin sends an `init` with the right nonce. |
| `spoofed-init:source` | The same from another window of the host's own origin. |
| `spoofed-init:nonce` | The host window sends an `init` with the wrong nonce. |
| `spoofed-init:replay` | After the real `init`, the host sends a second one. |
| `foreign-parent` | The scroll is embedded under a third origin with `?host=` pointing at the real host. The third origin must receive nothing. |
| `standalone` | The scroll is loaded unframed, and framed with no `host` parameter. It must post nothing and throw nothing. |

If the scroll never says `hello` the embedded scenarios that need a session are skipped and the report says why; the run still finishes after `--timeout`.

## Write a `--drive` module

Messages such as `progress`, `complete`, `resize`, `error` and `run` only appear when someone uses the scroll. Without `--drive` the rules that need them are reported as skipped, with the reason. A drive module is an ES module whose default export receives the Playwright `Page` of the **host** and clicks inside the frame:

```js
export default async function drive(page) {
  const frame = page.frameLocator('#scroll-frame')
  await frame.locator('#progress').click()
  await frame.locator('#complete').click()
}
```

- The iframe has `id="scroll-frame"` and `data-testid="scroll-frame"`.
- The module runs once per scenario that uses it (`interaction` and each `spoofed-init:*`), each on a fresh page, so it has to be repeatable and finish by itself.
- Wait for what you click to exist; the scroll may still be starting.
- A thrown error stops that scenario and the run exits with `2`.
- Drive the paths you want checked: finish a unit, report progress, resize, and press whatever runs code. A `run` the scroll sends is checked against the manifest and the granted capabilities.

A working example is `packages/scroll-conformance/fixtures/drive-e2e-fixture.mjs`, for the fixture scroll in `apps/e2e/fixtures/scroll`.

## Rules

Every rule has a stable id and points at the section of [PROTOCOL.md](PROTOCOL.md) it enforces. A test fails when this table and the rules in the code differ.

| Rule | Section | What it checks | Needs |
|---|---|---|---|
| `envelope` | §2 | A message that carries a `dojo` field is a valid envelope: `dojo: "scroll"` and the protocol version. | |
| `message-schema` | §5 | Every message validates against the schema of its type, including the 64 KiB `state` cap and the `resize` range. | |
| `reserved-type` | §7 | The scroll never sends a message type the protocol reserves (`llm`). | |
| `hello-sent` | §4 | The scroll sends a valid `hello` within the handshake timeout. | |
| `hello-manifest` | §4 | The scroll id and version in `hello` equal the manifest's. | |
| `hello-capabilities` | §5 | The capabilities in `hello` are within what the manifest declares. | |
| `no-premature-message` | §4 | Until `init` arrives the scroll sends nothing that needs a session. | |
| `session-after-init` | §2 | After `init`, every message carries the session the host issued. | a message after `init` |
| `init-origin-checked` | §3 | An `init` that comes from another origin is ignored. | a message after `init` |
| `init-source-checked` | §3 | An `init` that comes from another window is ignored. | a message after `init` |
| `init-nonce-checked` | §4 | An `init` with the wrong nonce is ignored. | a message after `init` |
| `init-replay-ignored` | §4 | A second `init` after the first is ignored. | a message after `init` |
| `complete-unit-known` | §5 | A `complete` names a unit that is in the manifest. | a `complete` with a unit |
| `run-granted` | §7 | The scroll sends `run` only when the host granted the capability. | a `run` |
| `run-language` | §13 | The language in `run` is one of the manifest's `programmingLanguages`. | a `run` |
| `host-origin-targeted` | §3 | Embedded under a page that is not the host it was told about, the scroll sends nothing (no `*` target). | |
| `standalone-silent` | §9 | Without a host the scroll posts nothing. | |
| `standalone-no-crash` | §9 | Without a host the scroll keeps working: no uncaught error. | |

A message with no `dojo` field is not a protocol message (an HMR client, analytics or a library posting to `window.parent`): the host ignores it, so every rule ignores it too. It stays in the trace and the report counts it (`ignoredMessages` in JSON, a line in the text report) so you can see it. A message that does carry a `dojo` field and is invalid, with another `dojo` value, another `v`, a bad shape or a reserved type, still fails.

A rule that needs something the run did not produce is reported as `skipped` with the reason, never as passed. The four `init-*` rules can only be judged once the scroll sends something carrying a session, so give `--drive` a click that makes it do so (or have the scroll report progress on its own once `init` arrives).

## Read a report

```
PASS  envelope              PROTOCOL §2
FAIL  hello-sent            PROTOCOL §4
      [handshake] no valid hello within 10000 ms; the scroll sent nothing
SKIP  run-granted           PROTOCOL §7
      no run was observed; supply a --drive module so the scroll sends it
```

With `--json` the report has `scroll`, `passed`, `counts`, `rules` (each with `id`, `section`, `status` of `pass`, `fail` or `skipped`, `violations` and `reason`) and `scenarios`. A violation carries the scenario, the message and `eventIndex`, the position of the offending message in that scenario's trace.

The pure part is usable without a browser: `validateTrace(trace, context)` takes the ordered messages between a host and a scroll (direction, the origin the receiver saw, the raw data, a timestamp) and returns the violated rules. A scroll written in another language can record its own trace and use it.

## What it cannot check

A trace shows what crossed the wire, so these stay out of reach:

- **Honor-code concerns.** The protocol cannot observe whether a scroll tracks users, reaches other servers, or reports completion honestly; completion is self-reported and never feeds belts.
- **UI quality, accessibility and pedagogy.** Whether a scroll teaches well or looks right is not a message.
- **Unguessable nonces.** Only the minimum length is checked.
- **That the origin check exists apart from the source check.** A forged message can only come from another window, so a scroll that checks only `event.source` passes `init-origin-checked`. The spec asks for both.
- **Behaviour the run did not exercise.** Anything the drive module never triggers is reported as skipped, not as fine.
- **Host behaviour.** The reference host follows the spec; it does not check Dojo's own host.
- **`setLocale` and `setTheme`.** The scroll is not obliged to answer them, so there is nothing to observe.

## Extending the suite

A new rule is an entry in `packages/scroll-conformance/src/rules.ts`, a hand-built broken trace in `validate.test.ts`, and a row in the table above. Scenarios live in `scenarios.ts`. The deliberately broken scrolls in `packages/scroll-conformance/fixtures/` (`node packages/scroll-conformance/fixtures/serve.mjs` serves them on port 4020) are what keeps the suite honest: one per class of failure, each tested to fail with its rule.
