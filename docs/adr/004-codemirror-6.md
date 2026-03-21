# ADR-004: CodeMirror 6 as the code editor for CODE kata

**Status:** Accepted
**Date:** 2026-03-21
**Deciders:** Tomás Ríos (frontend architecture), Soren Bachmann (UX)

---

## Context

The CODE kata type requires an in-browser code editor. The editor must:
- Display syntax-highlighted code with line numbers
- Disable autocomplete (the dojo is an honor-code, no hints)
- Disable autocorrect and spell check
- Be keyboard-navigable
- Not add significant bundle size to the React app

Three options were evaluated:

1. **Monaco Editor** — VS Code's editor, full-featured, large bundle (~3MB gzipped)
2. **CodeMirror 6** — modular, configurable, smaller footprint (~250KB with essential extensions)
3. **Plain `<textarea>`** — zero dependency, no syntax highlighting, no line numbers

---

## Decision

**Use CodeMirror 6.**

---

## Rationale

**Monaco is too heavy.** At 3MB+, Monaco would significantly impact the app's initial load time — unacceptable for a focused practice tool where loading performance matters. Monaco also comes with many default behaviors (autocomplete, IntelliSense, hover docs) that would need to be disabled — a configuration exercise against the grain.

**Plain `<textarea>` is too primitive.** Without line numbers or syntax highlighting, CODE kata becomes significantly harder to read and write. The editor is not just a textarea — it's part of the kata experience.

**CodeMirror 6** is:
- Modular — import only what's needed (syntax highlighting for the relevant language, basic setup)
- Configurable — autocomplete can be fully disabled, spell check is a browser attribute, and all "assistant" features can be turned off
- Approximately 250KB for the base + one language extension — acceptable
- Well-maintained and used in production by CodeSandbox, Replit, and others

**Disabled features (required):**
- `autocompletion()` extension: not included
- `bracketMatching()`: optional, but could be kept (doesn't hint at correctness, just pairs brackets)
- Browser `autocorrect="off"`, `autocapitalize="off"`, `spellcheck="false"` on the editor element
- No IntelliSense, no hover docs, no format-on-save

---

## Consequences

- **Positive:** Syntax highlighting with line numbers at reasonable bundle size
- **Positive:** Full control over which extensions are included — no features by default
- **Positive:** Accessible — CodeMirror 6 has strong keyboard navigation and screen reader support
- **Negative:** Learning curve — CodeMirror 6's extension API is less intuitive than Monaco's
- **Negative:** Language support requires individual packages (`@codemirror/lang-python`, etc.)
- **Trade-off accepted:** Bundle size is the decisive factor. A 12x size increase (Monaco vs. CodeMirror) is not justified for an editor that intentionally limits features.
