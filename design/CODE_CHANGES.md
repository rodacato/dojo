# Code changes — consolidations decided in design, pending in code

> The WORK ORDER for landing design-side decisions in code. A `D<n>` entry records the
> finding and the decision; this doc tracks its **execution**. The kit mirrors the CURRENT
> code until each change lands — then the kit bumps.

Decisions D42 and D46 landed in code (the `accent-text`, `danger-text`, `success-text` and `warning-text` tokens exist in `apps/web/src/styles/main.css`); the candidates below are still undecided findings (see
[DECISIONS.md](DECISIONS.md)). Entries land in the table once Adrian decides, each with measured usage.

| Layer / value | Real consumers (measured) | Verdict |
|---|---|---|
| — | — | — |

## Candidates, in suggested order

1. **Focus-visible on form controls** (D5, D6) — pending a decision.
2. **Theme the hardcoded colors** (D7) — Modal overlay (`bg-black/60`).
3. **Type scale** (D4) — one-line fix in `apps/web/src/styles/main.css`.
4. **Dead code and routes** (D10, D11) — `LoginPage.tsx`, `/error`.
