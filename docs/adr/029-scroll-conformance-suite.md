# ADR-029: Scroll conformance suite
**Status:** accepted
**Date:** 2026-10-03

## Context
The scroll protocol (ADR 026) is a contract between independent apps and the host. Nothing yet checks that a scroll honours it, and the first real scrolls (Pattern Circuit, Domain Wall) must be checkable before anyone embeds them. A scroll can be written in any stack, so the check has to work from outside it, from the messages it actually sends.

## Decision
- **A new private workspace package, `packages/scroll-conformance`** (`@dojo/scroll-conformance`, ESM, a `dojo-scroll-conformance` binary), built so it could be published later; publishing and its name are the maintainer's call. A package is its own decision because it adds a CLI, a browser dependency and a second implementation of the host side of the protocol.
- **Two layers.** A pure trace validator, `validateTrace(trace, context)`, holds the rules: each has a stable id and the section of PROTOCOL.md it enforces, and a test proves it can fail. A runner loads the scroll in a browser under a reference host, records the trace and hands it to the validator.
- **The browser is a thin adapter** (`BrowserDriver`); Playwright is one implementation and a peer dependency. Scenarios, the reference host and the report run against a fake driver that simulates scrolls in process, which is how the suite is tested, because Chromium does not start in the devcontainer.
- **The reference host is independent of the Dojo web app**, built on the shared Zod schemas. The e2e fixture scroll must pass the suite and Dojo's own e2e spec, which is what keeps the two hosts from drifting.
- **Rules are tested against deliberately broken scrolls**, as static fixtures and as simulations, one per class of failure. A test compares the rule ids in code with those in `docs/scrolls/CONFORMANCE.md`.
- **Skipped is not passed.** A rule that needs an interaction no `--drive` module provided is reported as skipped with the reason.

## Alternatives Considered
- **A browser-only suite:** every rule would need Chromium to be tested, and none of it could be tested here. The pure validator is cheap, fast and usable by a scroll written in another language.
- **Parsing traces by hand:** what every scroll author would do, once, and differently. The suite is that work done once, with the rules written down.
- **A debug mode in the shim:** it only works for scrolls that use the shim, and the shim is not the contract (ADR 026). A scroll that does not use it would be unchecked.
- **jsdom instead of Playwright:** it cannot run WebGL or canvas scrolls such as Pattern Circuit, and it does not model origins, windows and sandboxed frames faithfully, which is what half the rules are about.

## Consequences
Authors get a verdict with rule ids and spec sections, and the spec gets tests. The cost is a second host implementation to keep in step with `scrollHost.ts`, and a browser dependency for the part that matters most. If the runner proves too heavy, the validator stands alone.

## Open questions
- **The real browser path has not run.** Chromium does not start in the devcontainer (libglib is missing), so the Playwright adapter and the two reference pages were checked only through unit tests and a stub DOM. The first run on a machine with Chromium is the real verification.
- **Origin check versus source check.** A forged message can only come from another window, so a scroll that checks only `event.source` passes `init-origin-checked`. The origin check cannot be isolated from the browser side.
- **Strict envelope.** Any message to the host that is not a scroll envelope fails `envelope`, so a library that posts its own messages to `window.parent` fails the suite. Decide whether to ignore messages without a `dojo` field.
- **Session and interaction share one scenario.** Issue 130 listed them separately; without a drive module a scenario for the session would repeat the handshake.
- **Publishing**: the npm name and whether Playwright stays a peer dependency.
- **Revising `scroll-kit`** waits for phases 5 and 8; the suite may suggest what v1 changes.
