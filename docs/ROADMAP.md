# Roadmap

> **Status:** Canonical · **Last reviewed:** 2026-11-02

Where dojo is going, what is built, and what it will not do. No dates: this is a personal project. Work state (planned, in progress, done) lives in GitHub issues, milestones and the project board, see [Tracking Work](WORKFLOW.md#tracking-work). Past decisions live in [`adr/`](adr/).

---

## Direction

Dojo is self-hosted open source: a daily practice dojo plus a small learning hub, run by an operator for the people they invite ([ADR 024](adr/024-self-hosted-hub-pivot.md)). There is no hosted service to open. The original plan (invited users, a leaderboard, user-proposed exercises) is history; the leaderboard is gone ([ADR 020](adr/020-ubiquitous-language-pass.md)).

## What is built

- **The daily loop:** one blind micro kata a day, about five minutes, then the sensei's review ([ADR 031](adr/031-surprise-daily-kata.md)). Longer kata sit under Advanced.
- **The sensei:** a streamed evaluation that grades reasoning, with a painted avatar beside the review that never reacts to the verdict ([ADR 033](adr/033-sensei-art.md)).
- **Recognition:** belts derived from practice history, milestones, and `/belts` as an illustrated room of what you earned ([ADR 032](adr/032-belts-room.md)).
- **Scrolls:** external apps embedded by iframe, with Dojo as a minimal host ([ADR 025](adr/025-external-embedded-scrolls.md) to [029](adr/029-scroll-conformance-suite.md)).
- **The Paper UI:** every signed-in screen on one rail, bottom navigation and focused header, in Washi and Sumi.

## Where it is going

Each milestone is defined by what becomes possible:

- **M1 — Reposition:** practice becomes optional rather than the forced front door, and dojo installs as a PWA.
- **M2 — Knowledge/Library hub:** long-form guides and bookmarks as their own bounded context.
- **M4 — External scrolls:** the epic stays open until the host is closed out.

Gated work from the Paper revamp (choosing a kata, the operator screens, designs for the other answer formats) waits for its own decision. It is tracked on the board, not here.

---

## Not Doing

Evaluated and discarded, recorded so the debate does not happen again.

- **Dojocho** (a kata curation tool at scale): complexity not justified.
- **Team dojos** (shared practice spaces for engineering teams): contradicts individual practice.
- **A native mobile app:** the web app, installable as a PWA, covers the phone.
- **AI-generated katas on demand:** quality is too variable to guarantee the sensei's standard. The daily kata picks from the published catalog.
- **Timed competitions:** contradicts "practice over competition".
- **Certificates or badges for employers:** not the purpose of the product.

---

## Principles That Guide Prioritization

1. **Use it before building around it.** Nothing is built on top of a feature until that feature is in real daily use.
2. **The loop comes first.** The kata → evaluation → analysis is the product. Everything else is context.
3. **Complexity is the enemy.** If a feature requires the user to think about the product instead of the practice, it is probably wrong.
4. **The sensei's honesty is sacred.** No feature that softens, gamifies, or incentivizes the evaluator to be kinder than it should be.
